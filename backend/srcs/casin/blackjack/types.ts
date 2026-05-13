export type TableState = 'waiting' | 'betting' | 'playing' | 'settling';

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';

export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export type RoundOutcome = 'blackjack' | 'win' | 'push' | 'lose' | 'bust';

export interface Card {
  suit: Suit;
  rank: Rank;
  value: number;
}

export interface PlayerSeat {
  userId: number;
  socketId: string;
  username: string;
  avatarUrl?: string | null;
  seatIndex: number;
  bet: number;
  hand: Card[];
  stood: boolean;
  busted: boolean;
  blackjack: boolean;
  done: boolean;
}

export interface BJTable {
  id: string;
  players: PlayerSeat[];
  pendingPlayers: PlayerSeat[];
  maxPlayers: number;
  state: TableState;
  deck: Card[];
  dealerHand: Card[];
  currentTurnSeatIndex: number | null;
  roundNumber: number;
}

export interface JoinPayload {
  userId: number;
  nickname: string;
}

export interface TableStatePayload {
  tableId: string;
  state: TableState;
  maxPlayers: number;
  roundNumber: number;
  dealerHand: Card[];
  dealerScore: number;
  currentTurnSeatIndex: number | null;
  deckRemaining: number;
  players: PlayerSeat[];
  pendingPlayers: PlayerSeat[];
  phaseTimerEndsAt?: number | null;
  phaseTimerType?: 'waiting' | 'betting' | null;
  turnTimerEndsAt?: number | null;
}

export interface RoundResult {
  seatIndex: number;
  userId: number;
  username: string;
  bet: number;
  playerScore: number;
  dealerScore: number;
  outcome: RoundOutcome;
  payout: number;
  playerHand: Card[];
  dealerHand: Card[];
}

export interface RoundResultPayload {
  tableId: string;
  roundNumber: number;
  dealerHand: Card[];
  dealerScore: number;
  results: RoundResult[];
}

export interface JoinedPendingPayload {
  tableId: string;
  seatIndex: number;
  message: string;
}

export interface ErrorPayload {
  message: string;
}

export interface WalletUpdatePayload {
  userId: number;
  balance: number;
  delta: number;
  reason: 'bet' | 'payout';
}