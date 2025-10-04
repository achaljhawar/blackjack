import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
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

    // Update cache only (no DB write for intermediate state)
    await redis.setex(gameKey(gameId), 60 * 60, JSON.stringify(updatedGame));

    return NextResponse.json({
      success: true,
      game: updatedGame,
      needsDealerTurn: true,
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
