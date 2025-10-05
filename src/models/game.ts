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

// Centralized union types
export type GameStatus = "playing" | "dealer_turn" | "completed" | "abandoned";
export type GameResult = "win" | "lose" | "push" | "forfeit";
export type TransactionType = "bet" | "bet_won" | "bet_lost" | "bet_push";
export type GameAction = "bet_placed" | "hit" | "stand" | "dealer_card";

// Hand value calculation result
export interface HandValue {
  value: number;
  isSoft: boolean;
}

export interface GameState {
  id: string;
  userId: string;
  playerHand: Card[];
  dealerHand: Card[];
  deck: Card[];
  betAmount: number;
  status: GameStatus;
  result?: GameResult;
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
  result: GameResult;
  winnings: number;
}

export interface ClientGameState {
  id?: string;
  playerHand: Card[];
  dealerHand: Card[];
  playerChips: number;
  currentBet: number;
  gameStatus: "betting" | "playing" | "dealer_turn" | "gameOver";
  result?: GameResult;
  message?: string;
  playerScore?: number;
  dealerScore?: number;
}
