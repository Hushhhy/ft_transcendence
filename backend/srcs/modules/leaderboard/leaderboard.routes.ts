import { Router, Request, Response, NextFunction } from 'express';
import { requireAuth } from '../../middlewares/auth/requireAuth';
import prisma from '../../lib/prisma';
import { BlackjackRoundCause } from '@prisma/client';

const leaderboardRouter = Router();

leaderboardRouter.get('/', requireAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '100'), 10) || 100, 1), 200);

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        blackjackRoundHistories: {
          where: { cause: { in: [BlackjackRoundCause.victory, BlackjackRoundCause.blackjack] } },
          select: { id: true },
        },
      },
    });

    const players = users
      .map((u) => ({
        id: u.id,
        username: u.username,
        avatarUrl: u.avatarUrl,
        gamesWon: u.blackjackRoundHistories.length,
      }))
      .sort((a, b) => b.gamesWon - a.gamesWon)
      .slice(0, limit);

    res.json({ status: 'success', data: players });
  } catch (err) {
    next(err);
  }
});

export default leaderboardRouter;
