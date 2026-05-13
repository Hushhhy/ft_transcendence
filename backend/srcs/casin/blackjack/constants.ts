// Timer durations (in milliseconds)
export const WAITING_PHASE_DURATION_MS = 15_000;
export const BETTING_PHASE_DURATION_MS = 10_000;
export const TURN_DURATION_MS = 10_000;
export const SETTLEMENT_DURATION_MS = 4_000;
export const ACTION_COOLDOWN_MS = 350;

// Betting constraints
export const MIN_BET = 5;
export const MAX_BET = 100_000;
export const CHIP_VALUES = [5, 10, 25, 50, 100, 500] as const;

// Game configuration
export const NUM_DECKS = 4; // 4 decks = 208 cards
export const DEFAULT_MAX_PLAYERS = 5;
