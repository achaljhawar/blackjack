import type { Suit, Rank, Card, GameState } from "@/models/game";

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

// Calculate hand value
export function calculateHandValue(hand: Card[]): number {
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

  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
  }

  return value;
}

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

  const playerValue = calculateHandValue(playerHand);
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
    const dealerValue = calculateHandValue(revealedDealerHand);
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
  const playerValue = calculateHandValue(playerHand);

  if (playerValue > 21) {
    // Player busts
    const dealerHand = gameState.dealerHand.map((card) => ({
      ...card,
      faceDown: false,
    }));
    const dealerValue = calculateHandValue(dealerHand);

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

// Dealer plays automatically (hits on 16 or less, stands on 17+)
export function playDealerTurn(gameState: GameState): GameState {
  if (gameState.status !== "dealer_turn") {
    throw new Error("Not dealer's turn");
  }

  let dealerHand = gameState.dealerHand;
  let dealerValue = calculateHandValue(dealerHand);

  // Dealer hits on 16 or less
  while (dealerValue < 17) {
    const newCard = drawCard();
    dealerHand = [...dealerHand, newCard];
    dealerValue = calculateHandValue(dealerHand);
  }

  const playerValue = calculateHandValue(gameState.playerHand);

  // Determine winner
  let result: "win" | "lose" | "push";

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
