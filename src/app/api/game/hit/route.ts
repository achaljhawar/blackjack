import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { hit } from "@/lib/server-blackjack";
import type { GameState } from "@/models/game";

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

    // Convert DB game to GameState
    const currentGame: GameState = {
      id: dbGame.id,
      userId: dbGame.userId,
      betAmount: dbGame.betAmount,
      playerHand: dbGame.playerHand,
      dealerHand: dbGame.dealerHand,
      deck: [],
      status: dbGame.status as "playing" | "dealer_turn" | "completed",
      result: dbGame.result as "win" | "lose" | "push" | "forfeit" | null,
      playerScore: dbGame.playerScore,
      dealerScore: dbGame.dealerScore,
      createdAt: dbGame.createdAt,
      completedAt: dbGame.completedAt,
    };

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
