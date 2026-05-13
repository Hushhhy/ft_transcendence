import prisma from '../../lib/prisma';

export interface WalletUpdate {
  userId: number;
  balance: number;
  delta: number;
  reason: 'bet' | 'payout';
}

async function updateUserBalanceAndRecordTransaction(params: {
  userId: number;
  amount: number;
  bet: number;
  gameNbr: number;
  reason: 'bet' | 'payout';
  transactionType: 'loss' | 'win';
}): Promise<WalletUpdate | null> {
  const { userId, amount, bet, gameNbr, reason, transactionType } = params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user) {
    return null;
  }

  const updatedUser = await prisma.$transaction(async (tx) => {
    const nextUser = await tx.user.update({
      where: { id: userId },
      data: {
        balance: reason === 'bet'
          ? { decrement: amount }
          : { increment: amount },
      },
      select: {
        balance: true,
      },
    });

    await tx.transaction.create({
      data: {
        userId,
        amount: reason === 'bet' ? -amount : amount,
        type: transactionType,
        bet,
        game: 'blackjack',
        gameNbr,
      },
    });

    return nextUser;
  });

  return {
    userId,
    balance: updatedUser.balance,
    delta: reason === 'bet' ? -amount : amount,
    reason,
  };
}

export async function applyBetWalletUpdate(
  userId: number,
  betAmount: number,
  gameNbr: number,
): Promise<WalletUpdate | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { balance: true },
  });

  if (!user || user.balance < betAmount) {
    return null;
  }

  return updateUserBalanceAndRecordTransaction({
    userId,
    amount: betAmount,
    bet: betAmount,
    gameNbr,
    reason: 'bet',
    transactionType: 'loss',
  });
}

export async function applyPayoutWalletUpdate(
  userId: number,
  payoutAmount: number,
  betAmount: number,
  gameNbr: number,
): Promise<WalletUpdate | null> {
  return updateUserBalanceAndRecordTransaction({
    userId,
    amount: payoutAmount,
    bet: betAmount,
    gameNbr,
    reason: 'payout',
    transactionType: 'win',
  });
}