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

// Create a shuffled deck using Fisher-Yates algorithm with seed
export function createShuffledDeck(seed: number): Card[] {
  const deck: Card[] = [];

  // Create 6 decks (typical casino blackjack)
  for (let i = 0; i < 6; i++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ rank, suit });
      }
    }
  }

  // Seeded random shuffle (Fisher-Yates)
  let random = seed;
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [deck[i], deck[j]] = [deck[j]!, deck[i]!];
  }

  return deck;
}

// Draw a card from the deck
export function drawCard(
  deck: Card[],
  faceDown = false,
): { card: Card; remainingDeck: Card[] } {
  if (deck.length === 0) {
    throw new Error("Deck is empty");
  }
  const [card, ...remainingDeck] = deck;
  return { card: { ...card!, faceDown }, remainingDeck };
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
  // Use timestamp as seed for reproducibility
  const seed = Date.now();
  let deck = createShuffledDeck(seed);

  // Deal initial cards
  const { card: playerCard1, remainingDeck: deck1 } = drawCard(deck);
  const { card: dealerCard1, remainingDeck: deck2 } = drawCard(deck1);
  const { card: playerCard2, remainingDeck: deck3 } = drawCard(deck2);
  const { card: dealerCard2, remainingDeck: deck4 } = drawCard(deck3, true); // Dealer's second card face down

  deck = deck4;

  const playerHand = [playerCard1, playerCard2];
  const dealerHand = [dealerCard1, dealerCard2];

  const playerValue = calculateHandValue(playerHand);
  const isBlackjack = playerValue === 21 && playerHand.length === 2;

  const gameState: GameState = {
    id: gameId,
    userId,
    playerHand,
    dealerHand,
    deck,
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
      gameState.result = "blackjack";
    }
  }

  return gameState;
}

// Player hits
export function hit(gameState: GameState): GameState {
  if (gameState.status !== "playing") {
    throw new Error("Cannot hit in current game state");
  }

  const { card: newCard, remainingDeck } = drawCard(gameState.deck);
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
      deck: remainingDeck,
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
    deck: remainingDeck,
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

  let { dealerHand, deck } = gameState;
  let dealerValue = calculateHandValue(dealerHand);

  // Dealer hits on 16 or less
  while (dealerValue < 17) {
    const { card: newCard, remainingDeck } = drawCard(deck);
    dealerHand = [...dealerHand, newCard];
    deck = remainingDeck;
    dealerValue = calculateHandValue(dealerHand);
  }

  const playerValue = calculateHandValue(gameState.playerHand);

  // Determine winner
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

  return {
    ...gameState,
    dealerHand,
    deck,
    status: "completed",
    result,
    playerScore: playerValue,
    dealerScore: dealerValue,
    completedAt: new Date(),
  };
}
