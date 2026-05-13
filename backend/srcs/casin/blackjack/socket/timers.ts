import { Server, Namespace } from 'socket.io';
import { BETTING_PHASE_DURATION_MS, SETTLEMENT_DURATION_MS, TURN_DURATION_MS } from '../constants';
import { autoStandCurrentTurn, finalizeBettingTimeout, startNextBettingPhaseFromSettlement } from '../roundEngine';
import type { BJTable, RoundResultPayload } from '../types';
import type { WalletUpdate } from '../walletPersistence';
import logger from '../../../lib/logger';

// Timer state management
export const phaseTimerHandles = new Map<string, ReturnType<typeof setTimeout>>();
export const phaseTimerModes = new Map<string, 'waiting' | 'betting'>();
export const phaseTimerEndsAt = new Map<string, number>();
export const turnTimerHandles = new Map<string, ReturnType<typeof setTimeout>>();
export const turnTimerEndsAt = new Map<string, number>();
export const settlementTimerHandles = new Map<string, ReturnType<typeof setTimeout>>();

// Callbacks injected at setup
let emitTableState: ((io: Server | Namespace, table: BJTable) => void) | null = null;
let emitRoundResult: ((io: Server | Namespace, table: BJTable, results: RoundResultPayload['results']) => void) | null = null;
let emitWalletUpdates: ((io: Server | Namespace, table: BJTable, updates: WalletUpdate[]) => void) | null = null;

export function setEmitterCallbacks(
  tableState: (io: Server | Namespace, table: BJTable) => void,
  roundResult: (io: Server | Namespace, table: BJTable, results: RoundResultPayload['results']) => void,
  walletUpdates: (io: Server | Namespace, table: BJTable, updates: WalletUpdate[]) => void,
): void {
  emitTableState = tableState;
  emitRoundResult = roundResult;
  emitWalletUpdates = walletUpdates;
}

export function clearPhaseTimer(tableId: string): void {
  const handle = phaseTimerHandles.get(tableId);
  if (handle) {
    clearTimeout(handle);
  }

  phaseTimerHandles.delete(tableId);
  phaseTimerModes.delete(tableId);
  phaseTimerEndsAt.delete(tableId);
}

export function clearTurnTimer(tableId: string): void {
  const handle = turnTimerHandles.get(tableId);
  if (handle) {
    clearTimeout(handle);
  }

  turnTimerHandles.delete(tableId);
  turnTimerEndsAt.delete(tableId);
}

export function clearAllTimers(tableId: string): void {
  clearPhaseTimer(tableId);
  clearTurnTimer(tableId);
  clearSettlementTimer(tableId);
}

export function clearSettlementTimer(tableId: string): void {
  const handle = settlementTimerHandles.get(tableId);
  if (handle) {
    clearTimeout(handle);
  }

  settlementTimerHandles.delete(tableId);
}

export function restartTurnTimer(io: Server | Namespace, table: BJTable): void {
  clearTurnTimer(table.id);

  if (table.state !== 'playing' || table.currentTurnSeatIndex === null) {
    return;
  }

  if (!turnTimerHandles.has(table.id)) {
    scheduleTurnTimer(io, table);
  }
}

export function syncTimers(io: Server | Namespace, table: BJTable): void {
  if (table.players.length === 0 && table.pendingPlayers.length === 0) {
    clearAllTimers(table.id);
    return;
  }

  if (table.state === 'waiting') {
    clearAllTimers(table.id);
    return;
  }

  if (table.state === 'betting') {
    clearTurnTimer(table.id);
    const phaseTimerMode = phaseTimerModes.get(table.id) || null;
    if (phaseTimerMode !== table.state || !phaseTimerHandles.has(table.id)) {
      schedulePhaseTimer(io, table);
    }
    return;
  }

  if (table.state === 'playing') {
    clearPhaseTimer(table.id);
    clearSettlementTimer(table.id);
    if (table.currentTurnSeatIndex === null) {
      clearTurnTimer(table.id);
      return;
    }

    if (!turnTimerHandles.has(table.id)) {
      scheduleTurnTimer(io, table);
    }
    return;
  }

  if (table.state === 'settling') {
    clearPhaseTimer(table.id);
    clearTurnTimer(table.id);
    if (!settlementTimerHandles.has(table.id)) {
      scheduleSettlementTimer(io, table);
    }
    return;
  }

  clearAllTimers(table.id);
}

function getDealerFinalRevealDelayMs(table: BJTable): number {
  const cardCount = table.dealerHand.length;
  const DEALER_DRAW_STEP_MS = 750;

  if (cardCount <= 1) {
    return 0;
  }

  // Hidden hole-card reveal uses the same step cadence as dealer draws.
  if (cardCount === 2) {
    return DEALER_DRAW_STEP_MS;
  }

  // Dealer reveals one card every 750ms:
  // - hole card reveal at 750ms
  // - then cards[2+] at 1500ms, 2250ms, ...
  return (cardCount - 1) * DEALER_DRAW_STEP_MS;
}

function scheduleSettlementTimer(io: Server | Namespace, table: BJTable): void {
  clearSettlementTimer(table.id);

  if (table.state !== 'settling') {
    return;
  }

  const dealerFinalRevealDelayMs = getDealerFinalRevealDelayMs(table);
  const duration = SETTLEMENT_DURATION_MS + dealerFinalRevealDelayMs;
  // Settlement timer starts observation AFTER dealer final reveal/draw.
  // Total = reveal delay + observation window.
  // After settlement completes, startNextBettingPhaseFromSettlement() transitions to betting state
  // Then the betting phase timer (phaseTimerEndsAt) starts in the emitTableState call below
  const handle = setTimeout(() => {
    settlementTimerHandles.delete(table.id);

    if (!emitTableState || !emitRoundResult || !emitWalletUpdates) {
      logger.error('[Blackjack] Emitter callbacks not initialized');
      return;
    }

    try {
      if (table.state !== 'settling') {
        syncTimers(io, table);
        return;
      }

      if (startNextBettingPhaseFromSettlement(table)) {
        // Transition to betting state completes, which triggers syncTimers → schedulePhaseTimer
        // This ensures betting timer only starts AFTER settlement observation ends (3s)
        emitTableState(io, table);
        return;
      }

      emitTableState(io, table);
    } catch (error) {
      logger.error(`[Blackjack] settlement timer failed for table ${table.id}: ${error instanceof Error ? error.message : String(error)}`);
      syncTimers(io, table);
    }
  }, duration);

  settlementTimerHandles.set(table.id, handle);
}

function schedulePhaseTimer(io: Server | Namespace, table: BJTable): void {
  clearPhaseTimer(table.id);

  if (table.state !== 'betting') {
    return;
  }

  const duration = BETTING_PHASE_DURATION_MS;
  phaseTimerModes.set(table.id, 'betting');
  phaseTimerEndsAt.set(table.id, Date.now() + duration);

  const handle = setTimeout(async () => {
    phaseTimerHandles.delete(table.id);
    phaseTimerEndsAt.delete(table.id);

    if (!emitTableState || !emitRoundResult || !emitWalletUpdates) {
      logger.error('[Blackjack] Emitter callbacks not initialized');
      return;
    }

    try {
      if (table.state === 'betting') {
        const timeoutResult = await finalizeBettingTimeout(table);
        if (timeoutResult) {
          emitRoundResult(io, table, timeoutResult.results);
          emitWalletUpdates(io, table, timeoutResult.walletUpdates);
        }

        emitTableState(io, table);
      }
    } catch (error) {
      logger.error(`[Blackjack] phase timer failed for table ${table.id}: ${error instanceof Error ? error.message : String(error)}`);
      syncTimers(io, table);
    }
  }, duration);

  phaseTimerHandles.set(table.id, handle);
}

function scheduleTurnTimer(io: Server | Namespace, table: BJTable): void {
  clearTurnTimer(table.id);

  if (table.state !== 'playing' || table.currentTurnSeatIndex === null) {
    return;
  }

  turnTimerEndsAt.set(table.id, Date.now() + TURN_DURATION_MS);

  const handle = setTimeout(async () => {
    turnTimerHandles.delete(table.id);
    turnTimerEndsAt.delete(table.id);

    if (!emitTableState || !emitRoundResult || !emitWalletUpdates) {
      logger.error('[Blackjack] Emitter callbacks not initialized');
      return;
    }

    try {
      if (table.state !== 'playing' || table.currentTurnSeatIndex === null) {
        syncTimers(io, table);
        return;
      }

      const socketId = getCurrentTurnSeatSocketId(table);
      if (!socketId) {
        logger.warn(`[Blackjack] Missing socket for current turn on table ${table.id}. Applying server auto-stand fallback.`);
      }

      const result = await autoStandCurrentTurn(table);
      if (!result.accepted) {
        syncTimers(io, table);
        return;
      }

      if (result.roundEnded) {
        emitRoundResult(io, table, result.results);
        emitWalletUpdates(io, table, result.walletUpdates);
      }

      emitTableState(io, table);
    } catch (error) {
      logger.error(`[Blackjack] turn timer failed for table ${table.id}: ${error instanceof Error ? error.message : String(error)}`);
      syncTimers(io, table);
    }
  }, TURN_DURATION_MS);

  turnTimerHandles.set(table.id, handle);
}

function getCurrentTurnSeatSocketId(table: BJTable): string | null {
  if (table.currentTurnSeatIndex === null) {
    return null;
  }

  const seat = table.players.find((player) => player.seatIndex === table.currentTurnSeatIndex) || null;
  return seat ? seat.socketId : null;
}
