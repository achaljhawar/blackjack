import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { initializeGame } from "@/lib/server-blackjack";
import {
  redis,
  gameKey,
  userActiveGameKey,
  GAME_CACHE_TTL,
} from "@/server/redis";
import { deductBet, invalidateBalance } from "@/lib/balance-cache";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { betAmount: number };
    const { betAmount } = body;

    if (!betAmount || betAmount < 10) {
      return NextResponse.json(
        { error: "Minimum bet is 10 chips" },
        { status: 400 },
      );
    }

    // Deduct bet with balance cache integration
    let balanceResult;
    try {
      balanceResult = await deductBet(session.user.id, betAmount);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message.includes("Insufficient balance")
      ) {
        return NextResponse.json(
          { error: "Insufficient balance" },
          { status: 400 },
        );
      }
      throw error;
    }

    // Create game in transaction
    let result;
    try {
      result = await db.transaction(async (tx) => {
        const gameId = crypto.randomUUID();

        // Initialize game state
        const gameState = initializeGame(gameId, session.user.id, betAmount);

        // Persist initial game state to DB
        await tx.insert(games).values({
          id: gameState.id,
          userId: gameState.userId,
          betAmount: gameState.betAmount,
          playerHand: gameState.playerHand,
          dealerHand: gameState.dealerHand,
          deck: gameState.deck,
          status: gameState.status,
          result: gameState.result,
          playerScore: gameState.playerScore,
          dealerScore: gameState.dealerScore,
          createdAt: gameState.createdAt,
          completedAt: gameState.completedAt,
          lastActivityAt: new Date(),
          lastAction: "bet_placed",
        });

        return { gameState, balanceAfter: balanceResult.balance };
      });
    } catch (error) {
      // Rollback: refund the bet by invalidating cache to force DB sync
      await invalidateBalance(session.user.id);
      throw error;
    }

    // Cache game state in Redis with 1 hour TTL
    await redis.setex(
      gameKey(result.gameState.id),
      GAME_CACHE_TTL,
      JSON.stringify(result.gameState),
    );

    // Track user's active game
    await redis.setex(
      userActiveGameKey(session.user.id),
      GAME_CACHE_TTL,
      result.gameState.id,
    );

    return NextResponse.json({
      success: true,
      game: result.gameState,
      balanceAfter: result.balanceAfter,
    });
  } catch (error) {
    console.error("Error dealing game:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to deal game",
      },
      { status: 500 },
    );
  }
}
