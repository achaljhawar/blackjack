import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users, games, transactions } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { drawCard, getHandValue, calculateHandValue } from "@/lib/server-blackjack";
import { dbGameToGameState } from "@/models/game-converters";
import type { GameState, Card, GameResult, TransactionType } from "@/models/game";
import type { GameIdRequest } from "@/models/api";
import { invalidateBalance } from "@/lib/balance-cache";

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

    // Verify it's dealer's turn
    if (dbGame.status !== "dealer_turn") {
      return NextResponse.json({ error: "Not dealer's turn" }, { status: 400 });
    }

    let dealerHand = dbGame.dealerHand as Card[];
    let dealerHandValue = calculateHandValue(dealerHand);

    // Check if dealer needs a card BEFORE drawing
    // Dealer stands on hard 17+ but hits on soft 17
    if (dealerHandValue.value >= 17 && !(dealerHandValue.value === 17 && dealerHandValue.isSoft)) {
      // Dealer is already done, settle the game immediately without drawing
      const playerValue = getHandValue(dbGame.playerHand as Card[]);
      const dealerValue = dealerHandValue.value;

      let result: GameResult;
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
        id: dbGame.id,
        userId: dbGame.userId,
        betAmount: dbGame.betAmount,
        playerHand: dbGame.playerHand as Card[],
        dealerHand,
        deck: [],
        status: "completed",
        result,
        playerScore: playerValue,
        dealerScore: dealerValue,
        createdAt: dbGame.createdAt,
        completedAt: new Date(),
      };

      // Calculate winnings
      let winnings = 0;
      let transactionType: TransactionType;

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
      let balanceAfter: number;
      try {
        balanceAfter = await db.transaction(async (tx) => {
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

          // Update user stats and balance
          await tx
            .update(users)
            .set({
              currentBalance: user.currentBalance + winnings,
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

          return user.currentBalance + winnings;
        });
      } catch (error) {
        await invalidateBalance(session.user.id);
        throw error;
      }

      return NextResponse.json({
        success: true,
        game: finalGame,
        needsMoreCards: false,
        gameComplete: true,
        newBalance: balanceAfter,
        dealerValue,
      });
    }

    // Draw one card for the dealer
    const newCard = drawCard();
    dealerHand = [...dealerHand, newCard];
    dealerHandValue = calculateHandValue(dealerHand);
    const dealerValue = dealerHandValue.value;

    // Check if dealer still needs more cards (hits on soft 17, stands on hard 17+)
    const stillNeedsCard = dealerHandValue.value < 17 || (dealerHandValue.value === 17 && dealerHandValue.isSoft);

    if (stillNeedsCard) {
      // Update database with intermediate state using converter
      const updatedGame = dbGameToGameState({
        ...dbGame,
        dealerHand,
        dealerScore: dealerValue,
      });

      await db
        .update(games)
        .set({
          dealerHand,
          dealerScore: dealerValue,
          lastActivityAt: new Date(),
          lastAction: "dealer_card",
        })
        .where(eq(games.id, gameId));

      return NextResponse.json({
        success: true,
        game: updatedGame,
        needsMoreCards: true,
        dealerValue,
      });
    }

    // Dealer is done, settle the game
    const playerValue = getHandValue(dbGame.playerHand as Card[]);

    let result: GameResult;
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
      id: dbGame.id,
      userId: dbGame.userId,
      betAmount: dbGame.betAmount,
      playerHand: dbGame.playerHand as Card[],
      dealerHand,
      deck: [],
      status: "completed",
      result,
      playerScore: playerValue,
      dealerScore: dealerValue,
      createdAt: dbGame.createdAt,
      completedAt: new Date(),
    };

    // Calculate winnings
    let winnings = 0;
    let transactionType: TransactionType;

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
    let balanceAfter: number;
    try {
      balanceAfter = await db.transaction(async (tx) => {
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

        // Update user stats and balance (wagered was already incremented in /api/game/deal)
        await tx
          .update(users)
          .set({
            currentBalance: user.currentBalance + winnings,
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

        return user.currentBalance + winnings;
      });
    } catch (error) {
      await invalidateBalance(session.user.id);
      throw error;
    }

    return NextResponse.json({
      success: true,
      game: finalGame,
      needsMoreCards: false,
      gameComplete: true,
      newBalance: balanceAfter,
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
