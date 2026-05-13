import { Server, Namespace, Socket } from 'socket.io';
import { handValue } from '../deck';
import { BJ_EVENTS } from '../events';
import type { BJTable, RoundResultPayload, TableStatePayload } from '../types';
import type { WalletUpdate } from '../walletPersistence';
import { phaseTimerEndsAt, phaseTimerModes, turnTimerEndsAt, syncTimers } from './timers';

type Emitter = {
  emit: (event: string, payload: unknown) => void;
};

export function emitToRoom(io: Server | Namespace, roomId: string, event: string, payload: unknown): void {
  const roomEmitter: Emitter = io.to(roomId) as unknown as Emitter;
  roomEmitter.emit(event, payload);
}

export function emitToSocket(socket: Socket, event: string, payload: unknown): void {
  const socketEmitter: Emitter = socket as unknown as Emitter;
  socketEmitter.emit(event, payload);
}

export function emitError(socket: Socket, message: string): void {
  emitToSocket(socket, BJ_EVENTS.ERROR, { message });
}

export function buildTableStatePayload(table: BJTable): TableStatePayload {
  const shouldHideDealerHoleCard = table.state === 'betting' || table.state === 'playing';
  const visibleDealerHand = shouldHideDealerHoleCard ? table.dealerHand.slice(0, 1) : table.dealerHand;
  const phaseTimerType = (table.state === 'waiting' || table.state === 'betting') && phaseTimerEndsAt.has(table.id)
    ? (phaseTimerModes.get(table.id) || table.state)
    : null;

  return {
    tableId: table.id,
    state: table.state,
    maxPlayers: table.maxPlayers,
    roundNumber: table.roundNumber,
    dealerHand: visibleDealerHand,
    dealerScore: handValue(visibleDealerHand),
    currentTurnSeatIndex: table.currentTurnSeatIndex,
    deckRemaining: table.deck.length,
    players: table.players,
    pendingPlayers: table.pendingPlayers,
    phaseTimerEndsAt: phaseTimerEndsAt.get(table.id) ?? null,
    phaseTimerType,
    turnTimerEndsAt: turnTimerEndsAt.get(table.id) ?? null,
  };
}

export function emitTableState(io: Server | Namespace, table: BJTable): void {
  syncTimers(io, table);
  emitToRoom(io, table.id, BJ_EVENTS.TABLE_STATE, buildTableStatePayload(table));
}

export function emitRoundResult(io: Server | Namespace, table: BJTable, results: RoundResultPayload['results']): void {
  const dealerHandFromResults = results.length > 0 ? results[0].dealerHand : table.dealerHand;
  const payload: RoundResultPayload = {
    tableId: table.id,
    roundNumber: table.roundNumber,
    dealerHand: dealerHandFromResults,
    dealerScore: handValue(dealerHandFromResults),
    results,
  };

  emitToRoom(io, table.id, BJ_EVENTS.ROUND_RESULT, payload);
}

export function emitWalletUpdates(io: Server | Namespace, table: BJTable, walletUpdates: WalletUpdate[]): void {
  if (walletUpdates.length === 0) {
    return;
  }

  for (const update of walletUpdates) {
    const seat = table.players.find((player) => player.userId === update.userId)
      || table.pendingPlayers.find((player) => player.userId === update.userId)
      || null;

    if (!seat) {
      continue;
    }

    emitToRoom(io, seat.socketId, BJ_EVENTS.WALLET_UPDATE, {
      userId: update.userId,
      balance: update.balance,
      delta: update.delta,
      reason: update.reason,
    });
  }
}
