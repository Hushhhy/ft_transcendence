import type { Namespace, Server, Socket } from 'socket.io';
import { BJ_EVENTS } from '../events';
import { getSeatBySocket, getTableBySocket } from '../tableManager';
import { isActionRateLimited } from '../utils/validators';
import { emitError } from './emitters';
import logger from '../../../lib/logger';
import type { BJTable, PlayerSeat } from '../types';

type BlackjackTableActionContext = {
  socket: Socket;
  io: Server | Namespace;
  table: BJTable;
  seat: PlayerSeat | null;
};

type BlackjackTableActionHandler = (context: BlackjackTableActionContext) => Promise<void> | void;

interface ExecuteBlackjackTableActionOptions {
  socket: Socket;
  io: Server | Namespace;
  eventName: string;
  actionName: string;
  missingTableMessage: string;
  missingSeatMessage?: string;
  requireSeat?: boolean;
  errorMessage?: string;
  handler: BlackjackTableActionHandler;
}

export async function executeBlackjackTableAction(options: ExecuteBlackjackTableActionOptions): Promise<void> {
  const {
    socket,
    io,
    eventName,
    actionName,
    missingTableMessage,
    missingSeatMessage = 'You are not seated at any blackjack table.',
    requireSeat = false,
    errorMessage = `Unable to process ${actionName.toLowerCase()} right now. Please try again.`,
    handler,
  } = options;

  if (isActionRateLimited(socket, eventName)) {
    emitError(socket, 'Action too fast.');
    return;
  }

  const table = getTableBySocket(socket.id);
  if (!table) {
    emitError(socket, missingTableMessage);
    return;
  }

  const seat = getSeatBySocket(table, socket.id);
  if (requireSeat && !seat) {
    emitError(socket, missingSeatMessage);
    return;
  }

  try {
    await handler({ socket, io, table, seat });
  } catch (error) {
    logger.error(`[Blackjack] ${actionName} failed: ${error instanceof Error ? error.message : String(error)}`);
    emitError(socket, errorMessage);
  }
}