import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users, games, transactions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { drawCard, calculateHandValue } from "@/lib/server-blackjack";
import type { GameState } from "@/models/game";
import { redis, gameKey, userActiveGameKey } from "@/server/redis";
import { creditWinnings, invalidateBalance } from "@/lib/balance-cache";

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

    // Verify it's dealer's turn
    if (cachedGame.status !== "dealer_turn") {
      return NextResponse.json({ error: "Not dealer's turn" }, { status: 400 });
    }

    let dealerHand = cachedGame.dealerHand;
    let dealerValue = calculateHandValue(dealerHand);

    // Draw one card for the dealer
    const newCard = drawCard();
    dealerHand = [...dealerHand, newCard];
    dealerValue = calculateHandValue(dealerHand);

    // Check if dealer still needs more cards
    const stillNeedsCard = dealerValue < 17;

    if (stillNeedsCard) {
      // Update cache only (no DB write for intermediate states)
      const updatedGame: GameState = {
        ...cachedGame,
        dealerHand,
        dealerScore: dealerValue,
      };

      await redis.setex(gameKey(gameId), 60 * 60, JSON.stringify(updatedGame));

      return NextResponse.json({
        success: true,
        game: updatedGame,
        needsMoreCards: true,
        dealerValue,
      });
    }

    // Dealer is done, settle the game
    const playerValue = calculateHandValue(cachedGame.playerHand);

    let result: "win" | "lose" | "push" | "blackjack";
    if (dealerValue > 21) {
      result = "win";
    } else if (playerValue > dealerValue) {
      result = "win";
    } else if (playerValue < dealerValue) {
      result = "lose";
    } else {
      result = "push";
    }

    const finalGame: GameState = {
      ...cachedGame,
      dealerHand,
      status: "completed",
      result,
      playerScore: playerValue,
      dealerScore: dealerValue,
      completedAt: new Date(),
    };

    // Calculate winnings
    let winnings = 0;
    let transactionType = "";

    switch (result) {
      case "win":
        winnings = finalGame.betAmount * 2;
        transactionType = "bet_won";
        break;
      case "push":
        winnings = finalGame.betAmount;
        transactionType = "bet_push";
        break;
      case "lose":
        winnings = 0;
        transactionType = "bet_lost";
        break;
    }

    // Persist final game state and update balance
    try {
      await db.transaction(async (tx) => {
        const user = await tx.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: {
            currentBalance: true,
            totalWagered: true,
            totalWins: true,
            totalLosses: true,
            totalPushes: true,
          },
        });

        if (!user) throw new Error("User not found");

        // Update user stats (wagered was already incremented in /api/game/deal)
        await tx
          .update(users)
          .set({
            totalWins: result === "win" ? user.totalWins + 1 : user.totalWins,
            totalLosses:
              result === "lose" ? user.totalLosses + 1 : user.totalLosses,
            totalPushes:
              result === "push" ? user.totalPushes + 1 : user.totalPushes,
          })
          .where(eq(users.id, session.user.id));

        // Update game in database
        await tx
          .update(games)
          .set({
            playerHand: finalGame.playerHand,
            dealerHand: finalGame.dealerHand,
            status: finalGame.status,
            result: finalGame.result,
            playerScore: finalGame.playerScore,
            dealerScore: finalGame.dealerScore,
            completedAt: finalGame.completedAt,
            lastActivityAt: new Date(),
            lastAction: "dealer_card",
          })
          .where(eq(games.id, gameId));

        // Record transaction
        await tx.insert(transactions).values({
          id: crypto.randomUUID(),
          userId: session.user.id,
          type: transactionType,
          amount: winnings,
          balanceBefore: user.currentBalance,
          balanceAfter: user.currentBalance + winnings,
          gameId,
          metadata: {
            betAmount: finalGame.betAmount,
            playerScore: finalGame.playerScore,
            dealerScore: finalGame.dealerScore,
            result: finalGame.result,
            winnings,
          },
        });
      });
    } catch (error) {
      await invalidateBalance(session.user.id);
      throw error;
    }

    // Credit winnings
    const balanceResult = await creditWinnings(session.user.id, winnings);

    // Clear game from Redis cache
    await redis.del(gameKey(gameId));
    await redis.del(userActiveGameKey(session.user.id));

    return NextResponse.json({
      success: true,
      game: finalGame,
      needsMoreCards: false,
      gameComplete: true,
      newBalance: balanceResult.balance,
      dealerValue,
    });
  } catch (error) {
    console.error("Error dealing dealer card:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to deal dealer card",
      },
      { status: 500 },
    );
  }
}
