import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { stand } from "@/lib/server-blackjack";
import { dbGameToGameState } from "@/models/game-converters";
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

    // Execute stand in a transaction to prevent race conditions
    let updatedGame;
    try {
      updatedGame = await db.transaction(async (tx) => {
        // Optimized: Only fetch necessary columns for validation
        const dbGame = await tx.query.games.findFirst({
          where: eq(games.id, gameId),
          columns: {
            id: true,
            userId: true,
            status: true,
            playerHand: true,
            dealerHand: true,
            betAmount: true,
            deck: true,
            result: true,
            playerScore: true,
            dealerScore: true,
            createdAt: true,
            completedAt: true,
            lastActivityAt: true,
            lastAction: true,
          },
        });

        if (!dbGame) {
          throw new Error("Game not found");
        }

        // Verify game belongs to user
        if (dbGame.userId !== session.user.id) {
          throw new Error("Unauthorized");
        }

        // Verify game is in playing status
        if (dbGame.status !== "playing") {
          throw new Error("Cannot stand - game is not in playing status");
        }

        // Convert DB game to GameState using shared converter
        const currentGame = dbGameToGameState(dbGame);

        // Execute stand (reveals dealer card) - DO NOT play dealer turn yet
        const newGame = stand(currentGame);

        // Update database with new state
        await tx
          .update(games)
          .set({
            playerHand: newGame.playerHand,
            dealerHand: newGame.dealerHand,
            status: newGame.status,
            result: newGame.result,
            playerScore: newGame.playerScore,
            dealerScore: newGame.dealerScore,
            completedAt: newGame.completedAt,
            lastActivityAt: new Date(),
            lastAction: "stand",
          })
          .where(eq(games.id, gameId));

        return newGame;
      });
    } catch (error) {
      console.error("Transaction error during stand:", error);
      if (error instanceof Error) {
        if (error.message === "Game not found") {
          return NextResponse.json(
            { error: "Game not found" },
            { status: 404 },
          );
        }
        if (error.message === "Unauthorized") {
          return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }
        if (error.message === "Cannot stand - game is not in playing status") {
          return NextResponse.json(
            { error: error.message },
            { status: 400 },
          );
        }
      }
      throw error;
    }

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
