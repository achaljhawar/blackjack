"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { PlayingCard } from "@/components/playing-card";
import type { Card, ClientGameState } from "@/models/game";
import type {
  DealResponse,
  HitResponse,
  StandResponse,
  DealerCardResponse,
} from "@/models/api";
import { useBalance } from "@/lib/balance-context";
import { z } from "zod";
import { toast } from "sonner";

// Zod schema for bet validation
const createBetSchema = (maxBalance: number) =>
  z
    .number()
    .positive("Bet must be greater than 0")
    .max(maxBalance, `Maximum bet is ${maxBalance}`)
    .int("Bet must be a whole number");

function calculateHandValue(hand: Card[]): number {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.faceDown) continue;

    if (card.rank === "A") {
      aces += 1;
      value += 11;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      value += 10;
    } else {
      value += Number.parseInt(card.rank);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return value;
}

export default function BlackjackClient() {
  const { balance, setBalance, refreshBalance } = useBalance();
  const [gameState, setGameState] = useState<ClientGameState>({
    playerHand: [],
    dealerHand: [],
    playerChips: 0,
    currentBet: 0,
    gameStatus: "betting",
  });
  const [betInput, setBetInput] = useState<string>("100");
  const [betError, setBetError] = useState<string>("");
  const [animatingCard, setAnimatingCard] = useState<string | null>(null);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [isHitting, setIsHitting] = useState(false);
  const [isStanding, setIsStanding] = useState(false);
  const [aiAssist, setAiAssist] = useState<{
    action: "hit" | "stand";
    reasoning: string;
  } | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const prevPlayerHandLength = useRef(0);
  const prevDealerHandLength = useRef(0);
  const prevDealerHadFaceDown = useRef(false);
  const hasResumedDealerTurn = useRef(false);

  const playerValue =
    gameState.playerScore ?? calculateHandValue(gameState.playerHand);
  const dealerValue =
    gameState.dealerScore ?? calculateHandValue(gameState.dealerHand);

  // Fetch balance and check for active game on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsInitializing(true);
        // Fetch balance
        await refreshBalance();
        const currentBalance = balance ?? 0;
        setGameState((prev) => ({ ...prev, playerChips: currentBalance }));

        // Check for active game and attempt recovery
        const response = await fetch("/api/game/active");
        const data = (await response.json()) as {
          success: boolean;
          game?: ClientGameState;
        };

        if (data.success && data.game) {
          // Recover the active game
          setGameState({
            ...data.game,
            playerChips: currentBalance,
          });
        }
      } catch (error) {
        console.error("Failed to initialize:", error);
      } finally {
        setIsInitializing(false);
      }
    };

    void initialize();
  }, [balance, refreshBalance]);

  // Sync playerChips with balance from context
  useEffect(() => {
    if (balance !== null) {
      setGameState((prev) => ({ ...prev, playerChips: balance }));
    }
  }, [balance]);

  // Resume dealer turn after recovery if game is in dealer_turn status
  useEffect(() => {
    const resumeDealerTurn = async () => {
      if (
        gameState.gameStatus === "dealer_turn" &&
        gameState.id &&
        !isStanding &&
        !isInitializing &&
        !hasResumedDealerTurn.current
      ) {
        hasResumedDealerTurn.current = true;
        setIsStanding(true);

        const CARD_DELAY = 400;
        try {
          let needsMoreCards = true;

          while (needsMoreCards) {
            await new Promise((resolve) => setTimeout(resolve, CARD_DELAY));

            const response = await fetch("/api/game/dealer-card", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ gameId: gameState.id }),
            });

            const data = (await response.json()) as DealerCardResponse;

            if (!data.success || !data.game) {
              setGameState((prev) => ({
                ...prev,
                message: data.error ?? "Failed to deal dealer card",
              }));
              setIsStanding(false);
              return;
            }

            const game = data.game;

            setGameState((prev) => ({
              ...prev,
              dealerHand: game.dealerHand,
              dealerScore: game.dealerScore,
            }));

            needsMoreCards = data.needsMoreCards ?? false;

            if (data.gameComplete) {
              await new Promise((resolve) => setTimeout(resolve, 300));

              let message = "";
              if (game.result === "win") {
                message =
                  game.dealerScore && game.dealerScore > 21
                    ? "Dealer busts! You win!"
                    : "You win!";
              } else if (game.result === "lose") {
                message = "You lose.";
              } else if (game.result === "push") {
                message = "Push - tie game.";
              }

              setBalance(data.newBalance!);

              setGameState((prev) => ({
                ...prev,
                playerChips: data.newBalance!,
                gameStatus: "gameOver",
                result: game.result,
                message,
              }));

              setIsStanding(false);
            }
          }
        } catch (error) {
          console.error("Failed to deal dealer cards:", error);
          setIsStanding(false);
        }
      }
    };

    void resumeDealerTurn();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.gameStatus, gameState.id, isInitializing]);

  useEffect(() => {
    let cardToAnimate: string | null = null;

    // Check if player got a new card
    if (gameState.playerHand.length > prevPlayerHandLength.current) {
      const newIndex = gameState.playerHand.length - 1;
      cardToAnimate = `player-${newIndex}`;
    }
    // Check if dealer got a new card
    else if (gameState.dealerHand.length > prevDealerHandLength.current) {
      const newIndex = gameState.dealerHand.length - 1;
      cardToAnimate = `dealer-${newIndex}`;
    }
    const dealerHasFaceDown = gameState.dealerHand.some(
      (card) => card.faceDown,
    );
    if (
      prevDealerHadFaceDown.current &&
      !dealerHasFaceDown &&
      gameState.dealerHand.length > 0
    ) {
      // The face-down card was just flipped (it's always the second card, index 1)
      cardToAnimate = `dealer-1`;
    }

    if (cardToAnimate) {
      setAnimatingCard(cardToAnimate);

      const timer = setTimeout(() => {
        setAnimatingCard(null);
      }, 500);

      prevPlayerHandLength.current = gameState.playerHand.length;
      prevDealerHandLength.current = gameState.dealerHand.length;
      prevDealerHadFaceDown.current = dealerHasFaceDown;

      return () => clearTimeout(timer);
    }

    prevPlayerHandLength.current = gameState.playerHand.length;
    prevDealerHandLength.current = gameState.dealerHand.length;
    prevDealerHadFaceDown.current = dealerHasFaceDown;
  }, [gameState.playerHand, gameState.dealerHand, gameState.gameStatus]);

  useEffect(() => {
    if (gameState.gameStatus === "betting") {
      prevPlayerHandLength.current = 0;
      prevDealerHandLength.current = 0;
      prevDealerHadFaceDown.current = false;
      hasResumedDealerTurn.current = false;
      setAnimatingCard(null);
    }
  }, [gameState.gameStatus]);

  const handlePlaceBet = async () => {
    const bet = Number(betInput);

    // Check if bet is a valid number
    if (isNaN(bet) || !Number.isFinite(bet)) {
      setBetError("Please enter a valid number");
      return;
    }

    // Validate bet using Zod
    const betSchema = createBetSchema(gameState.playerChips);
    const validation = betSchema.safeParse(bet);

    if (!validation.success) {
      const errorMessage =
        validation.error?.errors?.[0]?.message ?? "Invalid bet";
      setBetError(errorMessage);
      return;
    }

    setBetError("");
    setIsPlacingBet(true);

    try {
      const response = await fetch("/api/game/deal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ betAmount: bet }),
      });

      const data = (await response.json()) as DealResponse;

      if (!data.success || !data.game) {
        const errorMessage = data.error ?? "Failed to deal";
        toast.error(errorMessage);
        setGameState({
          ...gameState,
          message: errorMessage,
        });
        setIsPlacingBet(false);
        return;
      }

      // Update balance in context (will propagate to navbar)
      setBalance(data.balanceAfter!);

      // Update game state from server
      setGameState({
        id: data.game.id,
        playerHand: data.game.playerHand,
        dealerHand: data.game.dealerHand,
        playerChips: data.balanceAfter!,
        currentBet: data.game.betAmount,
        gameStatus: data.game.status === "completed" ? "gameOver" : "playing",
        result: data.game.result,
        playerScore: data.game.playerScore,
        dealerScore: data.game.dealerScore,
        message:
          data.game.result === "push"
            ? "Both have Blackjack! Push."
            : data.game.result === "win"
              ? "Blackjack! You win!"
              : undefined,
      });
    } catch (error) {
      console.error("Failed to deal:", error);
      toast.error("Failed to create game. Please try again.");
      setGameState({ ...gameState, message: "Failed to deal" });
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleHit = async () => {
    if (!gameState.id || isHitting) return;

    setIsHitting(true);

    try {
      const response = await fetch("/api/game/hit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: gameState.id }),
      });

      const data = (await response.json()) as HitResponse;

      if (!data.success || !data.game) {
        setGameState({ ...gameState, message: data.error ?? "Failed to hit" });
        setIsHitting(false);
        return;
      }

      setGameState({
        ...gameState,
        playerHand: data.game.playerHand,
        dealerHand: data.game.dealerHand,
        gameStatus: data.game.status === "completed" ? "gameOver" : "playing",
        result: data.game.result,
        playerScore: data.game.playerScore,
        dealerScore: data.game.dealerScore,
        message: data.game.result === "lose" ? "Bust! You lose." : undefined,
      });
    } catch (error) {
      console.error("Failed to hit:", error);
    } finally {
      setIsHitting(false);
    }
  };

  const handleStand = async () => {
    if (!gameState.id || isStanding) return;

    setIsStanding(true);

    try {
      // Step 1: Stand (reveals dealer's face-down card)
      const response = await fetch("/api/game/stand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameId: gameState.id }),
      });

      const data = (await response.json()) as StandResponse;

      if (!data.success || !data.game) {
        setGameState({
          ...gameState,
          message: data.error ?? "Failed to stand",
        });
        setIsStanding(false);
        return;
      }

      // Update state with revealed dealer card
      setGameState({
        ...gameState,
        playerHand: data.game.playerHand,
        dealerHand: data.game.dealerHand,
        gameStatus: "dealer_turn",
        playerScore: calculateHandValue(data.game.playerHand),
        dealerScore: calculateHandValue(data.game.dealerHand),
      });

      // Step 2: If dealer needs to play, progressively deal cards
      if (data.needsDealerTurn) {
        await dealDealerCardsProgressively(gameState.id);
      }
    } catch (error) {
      console.error("Failed to stand:", error);
      setIsStanding(false);
    }
  };

  const dealDealerCardsProgressively = async (gameId: string) => {
    const CARD_DELAY = 400; // 400ms between each card for smooth gameplay

    try {
      let needsMoreCards = true;

      while (needsMoreCards) {
        // Wait for card animation
        await new Promise((resolve) => setTimeout(resolve, CARD_DELAY));

        const response = await fetch("/api/game/dealer-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gameId }),
        });

        const data = (await response.json()) as DealerCardResponse;

        if (!data.success || !data.game) {
          setGameState((prev) => ({
            ...prev,
            message: data.error ?? "Failed to deal dealer card",
          }));
          setIsStanding(false);
          return;
        }

        // TypeScript type guard - at this point data.game is defined
        const game = data.game;

        // Update game state with new dealer card
        setGameState((prev) => ({
          ...prev,
          dealerHand: game.dealerHand,
          dealerScore: game.dealerScore,
        }));

        needsMoreCards = data.needsMoreCards ?? false;

        // If game is complete, show final result
        if (data.gameComplete) {
          // Brief pause before showing result
          await new Promise((resolve) => setTimeout(resolve, 300));

          let message = "";
          if (game.result === "win") {
            message =
              game.dealerScore && game.dealerScore > 21
                ? "Dealer busts! You win!"
                : "You win!";
          } else if (game.result === "lose") {
            message = "You lose.";
          } else if (game.result === "push") {
            message = "Push - tie game.";
          }

          // Update balance in context (will propagate to navbar)
          setBalance(data.newBalance!);

          setGameState((prev) => ({
            ...prev,
            playerChips: data.newBalance!,
            gameStatus: "gameOver",
            result: game.result,
            message,
          }));

          setIsStanding(false);
        }
      }
    } catch (error) {
      console.error("Failed to deal dealer cards:", error);
      setIsStanding(false);
    }
  };

  const handleGetAIAssist = async () => {
    if (!gameState.dealerHand[0] || gameState.playerHand.length === 0) return;

    setIsLoadingAI(true);
    try {
      const response = await fetch("/api/game/ai-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerHand: gameState.playerHand,
          dealerUpCard: gameState.dealerHand[0],
        }),
      });

      const data = (await response.json()) as {
        success: boolean;
        recommendation?: { action: "hit" | "stand"; reasoning: string };
        error?: string;
      };

      if (data.success && data.recommendation) {
        setAiAssist({
          action: data.recommendation.action,
          reasoning: data.recommendation.reasoning,
        });
      }
    } catch (error) {
      console.error("Failed to get AI assist:", error);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleNewGame = () => {
    setGameState({
      playerHand: [],
      dealerHand: [],
      playerChips: gameState.playerChips,
      currentBet: 0,
      gameStatus: "betting",
      result: undefined,
      message: undefined,
    });
    setBetInput("100");
    setAiAssist(null);
  };

  const adjustBet = (amount: number) => {
    const currentBet = Number.parseInt(betInput) || 0;
    const newBet = Math.max(
      1,
      Math.min(gameState.playerChips, currentBet + amount),
    );
    setBetInput(newBet.toString());
    setBetError(""); // Clear error when adjusting bet
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Game Area */}
      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:gap-12 sm:p-8">
        {/* Dealer's Hand */}
        <div className="flex flex-col items-center gap-2 sm:gap-4">
          <div className="flex gap-2 sm:gap-3">
            {gameState.gameStatus === "betting" ? (
              <>
                <PlayingCard />
                <PlayingCard />
              </>
            ) : (
              gameState.dealerHand.map((card, index) => (
                <PlayingCard
                  key={`dealer-${index}`}
                  card={card}
                  isNew={animatingCard === `dealer-${index}`}
                />
              ))
            )}
          </div>
          <div className="bg-card text-foreground border-border rounded-lg border px-4 py-1.5 text-sm font-semibold sm:px-6 sm:py-2 sm:text-base">
            {gameState.gameStatus === "betting"
              ? "Dealer"
              : `${dealerValue} Dealer`}
          </div>
        </div>

        {/* Player's Hand */}
        <div className="flex flex-col items-center gap-2 sm:gap-4">
          <div className="flex gap-2 sm:gap-3">
            {gameState.gameStatus === "betting" ? (
              <>
                <PlayingCard />
                <PlayingCard />
              </>
            ) : (
              gameState.playerHand.map((card, index) => (
                <PlayingCard
                  key={`player-${index}`}
                  card={card}
                  isNew={animatingCard === `player-${index}`}
                />
              ))
            )}
          </div>
          <div
            className={`rounded-lg border px-4 py-1.5 text-sm font-semibold sm:px-6 sm:py-2 sm:text-base ${
              gameState.gameStatus === "gameOver"
                ? gameState.result === "win"
                  ? "border-green-600 bg-green-500 text-white"
                  : gameState.result === "lose"
                    ? "border-red-600 bg-red-500 text-white"
                    : "border-yellow-600 bg-yellow-500 text-black"
                : "bg-card text-foreground border-border"
            }`}
          >
            {gameState.gameStatus === "betting"
              ? "You"
              : gameState.gameStatus === "gameOver"
                ? `${playerValue} ${gameState.result === "win" ? "Win" : gameState.result === "lose" ? "Lose" : "Push"}`
                : `${playerValue} You`}
          </div>
        </div>

        {/* Betting Interface */}
        {gameState.gameStatus === "betting" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {isInitializing ? (
              <div className="flex flex-col items-center gap-2">
                <div className="text-muted-foreground animate-pulse text-base font-semibold sm:text-xl">
                  Checking for active games...
                </div>
              </div>
            ) : (
              <>
                <input
                  type="number"
                  value={betInput}
                  onChange={(e) => {
                    setBetInput(e.target.value);
                    setBetError(""); // Clear error when user types
                  }}
                  className="border-border bg-card text-foreground focus:ring-ring w-48 rounded-lg border px-3 py-2 text-center text-lg font-semibold focus:ring-2 focus:outline-none sm:w-64 sm:px-4 sm:py-3 sm:text-xl"
                  min="1"
                  max={gameState.playerChips}
                  step="1"
                  disabled={isInitializing}
                />
                <div className="flex gap-2 sm:gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustBet(5)}
                    className="sm:text-base"
                    disabled={isInitializing}
                  >
                    +5
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustBet(25)}
                    className="sm:text-base"
                    disabled={isInitializing}
                  >
                    +25
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustBet(100)}
                    className="sm:text-base"
                    disabled={isInitializing}
                  >
                    +100
                  </Button>
                </div>
                <Button
                  className="w-48 py-4 text-base font-semibold sm:w-64 sm:py-6 sm:text-lg"
                  onClick={handlePlaceBet}
                  disabled={isPlacingBet || isInitializing}
                >
                  {isPlacingBet ? "Placing Bet..." : "Place Bet"}
                </Button>
                {betError && (
                  <p className="text-xs text-red-400 sm:text-sm">{betError}</p>
                )}
                {gameState.message && (
                  <p className="text-xs text-red-400 sm:text-sm">
                    {gameState.message}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Playing Interface */}
        {gameState.gameStatus === "playing" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button
                className={`w-32 py-4 text-base font-semibold sm:w-48 sm:py-6 sm:text-lg ${
                  aiAssist?.action === "hit"
                    ? "border-2 border-green-500 bg-green-500 hover:bg-green-600"
                    : ""
                }`}
                onClick={handleHit}
                disabled={isHitting}
              >
                {isHitting ? "Hitting..." : "Hit"}
              </Button>
              <button
                onClick={handleGetAIAssist}
                disabled={isLoadingAI}
                className="text-xl transition-transform hover:scale-110 disabled:opacity-50 sm:text-2xl"
              >
                {isLoadingAI ? "⏳" : "?"}
              </button>
              <Button
                className={`w-32 py-4 text-base font-semibold sm:w-48 sm:py-6 sm:text-lg ${
                  aiAssist?.action === "stand"
                    ? "border-2 border-green-500 bg-green-500 hover:bg-green-600"
                    : ""
                }`}
                onClick={handleStand}
                disabled={isStanding}
              >
                {isStanding ? "Standing..." : "Stand"}
              </Button>
            </div>
            {aiAssist && (
              <div className="bg-card border-border max-w-md rounded-lg border p-3 text-center text-sm sm:max-w-lg sm:p-4 sm:text-base">
                <p className="text-muted-foreground">{aiAssist.reasoning}</p>
              </div>
            )}
          </div>
        )}

        {gameState.gameStatus === "dealer_turn" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            <p className="text-muted-foreground animate-pulse text-base font-semibold sm:text-xl">
              Dealer is drawing...
            </p>
          </div>
        )}

        {/* Game Over Interface */}
        {gameState.gameStatus === "gameOver" && (
          <div className="flex flex-col items-center gap-3 sm:gap-4">
            {gameState.message && (
              <p className="text-base font-semibold sm:text-xl">
                {gameState.message}
              </p>
            )}
            <Button
              className="w-48 py-4 text-base font-semibold sm:w-64 sm:py-6 sm:text-lg"
              onClick={handleNewGame}
            >
              New Game
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
