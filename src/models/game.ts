export type Suit = "♠" | "♥" | "♦" | "♣";
export type Rank =
  | "A"
  | "2"
  | "3"
  | "4"
  | "5"
  | "6"
  | "7"
  | "8"
  | "9"
  | "10"
  | "J"
  | "Q"
  | "K";

export interface Card {
  rank: Rank;
  suit: Suit;
  faceDown?: boolean;
}

export interface GameState {
  id: string;
  userId: string;
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  betAmount: number;
  status: "playing" | "dealer_turn" | "completed" | "abandoned";
  result?: "win" | "lose" | "push" | "blackjack" | "forfeit";
  playerScore?: number;
  dealerScore?: number;
  createdAt: Date;
  completedAt?: Date;
  lastActivityAt?: Date;
  lastAction?: string;
}

export interface GameHistoryEntry {
  id: string;
  date: Date;
  bet: number;
  playerScore: number;
  dealerScore: number;
  playerHand: Card[];
  dealerHand: Card[];
  result: "win" | "lose" | "push" | "blackjack" | "forfeit";
  winnings: number;
}

export interface ClientGameState {
  id?: string;
  playerHand: Card[];
  dealerHand: Card[];
  playerChips: number;
  currentBet: number;
  gameStatus: "betting" | "playing" | "dealer_turn" | "gameOver";
  result?: "win" | "lose" | "push" | "blackjack" | "forfeit";
  message?: string;
  playerScore?: number;
  dealerScore?: number;
}
