import { getIO } from '../../lib/socket';

type UserPresenceDTO = {
  isOnline: boolean;
  lastSeen: Date | null;
};

class PresenceService {
  private onlineSockets = new Map<number, Set<string>>();
  private lastSeenMap = new Map<number, Date>();

  private pruneUserSockets(userId: number): Set<string> | null {
    const sockets = this.onlineSockets.get(userId);
    if (!sockets) {
      return null;
    }

    try {
      const io = getIO();
      const activeSocketIds = new Set(io.of('/').sockets.keys());
      for (const socketId of sockets) {
        if (!activeSocketIds.has(socketId)) {
          sockets.delete(socketId);
        }
      }
    } catch {
      // Socket.IO instance may not be initialized yet.
    }

    if (sockets.size === 0) {
      this.onlineSockets.delete(userId);
      if (!this.lastSeenMap.has(userId)) {
        this.lastSeenMap.set(userId, new Date());
      }
      return null;
    }

    this.onlineSockets.set(userId, sockets);
    return sockets;
  }

  private emitPresenceUpdate(userId: number, isOnline: boolean): void {
    try {
      const io = getIO();
      io.emit('presence:update', {
        userId,
        isOnline,
        lastSeen: isOnline ? null : this.lastSeenMap.get(userId) ?? null,
      });
    } catch {
      // Socket.IO instance may not be initialized yet.
    }
  }

  setUserOnline(userId: number, socketId: string): void {
    const sockets = this.onlineSockets.get(userId) ?? new Set<string>();
    const wasOffline = sockets.size === 0;
    sockets.add(socketId);
    this.onlineSockets.set(userId, sockets);

   // If the user reconnects, the last offline status is
    // no longer relevant: it is deleted to prevent a false offline status later.
    
    this.lastSeenMap.delete(userId);

    if (wasOffline) {
      this.emitPresenceUpdate(userId, true);
    }
  }

  setUserOffline(userId: number, socketId: string): void {
    const sockets = this.onlineSockets.get(userId);
    if (!sockets || !sockets.has(socketId)) {
      return;
    }

    sockets.delete(socketId);
    if (sockets.size > 0) {
      this.onlineSockets.set(userId, sockets);
      return;
    }

    this.onlineSockets.delete(userId);
    this.lastSeenMap.set(userId, new Date());
    this.emitPresenceUpdate(userId, false);
  }

  // Method to clean up dead connections (called periodically) *1

  cleanupDeadConnections(): void {
    try {
      const io = getIO();
      const activeSocketIds = new Set(io.of('/').sockets.keys());

      for (const [userId, sockets] of this.onlineSockets.entries()) {
        for (const socketId of sockets) {
          if (!activeSocketIds.has(socketId)) {
            sockets.delete(socketId);
          }
        }

        if (sockets.size > 0) {
          this.onlineSockets.set(userId, sockets);
          continue;
        }

        this.onlineSockets.delete(userId);
        this.lastSeenMap.set(userId, new Date());
        this.emitPresenceUpdate(userId, false);
      }
    } catch {
      // Socket.IO instance may not be initialized yet.
    }
  }

  isUserOnline(userId: number): boolean {
    return this.pruneUserSockets(userId) !== null;
  }

  getLastSeen(userId: number): Date | null {
    return this.lastSeenMap.get(userId) ?? null;
  }

  getPresence(userId: number): UserPresenceDTO {
    return {
      isOnline: this.isUserOnline(userId),
      lastSeen: this.getLastSeen(userId),
    };
  }
}

export default new PresenceService();
