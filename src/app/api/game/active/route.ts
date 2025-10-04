import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { redis, userActiveGameKey, gameKey } from "@/server/redis";
import type { GameState } from "@/models/game";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for active game in Redis cache
    const activeGameId = await redis.get<string>(
      userActiveGameKey(session.user.id),
    );

    if (!activeGameId) {
      return NextResponse.json({
        success: true,
        game: null,
      });
    }

    // Fetch game state from Redis
    const gameState = await redis.get<GameState>(gameKey(activeGameId));

    if (!gameState) {
      // Game expired from cache
      await redis.del(userActiveGameKey(session.user.id));
      return NextResponse.json({
        success: true,
        game: null,
      });
    }

    // Only recover games that are in playing or dealer_turn status
    if (gameState.status !== "playing" && gameState.status !== "dealer_turn") {
      await redis.del(userActiveGameKey(session.user.id));
      return NextResponse.json({
        success: true,
        game: null,
      });
    }

    // Return the active game for recovery
    return NextResponse.json({
      success: true,
      game: {
        id: gameState.id,
        playerHand: gameState.playerHand,
        dealerHand: gameState.dealerHand,
        currentBet: gameState.betAmount,
        gameStatus: gameState.status,
        playerScore: gameState.playerScore,
        dealerScore: gameState.dealerScore,
      },
    });
  } catch (error) {
    console.error("Error fetching active game:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch active game",
      },
      { status: 500 },
    );
  }
}
