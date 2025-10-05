import type { Card, GameState, GameStatus, GameResult } from "@/models/game";

// Database game record type (inferred from Drizzle schema)
export interface DbGame {
  id: string;
  userId: string;
  betAmount: number;
  playerHand: unknown; // JSONB from DB
  dealerHand: unknown; // JSONB from DB
  status: string;
  result: string | null;
  playerScore: number | null;
  dealerScore: number | null;
  createdAt: Date;
  completedAt: Date | null;
  lastActivityAt?: Date | null;
  lastAction?: string | null;
}

/**
 * Converts a database game record to a GameState object
 * Handles type assertions and null coalescing in one place
 */
export function dbGameToGameState(dbGame: DbGame): GameState {
  return {
    id: dbGame.id,
    userId: dbGame.userId,
    betAmount: dbGame.betAmount,
    playerHand: dbGame.playerHand as Card[],
    dealerHand: dbGame.dealerHand as Card[],
    deck: [],
    status: dbGame.status as GameStatus,
    result: dbGame.result as GameResult | undefined,
    playerScore: dbGame.playerScore ?? undefined,
    dealerScore: dbGame.dealerScore ?? undefined,
    createdAt: dbGame.createdAt,
    completedAt: dbGame.completedAt ?? undefined,
    lastActivityAt: dbGame.lastActivityAt ?? undefined,
    lastAction: dbGame.lastAction ?? undefined,
  };
}
