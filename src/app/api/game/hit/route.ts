import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { hit } from "@/lib/server-blackjack";
import type { GameState } from "@/models/game";
import { redis, gameKey, GAME_CACHE_TTL } from "@/server/redis";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { gameId: string };
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 },
      );
    }

    // Fetch game state from Redis
    const cachedGame = await redis.get<GameState>(gameKey(gameId));

    if (!cachedGame) {
      return NextResponse.json(
        { error: "Game not found or expired" },
        { status: 404 },
      );
    }

    // Verify game belongs to user
    if (cachedGame.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Execute hit
    const updatedGame = hit(cachedGame);

    // Update cache
    await redis.setex(
      gameKey(gameId),
      GAME_CACHE_TTL,
      JSON.stringify(updatedGame),
    );

    // Only update DB if game is completed (bust)
    if (updatedGame.status === "completed") {
      await db
        .update(games)
        .set({
          playerHand: updatedGame.playerHand,
          dealerHand: updatedGame.dealerHand,
          status: updatedGame.status,
          result: updatedGame.result,
          playerScore: updatedGame.playerScore,
          dealerScore: updatedGame.dealerScore,
          completedAt: updatedGame.completedAt,
          lastActivityAt: new Date(),
          lastAction: "hit",
        })
        .where(eq(games.id, gameId));
    }

    return NextResponse.json({
      success: true,
      game: updatedGame,
    });
  } catch (error) {
    console.error("Error hitting:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to hit",
      },
      { status: 500 },
    );
  }
}
