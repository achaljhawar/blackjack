import type { Suit, Rank, Card, GameState, GameResult } from "@/models/game";
import { calculateHandValue, getHandValue } from "./hand-value";

const SUITS: Suit[] = ["♠", "♥", "♦", "♣"];
const RANKS: Rank[] = [
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];

// Infinite deck: Draw a random card on-demand
export function drawCard(faceDown = false): Card {
  const randomSuit = SUITS[Math.floor(Math.random() * SUITS.length)]!;
  const randomRank = RANKS[Math.floor(Math.random() * RANKS.length)]!;

  return {
    rank: randomRank,
    suit: randomSuit,
    faceDown,
  };
}

// Re-export hand value functions
export { calculateHandValue, getHandValue };

// Initialize a new game with initial deal
export function initializeGame(
  gameId: string,
  userId: string,
  betAmount: number,
): GameState {
  // Deal initial cards from infinite deck
  const playerCard1 = drawCard();
  const dealerCard1 = drawCard();
  const playerCard2 = drawCard();
  const dealerCard2 = drawCard(true); // Dealer's second card face down

  const playerHand = [playerCard1, playerCard2];
  const dealerHand = [dealerCard1, dealerCard2];

  const playerValue = getHandValue(playerHand);
  const isBlackjack = playerValue === 21 && playerHand.length === 2;

  const gameState: GameState = {
    id: gameId,
    userId,
    playerHand,
    dealerHand,
    deck: [], // Empty deck for infinite deck mode
    betAmount,
    status: isBlackjack ? "dealer_turn" : "playing",
    createdAt: new Date(),
  };

  // If player has blackjack, reveal dealer's card and check for dealer blackjack
  if (isBlackjack) {
    const revealedDealerHand = dealerHand.map((card) => ({
      ...card,
      faceDown: false,
    }));
    const dealerValue = getHandValue(revealedDealerHand);
    const dealerBlackjack =
      dealerValue === 21 && revealedDealerHand.length === 2;

    gameState.dealerHand = revealedDealerHand;
    gameState.status = "completed";
    gameState.playerScore = playerValue;
    gameState.dealerScore = dealerValue;
    gameState.completedAt = new Date();

    if (dealerBlackjack) {
      gameState.result = "push";
    } else {
      gameState.result = "win";
    }
  }

  return gameState;
}

// Player hits
export function hit(gameState: GameState): GameState {
  if (gameState.status !== "playing") {
    throw new Error("Cannot hit in current game state");
  }

  const newCard = drawCard();
  const playerHand = [...gameState.playerHand, newCard];
  const playerValue = getHandValue(playerHand);

  if (playerValue > 21) {
    // Player busts
    const dealerHand = gameState.dealerHand.map((card) => ({
      ...card,
      faceDown: false,
    }));
    const dealerValue = getHandValue(dealerHand);

    return {
      ...gameState,
      playerHand,
      dealerHand,
      status: "completed",
      result: "lose",
      playerScore: playerValue,
      dealerScore: dealerValue,
      completedAt: new Date(),
    };
  }

  return {
    ...gameState,
    playerHand,
  };
}

// Player stands - reveal dealer's card and play dealer's hand
export function stand(gameState: GameState): GameState {
  if (gameState.status !== "playing") {
    throw new Error("Cannot stand in current game state");
  }

  // Reveal dealer's face-down card
  const dealerHand = gameState.dealerHand.map((card) => ({
    ...card,
    faceDown: false,
  }));

  return {
    ...gameState,
    dealerHand,
    status: "dealer_turn",
  };
}

// Dealer plays automatically (hits on 16 or less and soft 17, stands on hard 17+)
export function playDealerTurn(gameState: GameState): GameState {
  if (gameState.status !== "dealer_turn") {
    throw new Error("Not dealer's turn");
  }

  let dealerHand = gameState.dealerHand;
  let dealerHandValue = calculateHandValue(dealerHand);

  // Dealer hits on 16 or less, and hits on soft 17
  while (dealerHandValue.value < 17 || (dealerHandValue.value === 17 && dealerHandValue.isSoft)) {
    const newCard = drawCard();
    dealerHand = [...dealerHand, newCard];
    dealerHandValue = calculateHandValue(dealerHand);
  }

  const playerValue = getHandValue(gameState.playerHand);
  const dealerValue = dealerHandValue.value;

  // Determine winner
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

  return {
    ...gameState,
    dealerHand,
    status: "completed",
    result,
    playerScore: playerValue,
    dealerScore: dealerValue,
    completedAt: new Date(),
  };
}
