import type { GameState, Card, ClientGameState } from "./game";

// API Response types
export interface ApiResponse {
  success?: boolean;
  error?: string;
}

export interface DealResponse extends ApiResponse {
  game?: GameState;
  balanceAfter?: number;
}

export interface HitResponse extends ApiResponse {
  game?: GameState;
}

export interface StandResponse extends ApiResponse {
  game?: GameState;
  needsDealerTurn?: boolean;
}

export interface DealerCardResponse extends ApiResponse {
  game?: GameState;
  needsMoreCards?: boolean;
  gameComplete?: boolean;
  newBalance?: number;
}

export interface BalanceResponse {
  balance: number;
}

export interface ActiveGameResponse extends ApiResponse {
  game?: ClientGameState;
}

export interface AiAssistResponse extends ApiResponse {
  recommendation?: {
    action: "hit" | "stand";
    reasoning: string;
  };
}

// API Request types
export interface GameIdRequest {
  gameId: string;
}

export interface BetAmountRequest {
  betAmount: number;
}

export interface BuyChipsRequest {
  amount: number;
}

export interface AiAssistRequest {
  playerHand: Card[];
  dealerUpCard: Card;
}
