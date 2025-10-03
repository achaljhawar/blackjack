import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { stand } from "@/lib/server-blackjack";
import type { GameState } from "@/models/game";
import { redis, gameKey } from "@/server/redis";

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

    // Execute stand (reveals dealer card) - DO NOT play dealer turn yet
    const updatedGame = stand(cachedGame);

    // Update database with lastActivityAt and lastAction
    await db
      .update(games)
      .set({
        dealerHand: updatedGame.dealerHand,
        status: updatedGame.status,
        dealerScore: updatedGame.dealerScore,
        lastActivityAt: new Date(),
        lastAction: "stand",
      })
      .where(eq(games.id, gameId));

    // Update cache with revealed dealer card state (dealer_turn status)
    await redis.setex(
      gameKey(gameId),
      60 * 60, // 1 hour TTL
      JSON.stringify(updatedGame),
    );

    return NextResponse.json({
      success: true,
      game: updatedGame,
      needsDealerTurn: true, // Signal client to start progressive dealing
    });
  } catch (error) {
    console.error("Error standing:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to stand",
      },
      { status: 500 },
    );
  }
}
