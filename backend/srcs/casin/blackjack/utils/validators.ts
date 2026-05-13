import { CHIP_VALUES, MAX_BET, MIN_BET, ACTION_COOLDOWN_MS } from '../constants';
import { BJ_EVENTS } from '../events';
import type { Socket } from 'socket.io';

/**
 * Valide le montant d'une mise
 * - Doit être un nombre entier positif ou 0 (pour reset)
 * - Si > 0: entre MIN_BET et MAX_BET et multiple de 5
 */
export function validateBetAmount(rawAmount: unknown): number | null {
  const amount = Number(rawAmount);
  if (!Number.isFinite(amount) || !Number.isInteger(amount)) {
    return null;
  }
  // Allow 0 for reset
  if (amount === 0) {
    return amount;
  }
  if (amount < MIN_BET || amount > MAX_BET) {
    return null;
  }
  if (amount % 5 !== 0) {
    return null;
  }
  return amount;
}

/**
 * Vérifie si une action est soumise au rate limiting
 * Chaque action a un cooldown minimum
 */
export function isActionRateLimited(socket: Socket, action: string): boolean {
  const now = Date.now();
  const rateLimitState = ((socket.data.rateLimitState as Map<string, number> | undefined)
    ?? new Map<string, number>());

  // Betting can legitimately happen in quick succession (reset then new bet, chip adjustments).
  // Keep a shorter cooldown only for PLACE_BET to reduce false-positive "Action too fast" errors.
  const cooldownMs = action === BJ_EVENTS.PLACE_BET ? 120 : ACTION_COOLDOWN_MS;

  const lastActionAt = rateLimitState.get(action) ?? 0;
  if (now - lastActionAt < cooldownMs) {
    socket.data.rateLimitState = rateLimitState;
    return true;
  }

  rateLimitState.set(action, now);
  socket.data.rateLimitState = rateLimitState;
  return false;
}

/**
 * Valide qu'une action peut être exécutée sur une seat donnée
 */
export function validateSeatAction(socketId: string, targetSocketId: string, action: string): { valid: boolean; error?: string } {
  if (socketId !== targetSocketId) {
    return { valid: false, error: `Unauthorized: Cannot ${action} for another player` };
  }
  return { valid: true };
}
