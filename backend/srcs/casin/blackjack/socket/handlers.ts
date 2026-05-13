import { Socket, Server, Namespace } from 'socket.io';
import jwt from 'jsonwebtoken';
import { BJ_EVENTS } from '../events';
import { joinTable, leaveTable, getTableBySocket } from '../tableManager';
import { placeBet, doubleDown, hit, stand, startBettingPhase } from '../roundEngine';
import type { JoinPayload } from '../types';
import { validateBetAmount, isActionRateLimited } from '../utils/validators';
import { emitError, emitToSocket, emitTableState, emitRoundResult, emitWalletUpdates } from './emitters';
import { clearTurnTimer, clearAllTimers, restartTurnTimer, syncTimers } from './timers';
import logger from '../../../lib/logger';
import prisma from '../../../lib/prisma';
import { executeBlackjackTableAction } from './actionRunner';
import { MIN_BET } from '../constants';

interface JwtPayload {
  userId?: number | string;
  sub?: number | string;
}

/**
 * Extrait et valide l'ID utilisateur depuis le token JWT
 */
export function getAuthenticatedUserId(socket: Socket): number | null {
  const rawToken = socket.handshake.auth?.token
    || socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!rawToken) {
    return null;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      logger.error('[Blackjack] JWT secret is not configured');
      return null;
    }

    const decoded = jwt.verify(rawToken, secret) as JwtPayload;
    const rawUserId = decoded.userId ?? decoded.sub;
    const userId = typeof rawUserId === 'string' ? Number(rawUserId) : rawUserId;

    if (!userId || Number.isNaN(userId)) {
      return null;
    }

    return userId;
  } catch (error) {
    logger.warn(`[Blackjack] Invalid socket token: ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

/**
 * Handler: Joueur rejoint une table
 */
export async function handleJoin(
  socket: Socket,
  io: Server | Namespace,
  payload: JoinPayload,
): Promise<void> {
  const userId = socket.data.userId as number | undefined;
  const nickname = String(payload?.nickname || 'Player');

  if (!userId) {
    emitError(socket, 'Unauthorized socket session. Please sign in again.');
    socket.disconnect(true);
    return;
  }

  if (payload?.userId !== undefined && Number(payload.userId) !== userId) {
    emitError(socket, 'User mismatch detected.');
    return;
  }

  let avatarUrl: string | null = null;
  let balance = 0;
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true, balance: true },
    });
    avatarUrl = user?.avatarUrl || null;
    balance = user?.balance ?? 0;
  } catch (error) {
    logger.warn(`Failed to fetch avatar for user ${userId}:`, error);
  }

  if (balance < MIN_BET) {
    emitError(socket, `Insufficient balance. You need at least ${MIN_BET} credits to join a blackjack table.`);
    return;
  }

  const { table, joinedAsPending, seat } = joinTable(socket.id, userId, nickname, avatarUrl);
  socket.join(table.id);

  if (joinedAsPending) {
    emitToSocket(socket, BJ_EVENTS.JOINED_PENDING, {
      tableId: table.id,
      seatIndex: seat.seatIndex,
      message: 'You joined during an active phase and will be promoted at the next betting phase.',
    });
  } else if (table.state === 'waiting') {
    startBettingPhase(table);
  }

  syncTimers(io, table);
  emitTableState(io, table);
}

/**
 * Handler: Joueur quitte une table
 */
export async function handleLeave(
  socket: Socket,
  io: Server | Namespace,
): Promise<void> {
  if (isActionRateLimited(socket, BJ_EVENTS.LEAVE)) {
    emitError(socket, 'Action too fast.');
    return;
  }

  const tableBeforeLeave = getTableBySocket(socket.id);
  const table = leaveTable(socket.id);

  if (table) {
    clearTurnTimer(table.id);
    syncTimers(io, table);
    emitTableState(io, table);
  } else if (tableBeforeLeave) {
    clearAllTimers(tableBeforeLeave.id);
  }
}

/**
 * Handler: Joueur commence une nouvelle manche
 */
export function handleStartRound(
  socket: Socket,
  io: Server | Namespace,
): void {
  void executeBlackjackTableAction({
    socket,
    io,
    eventName: BJ_EVENTS.START_ROUND,
    actionName: 'START_ROUND',
    missingTableMessage: 'You are not seated at any blackjack table.',
    missingSeatMessage: 'Only seated players can start a round.',
    requireSeat: true,
    errorMessage: 'Unable to start betting phase. Need at least one active player.',
    handler: ({ table }) => {
      if (table.state === 'betting' || table.state === 'playing' || table.state === 'settling') {
        syncTimers(io, table);
        emitTableState(io, table);
        return;
      }

      if (table.players.length === 0) {
        emitError(socket, 'Unable to start betting phase. Need at least one active player.');
        return;
      }

      if (!startBettingPhase(table)) {
        emitError(socket, `Unable to start betting phase from state "${table.state}".`);
        return;
      }

      syncTimers(io, table);
      emitTableState(io, table);
    },
  });
}

/**
 * Handler: Joueur place un pari
 */
export async function handlePlaceBet(
  socket: Socket,
  io: Server | Namespace,
  payload: { amount: number },
): Promise<void> {
  const amount = validateBetAmount(payload?.amount);
  if (amount === null) {
    emitError(socket, 'Invalid bet. Use a multiple of 5 between 5 and 100000.');
    return;
  }

  await executeBlackjackTableAction({
    socket,
    io,
    eventName: BJ_EVENTS.PLACE_BET,
    actionName: 'placeBet',
    missingTableMessage: 'You are not seated at any blackjack table.',
    errorMessage: 'Unable to process bet right now. Please try again.',
    handler: async ({ table }) => {
      const result = await placeBet(table, socket.id, amount);
      if (!result.accepted) {
        emitError(socket, 'Bet rejected. Bets are only allowed during the betting phase and must be positive.');
        return;
      }

      if (result.roundEnded) {
        clearTurnTimer(table.id);
      }

      emitWalletUpdates(io, table, result.walletUpdates);

      if (result.roundEnded) {
        emitRoundResult(io, table, result.results);
      }

      syncTimers(io, table);
      emitTableState(io, table);
    },
  });
}

/**
 * Handler: Joueur prend une carte
 */
export async function handleHit(
  socket: Socket,
  io: Server | Namespace,
): Promise<void> {
  await executeBlackjackTableAction({
    socket,
    io,
    eventName: BJ_EVENTS.HIT,
    actionName: 'hit',
    missingTableMessage: 'You are not seated at any blackjack table.',
    errorMessage: 'Unable to process hit right now. Please try again.',
    handler: async ({ table }) => {
      const result = await hit(table, socket.id);
      if (!result.accepted) {
        emitError(socket, 'Hit rejected. You can only hit during your turn in the playing phase.');
        return;
      }

      restartTurnTimer(io, table);

      if (result.roundEnded) {
        emitRoundResult(io, table, result.results);
        emitWalletUpdates(io, table, result.walletUpdates);
      }

      syncTimers(io, table);
      emitTableState(io, table);
    },
  });
}

/**
 * Handler: Joueur double sa mise
 */
export async function handleDouble(
  socket: Socket,
  io: Server | Namespace,
): Promise<void> {
  await executeBlackjackTableAction({
    socket,
    io,
    eventName: BJ_EVENTS.DOUBLE,
    actionName: 'double',
    missingTableMessage: 'You are not seated at any blackjack table.',
    errorMessage: 'Unable to process double right now. Please try again.',
    handler: async ({ table }) => {
      const result = await doubleDown(table, socket.id);
      if (!result.accepted) {
        emitError(socket, 'Double rejected. You can only double once, on the first two cards of your turn.');
        return;
      }

      restartTurnTimer(io, table);

      emitWalletUpdates(io, table, result.walletUpdates);

      if (result.roundEnded) {
        emitRoundResult(io, table, result.results);
      }

      syncTimers(io, table);
      emitTableState(io, table);
    },
  });
}

/**
 * Handler: Joueur reste avec sa main
 */
export async function handleStand(
  socket: Socket,
  io: Server | Namespace,
): Promise<void> {
  await executeBlackjackTableAction({
    socket,
    io,
    eventName: BJ_EVENTS.STAND,
    actionName: 'stand',
    missingTableMessage: 'You are not seated at any blackjack table.',
    errorMessage: 'Unable to process stand right now. Please try again.',
    handler: async ({ table }) => {
      const result = await stand(table, socket.id);
      if (!result.accepted) {
        emitError(socket, 'Stand rejected. You can only stand during your turn in the playing phase.');
        return;
      }

      restartTurnTimer(io, table);

      if (result.roundEnded) {
        emitRoundResult(io, table, result.results);
        emitWalletUpdates(io, table, result.walletUpdates);
      }

      syncTimers(io, table);
      emitTableState(io, table);
    },
  });
}

/**
 * Handler: Joueur se déconnecte
 */
export async function handleDisconnect(
  socket: Socket,
  io: Server | Namespace,
): Promise<void> {
  const tableBeforeDisconnect = getTableBySocket(socket.id);
  const table = leaveTable(socket.id);

  if (table) {
    clearTurnTimer(table.id);
    syncTimers(io, table);
    emitTableState(io, table);
  } else if (tableBeforeDisconnect) {
    clearAllTimers(tableBeforeDisconnect.id);
  }
}
