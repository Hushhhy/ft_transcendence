import { Server, Namespace, Socket } from 'socket.io';
import { BJ_EVENTS } from '../events';
import type { JoinPayload } from '../types';
import {
  getAuthenticatedUserId,
  handleJoin,
  handleLeave,
  handleStartRound,
  handlePlaceBet,
  handleHit,
  handleDouble,
  handleStand,
  handleDisconnect,
} from './handlers';
import { emitToSocket, emitTableState, emitRoundResult, emitWalletUpdates } from './emitters';
import { setEmitterCallbacks } from './timers';
import logger from '../../../lib/logger';

type AuthMiddlewareError = Error & {
  data?: {
    content: string;
  };
};

/**
 * Configure l'authentification JWT pour les sockets
 */
function setupAuthMiddleware(nsp: Namespace): void {
  nsp.use((socket, next) => {
    const userId = getAuthenticatedUserId(socket);
    if (!userId) {
      const err: AuthMiddlewareError = new Error('Authentication failed');
      err.data = { content: 'Please provide a valid JWT token' };
      return next(err);
    }

    socket.data.userId = userId;
    next();
  });
}

/**
 * Enregistre tous les handlers d'événements pour une socket
 */
function setupEventHandlers(socket: Socket, io: Server | Namespace): void {
  socket.on(BJ_EVENTS.JOIN, async (payload: JoinPayload) => {
    try {
      await handleJoin(socket, io, payload);
    } catch (error) {
      logger.error(`[Blackjack] JOIN handler error: ${error instanceof Error ? error.message : String(error)}`);
      emitToSocket(socket, BJ_EVENTS.ERROR, { message: 'Join failed. Please try again.' });
    }
  });

  socket.on(BJ_EVENTS.LEAVE, async () => {
    try {
      await handleLeave(socket, io);
    } catch (error) {
      logger.error(`[Blackjack] LEAVE handler error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  socket.on(BJ_EVENTS.START_ROUND, () => {
    try {
      handleStartRound(socket, io);
    } catch (error) {
      logger.error(`[Blackjack] START_ROUND handler error: ${error instanceof Error ? error.message : String(error)}`);
      emitToSocket(socket, BJ_EVENTS.ERROR, { message: 'Unable to start round. Please try again.' });
    }
  });

  socket.on(BJ_EVENTS.PLACE_BET, async (payload: { amount: number }) => {
    try {
      await handlePlaceBet(socket, io, payload);
    } catch (error) {
      logger.error(`[Blackjack] PLACE_BET handler error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  socket.on(BJ_EVENTS.HIT, async () => {
    try {
      await handleHit(socket, io);
    } catch (error) {
      logger.error(`[Blackjack] HIT handler error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  socket.on(BJ_EVENTS.DOUBLE, async () => {
    try {
      await handleDouble(socket, io);
    } catch (error) {
      logger.error(`[Blackjack] DOUBLE handler error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  socket.on(BJ_EVENTS.STAND, async () => {
    try {
      await handleStand(socket, io);
    } catch (error) {
      logger.error(`[Blackjack] STAND handler error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });

  socket.on('disconnect', async () => {
    try {
      await handleDisconnect(socket, io);
    } catch (error) {
      logger.error(`[Blackjack] DISCONNECT handler error: ${error instanceof Error ? error.message : String(error)}`);
    }
  });
}

/**
 * Initialise le namespace Blackjack
 */
export function initBlackjackNamespace(io: Server, nsp: Namespace): void {
  // Initialize emitter callbacks in timers module
  setEmitterCallbacks(emitTableState, emitRoundResult, emitWalletUpdates);

  // Setup authentication middleware
  setupAuthMiddleware(nsp);

  // Handle new connections
  nsp.on('connection', (socket) => {
    const userId = socket.data.userId as number;
    logger.info(`[Blackjack] User ${userId} connected (socket: ${socket.id})`);
    setupEventHandlers(socket, nsp);
  });

  logger.info('[Blackjack] Namespace initialized');
}
