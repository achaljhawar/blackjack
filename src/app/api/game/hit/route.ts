import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { hit } from "@/lib/server-blackjack";
import { dbGameToGameState } from "@/lib/game-converters";
import type { GameIdRequest } from "@/models/api";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as GameIdRequest;
    const { gameId } = body;

    if (!gameId) {
      return NextResponse.json(
        { error: "Game ID is required" },
        { status: 400 },
      );
    }

    // Fetch game state from database
    const dbGame = await db.query.games.findFirst({
      where: eq(games.id, gameId),
    });

    if (!dbGame) {
      return NextResponse.json(
        { error: "Game not found" },
        { status: 404 },
      );
    }

    // Verify game belongs to user
    if (dbGame.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Convert DB game to GameState using shared converter
    const currentGame = dbGameToGameState(dbGame);

    // Execute hit
    const updatedGame = hit(currentGame);

    // Update database with new state
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
