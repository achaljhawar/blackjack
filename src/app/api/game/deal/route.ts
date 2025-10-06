import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games, users, transactions } from "@/server/db/schema";
import { eq, and, or } from "drizzle-orm";
import { initializeGame } from "@/lib/server-blackjack";
import type { BetAmountRequest } from "@/models/api";

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as BetAmountRequest;
    const { betAmount } = body;

    if (!betAmount || betAmount < 1) {
      return NextResponse.json(
        { error: "Minimum bet is 1 chip" },
        { status: 400 },
      );
    }

    // Create game in transaction
    // Generate game ID and initialize game state BEFORE transaction
    const gameId = crypto.randomUUID();
    const gameState = initializeGame(gameId, session.user.id, betAmount);

    let result;
    try {
      result = await db.transaction(async (tx) => {
        // Check for existing active game INSIDE transaction to prevent race conditions
        const activeGame = await tx.query.games.findFirst({
          where: and(
            eq(games.userId, session.user.id),
            or(
              eq(games.status, "playing"),
              eq(games.status, "dealer_turn")
            )
          ),
        });

        if (activeGame) {
          throw new Error("You already have an active game. Please complete it first.");
        }

        // Get user's current balance before deduction
        const user = await tx.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: { currentBalance: true, totalWagered: true },
        });

        if (!user) throw new Error("User not found");

        // Check if user has sufficient balance
        if (user.currentBalance < betAmount) {
          throw new Error(
            "Insufficient balance. Please purchase more chips to continue playing.",
          );
        }

        const balanceBefore = user.currentBalance;
        const balanceAfter = balanceBefore - betAmount;

        // Update user balance and totalWagered
        await tx
          .update(users)
          .set({
            currentBalance: balanceAfter,
            totalWagered: user.totalWagered + betAmount,
          })
          .where(eq(users.id, session.user.id));

        // Persist fully initialized game state to DB
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

        // Record bet transaction
        await tx.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          type: "bet",
          amount: -betAmount,
          balanceBefore,
          balanceAfter,
          gameId: gameState.id,
          metadata: {
            betAmount,
            action: "bet_placed",
          },
        });

        return { balanceAfter };
      });
    } catch (error) {
      console.error("Supabase error while creating game:", error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      game: gameState,
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
