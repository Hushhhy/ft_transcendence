import { drawCard, handValue, isBlackjack, isBust } from './deck';
import { promotePendingPlayers } from './tableManager';
import type { BJTable, RoundResult } from './types';
import { MIN_BET, MAX_BET } from './constants';
import logger from '../../lib/logger';

import { applyBetWalletUpdate, applyPayoutWalletUpdate, type WalletUpdate } from './walletPersistence';
import { recordBlackjackRoundHistory } from './roundHistoryPersistence';
import {
  acceptAction,
  acceptEndedAction,
  allBetsPlaced,
  computeOutcomeAndPayout,
  createShoe,
  getCurrentTurnSeat,
  getOrderedPlayers,
  rejectAction,
  resetRoundState,
  setNextTurnOrFinish,
} from './roundEngine.utils';
import type { RoundActionResult, SettleRoundResult } from './roundEngine.utils';

export type { RoundActionResult, SettleRoundResult } from './roundEngine.utils';

async function dealInitialHands(table: BJTable, requireAllBets: boolean): Promise<SettleRoundResult | null> {
  if (table.state !== 'betting') {
    return null;
  }

  const activePlayers = getOrderedPlayers(table).filter((seat) => seat.bet > 0);
  if (activePlayers.length === 0) {
    return null;
  }

  if (requireAllBets && !allBetsPlaced(table)) {
    return null;
  }

  if (!requireAllBets) {
    for (const seat of table.players) {
      if (seat.bet <= 0) {
        seat.done = true;
        seat.hand = [];
        seat.stood = true;
      }
    }
  }

  table.state = 'playing';
  table.dealerHand = [drawCard(table.deck), drawCard(table.deck)];

  for (let round = 0; round < 2; round += 1) {
    for (const seat of activePlayers) {
      seat.hand.push(drawCard(table.deck));
    }
  }

  for (const seat of activePlayers) {
    if (isBlackjack(seat.hand)) {
      seat.blackjack = true;
      seat.done = true;
    }
  }

  table.currentTurnSeatIndex = activePlayers.find((seat) => !seat.done && !seat.busted)?.seatIndex ?? null;

  if (table.currentTurnSeatIndex === null) {
    return settleRound(table);
  }

  return null;
}

export function startBettingPhase(table: BJTable): boolean {
  if (table.state !== 'waiting') {
    return false;
  }

  promotePendingPlayers(table);
  if (table.players.length === 0) {
    return false;
  }

  table.roundNumber += 1;
  table.state = 'betting';
  table.deck = createShoe();
  resetRoundState(table);
  return true;
}

function restartBettingPhase(table: BJTable): boolean {
  if (table.state !== 'betting') {
    return false;
  }

  table.deck = createShoe();
  resetRoundState(table);
  return true;
}

export async function finalizeBettingTimeout(table: BJTable): Promise<SettleRoundResult | null> {
  if (table.state !== 'betting') {
    return null;
  }

  const hasAtLeastOneBet = table.players.some((seat) => seat.bet > 0);
  const result = await dealInitialHands(table, false);
  if ((table.state as string) === 'playing') {
    return result;
  }

  if (result) {
    return result;
  }

  if (!hasAtLeastOneBet) {
    if (table.players.length > 0) {
      restartBettingPhase(table);
    } else {
      table.state = 'waiting';
      resetRoundState(table);
    }
  }

  return null;
}

export async function placeBet(table: BJTable, socketId: string, amount: number): Promise<RoundActionResult> {
  if (table.state !== 'betting') {
    return rejectAction();
  }

  const seat = table.players.find((entry) => entry.socketId === socketId);
  if (!seat || !Number.isFinite(amount) || !Number.isInteger(amount)) {
    return rejectAction();
  }

  // Allow reset to 0 (UI reset during betting phase)
  if (amount === 0) {
    const resetDelta = -seat.bet;
    if (resetDelta < 0) {
      try {
        const walletUpdate = await applyBetWalletUpdate(seat.userId, resetDelta, table.roundNumber);
        if (!walletUpdate) {
          return rejectAction();
        }
        seat.bet = 0;
        return acceptAction([walletUpdate]);
      } catch (error) {
        logger.error(`[Blackjack] placeBet reset failed: ${error instanceof Error ? error.message : String(error)}`);
        return rejectAction();
      }
    }
    return acceptAction();
  }

  if (amount < MIN_BET || amount > MAX_BET) {
    return rejectAction();
  }

  const targetBet = Math.floor(amount);
  if (targetBet <= seat.bet) {
    return rejectAction();
  }

  const deltaBet = targetBet - seat.bet;
  try {
    const walletUpdate = await applyBetWalletUpdate(seat.userId, deltaBet, table.roundNumber);
    if (!walletUpdate || deltaBet <= 0) {
      return rejectAction();
    }

    seat.bet = targetBet;
    return acceptAction([walletUpdate]);
  } catch (error) {
    logger.error(`[Blackjack] placeBet wallet update failed: ${error instanceof Error ? error.message : String(error)}`);
    return rejectAction();
  }
}

export async function hit(table: BJTable, socketId: string): Promise<RoundActionResult> {
  if (table.state !== 'playing') {
    return rejectAction();
  }

  const currentSeat = getCurrentTurnSeat(table);
  if (!currentSeat || currentSeat.socketId !== socketId) {
    return rejectAction();
  }

  currentSeat.hand.push(drawCard(table.deck));

  const currentScore = handValue(currentSeat.hand);

  if (isBust(currentSeat.hand)) {
    currentSeat.busted = true;
    currentSeat.done = true;
  }

  if (currentScore >= 21) {
    currentSeat.done = true;
    currentSeat.stood = true;
  }

  if (currentSeat.done) {
    setNextTurnOrFinish(table);
  } else {
    table.currentTurnSeatIndex = currentSeat.seatIndex;
  }

  if (table.currentTurnSeatIndex === null) {
    const settleResult = await settleRound(table);
    return acceptEndedAction(settleResult);
  }

  return acceptAction();
}

export async function doubleDown(table: BJTable, socketId: string): Promise<RoundActionResult> {
  if (table.state !== 'playing') {
    return rejectAction();
  }

  const currentSeat = getCurrentTurnSeat(table);
  if (!currentSeat || currentSeat.socketId !== socketId) {
    return rejectAction();
  }

  if (currentSeat.hand.length !== 2 || currentSeat.done || currentSeat.busted || currentSeat.blackjack) {
    return rejectAction();
  }

  try {
    const extraBet = currentSeat.bet;
    const walletUpdate = await applyBetWalletUpdate(currentSeat.userId, extraBet, table.roundNumber);
    if (!walletUpdate) {
      return rejectAction();
    }

    currentSeat.bet += extraBet;
    currentSeat.hand.push(drawCard(table.deck));

    if (isBust(currentSeat.hand)) {
      currentSeat.busted = true;
    }

    currentSeat.stood = true;
    currentSeat.done = true;

    setNextTurnOrFinish(table);

    if (table.currentTurnSeatIndex === null) {
      const settleResult = await settleRound(table);
      return acceptEndedAction(settleResult, [walletUpdate]);
    }

    return acceptAction([walletUpdate]);
  } catch (error) {
    logger.error(`[Blackjack] doubleDown failed for socket ${socketId}: ${error instanceof Error ? error.message : String(error)}`);
    return rejectAction();
  }
}

export async function stand(table: BJTable, socketId: string): Promise<RoundActionResult> {
  if (table.state !== 'playing') {
    return rejectAction();
  }

  const currentSeat = getCurrentTurnSeat(table);
  if (!currentSeat || currentSeat.socketId !== socketId) {
    return rejectAction();
  }

  currentSeat.stood = true;
  currentSeat.done = true;

  setNextTurnOrFinish(table);

  if (table.currentTurnSeatIndex === null) {
    const settleResult = await settleRound(table);
    return acceptEndedAction(settleResult);
  }

  return acceptAction();
}

export async function autoStandCurrentTurn(table: BJTable): Promise<RoundActionResult> {
  if (table.state !== 'playing' || table.currentTurnSeatIndex === null) {
    return rejectAction();
  }

  const currentSeat = getCurrentTurnSeat(table);
  if (!currentSeat) {
    table.currentTurnSeatIndex = null;
    const settleResult = await settleRound(table);
    return acceptEndedAction(settleResult);
  }

  currentSeat.stood = true;
  currentSeat.done = true;

  setNextTurnOrFinish(table);

  if (table.currentTurnSeatIndex === null) {
    const settleResult = await settleRound(table);
    return acceptEndedAction(settleResult);
  }

  return acceptAction();
}

export async function settleRound(table: BJTable): Promise<SettleRoundResult> {
  table.state = 'settling';

  while (handValue(table.dealerHand) < 17) {
    table.dealerHand.push(drawCard(table.deck));
  }

  const dealerScore = handValue(table.dealerHand);
  const dealerBust = dealerScore > 21;
  const dealerHasBlackjack = isBlackjack(table.dealerHand);
  const results: RoundResult[] = [];
  const walletUpdates: WalletUpdate[] = [];
  const activePlayers = getOrderedPlayers(table).filter((seat) => seat.bet > 0);

  for (const seat of activePlayers) {
    const playerScore = handValue(seat.hand);
    const { outcome, payout } = computeOutcomeAndPayout({
      seatBlackjack: seat.blackjack,
      seatBusted: seat.busted,
      playerScore,
      dealerHasBlackjack,
      dealerBust,
      dealerScore,
      bet: seat.bet,
    });

    results.push({
      seatIndex: seat.seatIndex,
      userId: seat.userId,
      username: seat.username,
      bet: seat.bet,
      playerScore,
      dealerScore,
      outcome,
      payout,
      playerHand: [...seat.hand],
      dealerHand: [...table.dealerHand],
    });
  }

  for (const result of results) {
    if (result.payout <= 0) {
      continue;
    }

    try {
      const walletUpdate = await applyPayoutWalletUpdate(result.userId, result.payout, result.bet, table.roundNumber);
      if (walletUpdate) {
        walletUpdates.push(walletUpdate);
      }
    } catch (error) {
      logger.error(`[Blackjack] settleRound payout failed for user ${result.userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  for (const result of results) {
    try {
      await recordBlackjackRoundHistory(result);
    } catch (error) {
      logger.error(`[Blackjack] settleRound history write failed for user ${result.userId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  table.currentTurnSeatIndex = null;

  return { results, walletUpdates };
}

export function startNextBettingPhaseFromSettlement(table: BJTable): boolean {
  if (table.state !== 'settling') {
    return false;
  }

  table.state = 'waiting';
  return startBettingPhase(table);
}
