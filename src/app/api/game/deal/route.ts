import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games, users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { initializeGame } from "@/lib/server-blackjack";
import {
  redis,
  gameKey,
  userActiveGameKey,
  GAME_CACHE_TTL,
} from "@/server/redis";
import { deductBet, invalidateBalance } from "@/lib/balance-cache";
import type { GameState } from "@/models/game";

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

    // Check for existing active game (concurrent game prevention)
    const activeGameId = await redis.get<string>(
      userActiveGameKey(session.user.id),
    );
    if (activeGameId) {
      const activeGame = await redis.get<GameState>(gameKey(activeGameId));
      if (
        activeGame &&
        (activeGame.status === "playing" || activeGame.status === "dealer_turn")
      ) {
        return NextResponse.json(
          {
            error: "You already have an active game. Please complete it first.",
          },
          { status: 400 },
        );
      }
    }

    // Deduct bet with balance cache integration
    let balanceResult;
    try {
      balanceResult = await deductBet(session.user.id, betAmount);
    } catch (error) {
      if (error instanceof Error) {
        // Pass through the detailed error message from balance-cache
        return NextResponse.json({ error: error.message }, { status: 400 });
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

        // Update totalWagered stat
        const user = await tx.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: { totalWagered: true },
        });

        if (!user) throw new Error("User not found");

        await tx
          .update(users)
          .set({ totalWagered: user.totalWagered + betAmount })
          .where(eq(users.id, session.user.id));

        // Persist initial game state to DB
        await tx.insert(games).values({
          id: gameState.id,
          userId: gameState.userId,
          betAmount: gameState.betAmount,
          playerHand: gameState.playerHand,
          dealerHand: gameState.dealerHand,
          deck: [], // Empty deck for infinite deck mode
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
