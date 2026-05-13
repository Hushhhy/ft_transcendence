import prisma from '../../lib/prisma';
import type { RoundOutcome, RoundResult } from './types';

export type BlackjackRoundHistoryCause = 'bust' | 'victory' | 'defeat' | 'blackjack' | 'push';

function mapOutcomeToCause(outcome: RoundOutcome): BlackjackRoundHistoryCause {
  switch (outcome) {
    case 'blackjack':
      return 'blackjack';
    case 'win':
      return 'victory';
    case 'lose':
      return 'defeat';
    case 'bust':
      return 'bust';
    case 'push':
      return 'push';
    default:
      return 'defeat';
  }
}

export async function recordBlackjackRoundHistory(result: RoundResult): Promise<void> {
  const netAmount = result.payout - result.bet;
  const isWinningOutcome = result.outcome === 'win' || result.outcome === 'blackjack';
  const isLosingOutcome = result.outcome === 'lose' || result.outcome === 'bust';

  await prisma.$transaction(async (tx) => {
    const currentUser = await tx.user.findUnique({
      where: { id: result.userId },
      select: {
        blackjackBestWinningHand: true,
        blackjackBestLosingHand: true,
      },
    });

    await tx.blackjackRoundHistory.create({
      data: {
        userId: result.userId,
        netAmount,
        cause: mapOutcomeToCause(result.outcome),
      },
    });

    const updateData: {
      blackjackGamesPlayed: { increment: number };
      blackjackBestWinningHand?: number;
      blackjackBestLosingHand?: number;
    } = {
      blackjackGamesPlayed: { increment: 1 },
    };

    if (isWinningOutcome) {
      const currentBestWinningHand = currentUser?.blackjackBestWinningHand ?? null;
      if (currentBestWinningHand === null || result.playerScore > currentBestWinningHand) {
        updateData.blackjackBestWinningHand = result.playerScore;
      }
    }

    if (isLosingOutcome) {
      const currentBestLosingHand = currentUser?.blackjackBestLosingHand ?? null;
      if (currentBestLosingHand === null || result.playerScore > currentBestLosingHand) {
        updateData.blackjackBestLosingHand = result.playerScore;
      }
    }

    await tx.user.update({
      where: { id: result.userId },
      data: updateData,
    });
  });
}
