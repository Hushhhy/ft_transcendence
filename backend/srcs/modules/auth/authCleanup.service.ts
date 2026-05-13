import prisma from '../../lib/prisma';
import logger from '../../lib/logger';

const DEFAULT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

export function startExpiredUnverifiedAccountsCleanup(intervalMs: number = DEFAULT_CLEANUP_INTERVAL_MS): NodeJS.Timeout {
  let isCleanupRunning = false;

  const cleanupExpiredUnverifiedAccounts = async () => {
    if (isCleanupRunning) {
      return;
    }

    isCleanupRunning = true;
    try {
      const { count } = await prisma.user.deleteMany({
        where: {
          verified: false,
          emailVerificationExpiry: {
            lt: new Date(),
          },
        },
      });

      if (count > 0) {
        logger.info(`[Auth Cleanup] Deleted ${count} expired unverified account(s)`);
      }
    } catch (error) {
      logger.error(`[Auth Cleanup] Failed to delete expired unverified accounts: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      isCleanupRunning = false;
    }
  };

  void cleanupExpiredUnverifiedAccounts();

  return setInterval(() => {
    void cleanupExpiredUnverifiedAccounts();
  }, intervalMs);
}
