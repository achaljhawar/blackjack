import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { and, eq, or } from "drizzle-orm";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for active game in database
    const activeGame = await db.query.games.findFirst({
      where: and(
        eq(games.userId, session.user.id),
        or(
          eq(games.status, "playing"),
          eq(games.status, "dealer_turn")
        )
      ),
      orderBy: (games, { desc }) => [desc(games.createdAt)],
    });

    if (!activeGame) {
      return NextResponse.json({
        success: true,
        game: null,
      });
    }

    // Return the active game for recovery
    return NextResponse.json({
      success: true,
      game: {
        id: activeGame.id,
        playerHand: activeGame.playerHand,
        dealerHand: activeGame.dealerHand,
        currentBet: activeGame.betAmount,
        gameStatus: activeGame.status,
        playerScore: activeGame.playerScore,
        dealerScore: activeGame.dealerScore,
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
