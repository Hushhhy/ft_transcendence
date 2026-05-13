import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../../lib/logger';
import PresenceService from './presence.service';

const PRESENCE_CLEANUP_INTERVAL_MS = 5000;

export function initPresenceSocket(io: SocketIOServer): void {
  // Handle general Socket.IO connections for presence tracking
  io.use((socket: Socket, next: (err?: Error) => void) => {
    try {
      const token = socket.handshake.auth.token
        || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: Missing token'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: number; sub?: number };
      socket.data.userId = decoded.userId ?? decoded.sub;
      next();
    } catch (error) {
      logger.warn('Socket authentication failed:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as number;

    logger.info(`User ${userId} connected to general socket`);
    PresenceService.setUserOnline(userId, socket.id);

    socket.on('disconnect', () => {
      logger.info(`User ${userId} disconnected from general socket`);
      PresenceService.setUserOffline(userId, socket.id);
    });
  });

  // Nettoyage périodique des connexions mortes
  setInterval(() => {
    PresenceService.cleanupDeadConnections();
  }, PRESENCE_CLEANUP_INTERVAL_MS);
}
