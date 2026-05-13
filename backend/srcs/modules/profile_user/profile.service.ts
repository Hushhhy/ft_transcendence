import prisma from '../../lib/prisma';
import logger from '../../lib/logger';
import type { UpdateProfileDTO } from './profile.dto';

export type BlackjackRoundHistoryDTO = {
  id: number;
  netAmount: number;
  cause: 'bust' | 'victory' | 'defeat' | 'blackjack' | 'push';
  createdAt: Date;
};

export type BlackjackProfileStatsDTO = {
  gamesPlayed: number;
  totalBalance: number;
  bestGainAmount: number;
  bestLossAmount: number;
  recentRounds: BlackjackRoundHistoryDTO[];
};

export type UserProfileDTO = {
  id: number;
  email: string;
  username: string;
  birthDate: Date;
  avatarUrl: string | null;
  verified: boolean;
  balance: number;
  blackjackGamesPlayed: number;
  blackjackBestWinningHand: number | null;
  blackjackBestLosingHand: number | null;
  createdAt: Date;
  updatedAt: Date;
};

class ProfileService {
  private profileSelect = {
    id: true,
    email: true,
    username: true,
    birthDate: true,
    avatarUrl: true,
    verified: true,
    balance: true,
    blackjackGamesPlayed: true,
    blackjackBestWinningHand: true,
    blackjackBestLosingHand: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  async getProfile(userId: number): Promise<UserProfileDTO> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: this.profileSelect,
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  async updateProfile(userId: number, data: UpdateProfileDTO) {
    const updateData: { username?: string; avatarUrl?: string | null } = {};

    if (data.username !== undefined) {
      updateData.username = data.username;
    }

    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl;
    }

    if (Object.keys(updateData).length === 0) {
      throw new Error('No profile fields provided for update');
    }

    if (updateData.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: updateData.username },
      });

      if (existingUser && existingUser.id !== userId) {
        throw new Error('Username already taken');
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: this.profileSelect,
    });

    logger.info(`User profile updated: ${updatedUser.id}`);
    return updatedUser as UserProfileDTO;
  }

  async searchUsers(query: string, currentUserId: number, limit: number = 10): Promise<UserProfileDTO[]> {
    if (!query || query.trim().length === 0) {
      throw new Error('Search query cannot be empty');
    }

    const searchQuery = query.trim().toLowerCase();

    const users = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { username: { contains: searchQuery, mode: 'insensitive' } },
              { email: { contains: searchQuery, mode: 'insensitive' } },
            ],
          },
          {
            id: { not: currentUserId }, // Exclude the current user
          },
        ],
      },
      select: this.profileSelect,
      take: limit,
    });

    return users as UserProfileDTO[];
  }

  async getBlackjackStats(userId: number, limit: number = 10): Promise<BlackjackProfileStatsDTO> {
    const safeLimit = Math.max(1, Math.min(limit, 50));

    const [user, totalAgg, gainAgg, lossAgg] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          blackjackGamesPlayed: true,
          blackjackRoundHistories: {
            orderBy: { createdAt: 'desc' },
            take: safeLimit,
            select: {
              id: true,
              netAmount: true,
              cause: true,
              createdAt: true,
            },
          },
        },
      }),
      prisma.blackjackRoundHistory.aggregate({
        where: { userId },
        _sum: { netAmount: true },
      }),
      prisma.blackjackRoundHistory.aggregate({
        where: { userId, netAmount: { gt: 0 } },
        _sum: { netAmount: true },
        _max: { netAmount: true },
      }),
      prisma.blackjackRoundHistory.aggregate({
        where: { userId, netAmount: { lt: 0 } },
        _min: { netAmount: true },
      }),
    ]);

    if (!user) {
      throw new Error('User not found');
    }

    return {
      gamesPlayed: user.blackjackGamesPlayed,
      totalBalance: totalAgg._sum.netAmount ?? 0,
      bestGainAmount: gainAgg._max.netAmount ?? 0,
      bestLossAmount: Math.abs(lossAgg._min.netAmount ?? 0),
      recentRounds: user.blackjackRoundHistories,
    };
  }
}

export default new ProfileService();