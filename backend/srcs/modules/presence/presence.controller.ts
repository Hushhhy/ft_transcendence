import { Request, Response, NextFunction } from 'express';
import PresenceService from './presence.service';

class PresenceController {
  async getOwnPresence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const presence = PresenceService.getPresence(userId);
      res.status(200).json({
        status: 'success',
        message: 'Presence fetched successfully',
        data: {
          userId,
          isOnline: presence.isOnline,
          lastSeen: presence.lastSeen,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUserPresence(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const targetUserId = Number(req.params.userId);
      if (!targetUserId || Number.isNaN(targetUserId)) {
        res.status(400).json({ status: 'error', message: 'Invalid user ID' });
        return;
      }

      const presence = PresenceService.getPresence(targetUserId);
      res.status(200).json({
        status: 'success',
        message: 'Presence fetched successfully',
        data: {
          userId: targetUserId,
          isOnline: presence.isOnline,
          lastSeen: presence.lastSeen,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export default new PresenceController();
