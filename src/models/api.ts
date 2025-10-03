import type { GameState } from "./game";

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
