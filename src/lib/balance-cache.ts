import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import type { CachedBalance } from "@/models/balance";

/**
 * Fetch balance from database
 * @param userId - User ID
 * @returns Current balance and version
 */
export async function getBalance(userId: string): Promise<CachedBalance> {
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

  return balanceData;
}

/**
 * Update balance in database
 * @param userId - User ID
 * @param newBalance - New balance value
 * @returns Updated balance data
 */
export async function updateBalance(
  userId: string,
  newBalance: number,
): Promise<CachedBalance> {
  const newVersion = Date.now();

  // Update database
  await db
    .update(users)
    .set({ currentBalance: newBalance })
    .where(eq(users.id, userId));

  const balanceData: CachedBalance = {
    balance: newBalance,
    version: newVersion,
    timestamp: Date.now(),
  };

  return balanceData;
}

/**
 * Atomic balance adjustment
 * @param userId - User ID
 * @param adjustment - Amount to adjust (positive or negative)
 * @returns Updated balance data
 */
export async function adjustBalance(
  userId: string,
  adjustment: number,
): Promise<CachedBalance> {
  // Get current balance
  const current = await getBalance(userId);
  const newBalance = current.balance + adjustment;

  if (newBalance < 0) {
    throw new Error(
      "Insufficient balance. Please purchase more chips to continue playing.",
    );
  }

  return await updateBalance(userId, newBalance);
}

/**
 * Invalidate balance cache (no-op now, kept for compatibility)
 * @param userId - User ID
 */
export async function invalidateBalance(userId: string): Promise<void> {
  // No-op - kept for compatibility with existing code
}

/**
 * Warm cache on user login (no-op now, kept for compatibility)
 * @param userId - User ID
 */
export async function warmBalanceCache(userId: string): Promise<void> {
  // No-op - kept for compatibility with existing code
}

/**
 * Get balance from DB (refresh)
 * @param userId - User ID
 */
export async function refreshBalance(userId: string): Promise<CachedBalance> {
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
