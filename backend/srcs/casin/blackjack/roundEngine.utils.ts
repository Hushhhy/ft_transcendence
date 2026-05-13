import { createDeck } from './deck';
import { NUM_DECKS } from './constants';
import type { BJTable, Card, PlayerSeat, RoundResult } from './types';
import type { WalletUpdate } from './walletPersistence';

export interface RoundActionResult {
  accepted: boolean;
  roundEnded: boolean;
  results: RoundResult[];
  walletUpdates: WalletUpdate[];
}

export interface SettleRoundResult {
  results: RoundResult[];
  walletUpdates: WalletUpdate[];
}

/**
 * Crée un shoe de 4 decks combinés (208 cartes)
 */
export function createShoe(): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < NUM_DECKS; i += 1) {
    shoe.push(...createDeck());
  }
  return shoe;
}

export function resetRoundState(table: BJTable): void {
  for (const seat of table.players) {
    seat.bet = 0;
    seat.hand = [];
    seat.stood = false;
    seat.busted = false;
    seat.blackjack = false;
    seat.done = false;
  }

  table.dealerHand = [];
  table.currentTurnSeatIndex = null;
}

export function allBetsPlaced(table: BJTable): boolean {
  return table.players.length > 0 && table.players.every((seat) => seat.bet > 0);
}

export function getOrderedPlayers(table: BJTable): PlayerSeat[] {
  // Turn order is fixed from highest seat to lowest: 4 -> ... -> 0
  return [...table.players].sort((left, right) => right.seatIndex - left.seatIndex);
}

export function getCurrentTurnSeat(table: BJTable): PlayerSeat | null {
  if (table.currentTurnSeatIndex === null) {
    return null;
  }

  return table.players.find((seat) => seat.seatIndex === table.currentTurnSeatIndex) || null;
}

export function setNextTurnOrFinish(table: BJTable): void {
  const orderedPlayers = getOrderedPlayers(table);
  const currentIndex = table.currentTurnSeatIndex;

  if (currentIndex === null) {
    table.currentTurnSeatIndex = orderedPlayers.find((seat) => !seat.done && !seat.busted)?.seatIndex ?? null;
    return;
  }

  const nextSeat = orderedPlayers.find((seat) => seat.seatIndex < currentIndex && !seat.done && !seat.busted);
  if (nextSeat) {
    table.currentTurnSeatIndex = nextSeat.seatIndex;
    return;
  }

  table.currentTurnSeatIndex = null;
}

export function rejectAction(): RoundActionResult {
  return { accepted: false, roundEnded: false, results: [], walletUpdates: [] };
}

export function acceptAction(walletUpdates: WalletUpdate[] = []): RoundActionResult {
  return { accepted: true, roundEnded: false, results: [], walletUpdates };
}

export function acceptEndedAction(settleResult: SettleRoundResult, walletUpdates: WalletUpdate[] = []): RoundActionResult {
  return {
    accepted: true,
    roundEnded: true,
    results: settleResult.results,
    walletUpdates: [...walletUpdates, ...settleResult.walletUpdates],
  };
}

export function computeOutcomeAndPayout(params: {
  seatBlackjack: boolean;
  seatBusted: boolean;
  playerScore: number;
  dealerHasBlackjack: boolean;
  dealerBust: boolean;
  dealerScore: number;
  bet: number;
}): { outcome: RoundResult['outcome']; payout: number } {
  const {
    seatBlackjack,
    seatBusted,
    playerScore,
    dealerHasBlackjack,
    dealerBust,
    dealerScore,
    bet,
  } = params;

  if (seatBlackjack && !dealerHasBlackjack) {
    return { outcome: 'blackjack', payout: bet * 2.5 };
  }

  if (seatBusted || playerScore > 21) {
    return { outcome: 'bust', payout: 0 };
  }

  if (dealerBust || playerScore > dealerScore) {
    return { outcome: 'win', payout: bet * 2 };
  }

  if (playerScore === dealerScore) {
    return { outcome: 'push', payout: bet };
  }

  return { outcome: 'lose', payout: 0 };
}
