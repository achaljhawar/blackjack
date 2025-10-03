import { Redis } from "@upstash/redis";
import { env } from "@/env";

export const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

// Game cache key helpers
export const gameKey = (gameId: string) => `game:${gameId}`;
export const userActiveGameKey = (userId: string) => `user:${userId}:active`;

// TTL for game cache (1 hour)
export const GAME_CACHE_TTL = 60 * 60;
