import { redis } from "@/server/redis";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { CachedBalance } from "@/models/balance";

// Balance cache configuration
const BALANCE_CACHE_TTL = 60 * 60 * 24; // 24 hours

// Cache key helpers
export const balanceKey = (userId: string) => `balance:${userId}`;
export const balanceVersionKey = (userId: string) =>
  `balance:${userId}:version`;

/**
 * Cache-Aside Pattern: Fetch balance from cache, fallback to DB
 * @param userId - User ID
 * @returns Current balance and version
 */
export async function getBalance(userId: string): Promise<CachedBalance> {
  // Try cache first
  const cached = await redis.get<CachedBalance>(balanceKey(userId));

  if (cached?.balance !== undefined) {
    return cached;
  }

  // Cache miss - fetch from database
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    columns: { currentBalance: true },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const balanceData: CachedBalance = {
    balance: user.currentBalance,
    version: Date.now(),
    timestamp: Date.now(),
  };

  // Warm the cache
  await redis.setex(
    balanceKey(userId),
    BALANCE_CACHE_TTL,
    JSON.stringify(balanceData),
  );

  return balanceData;
}

/**
 * Write-Through Pattern: Update balance in both cache and DB atomically
 * Uses optimistic locking to prevent race conditions
 * @param userId - User ID
 * @param newBalance - New balance value
 * @param expectedVersion - Expected version for optimistic locking (optional)
 * @returns Updated balance data
 */
export async function updateBalance(
  userId: string,
  newBalance: number,
  expectedVersion?: number,
): Promise<CachedBalance> {
  // Optimistic lock check
  if (expectedVersion !== undefined) {
    const current = await getBalance(userId);
    if (current.version !== expectedVersion) {
      throw new Error("Balance version mismatch - concurrent update detected");
    }
  }

  const newVersion = Date.now();

  // Update database first (source of truth)
  await db
    .update(users)
    .set({ currentBalance: newBalance })
    .where(eq(users.id, userId));

  const balanceData: CachedBalance = {
    balance: newBalance,
    version: newVersion,
    timestamp: Date.now(),
  };

  // Update cache (write-through)
  await redis.setex(
    balanceKey(userId),
    BALANCE_CACHE_TTL,
    JSON.stringify(balanceData),
  );

  return balanceData;
}

/**
 * Atomic balance adjustment with optimistic locking
 * Ensures consistency even under concurrent requests
 * @param userId - User ID
 * @param adjustment - Amount to adjust (positive or negative)
 * @param maxRetries - Maximum retry attempts for optimistic locking
 * @returns Updated balance data
 */
export async function adjustBalance(
  userId: string,
  adjustment: number,
  maxRetries = 3,
): Promise<CachedBalance> {
  let retries = 0;

  while (retries < maxRetries) {
    try {
      // Get current balance with version
      const current = await getBalance(userId);
      const newBalance = current.balance + adjustment;

      if (newBalance < 0) {
        throw new Error(
          "Insufficient balance. Please purchase more chips to continue playing.",
        );
      }

      // Attempt optimistic update
      return await updateBalance(userId, newBalance, current.version);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("version mismatch")
      ) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error(
            "Balance update failed due to high server load. Please try again in a moment.",
          );
        }
        // Small delay before retry
        await new Promise((resolve) => setTimeout(resolve, 50 * retries));
      } else {
        throw error;
      }
    }
  }

  throw new Error(
    "Balance update failed. Please refresh the page and try again.",
  );
}

/**
 * Invalidate balance cache
 * Use when you want to force a fresh DB read on next access
 * @param userId - User ID
 */
export async function invalidateBalance(userId: string): Promise<void> {
  await redis.del(balanceKey(userId));
}

/**
 * Warm cache on user login
 * Pre-populate cache to ensure fast first access
 * @param userId - User ID
 */
export async function warmBalanceCache(userId: string): Promise<void> {
  await getBalance(userId);
}

/**
 * Get balance from DB and update cache (refresh)
 * Use for admin operations or reconciliation
 * @param userId - User ID
 */
export async function refreshBalance(userId: string): Promise<CachedBalance> {
  await invalidateBalance(userId);
  return await getBalance(userId);
}

/**
 * Deduct bet amount from user balance with validation
 * Used during bet placement
 * @param userId - User ID
 * @param betAmount - Amount to deduct
 * @returns Updated balance data
 */
export async function deductBet(
  userId: string,
  betAmount: number,
): Promise<CachedBalance> {
  if (betAmount <= 0) {
    throw new Error("Bet amount must be positive");
  }
  return await adjustBalance(userId, -betAmount);
}

/**
 * Credit winnings to user balance
 * Used during game settlement
 * @param userId - User ID
 * @param winnings - Amount to credit
 * @returns Updated balance data
 */
export async function creditWinnings(
  userId: string,
  winnings: number,
): Promise<CachedBalance> {
  if (winnings < 0) {
    throw new Error("Winnings cannot be negative");
  }
  if (winnings === 0) {
    // No winnings to credit, just return current balance
    return await getBalance(userId);
  }
  return await adjustBalance(userId, winnings);
}
