import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { redis, userActiveGameKey, gameKey } from "@/server/redis";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Policy: Page reload/refresh abandons any active games
    // We abandon all active games for this user when they load the game page

    // 1. Find any active games
    const activeGames = await db.query.games.findMany({
      where: and(
        eq(games.userId, session.user.id),
        inArray(games.status, ["playing", "dealer_turn"]),
      ),
      orderBy: (games, { desc }) => [desc(games.lastActivityAt)],
    });

    // 2. Forfeit all active games (page reload = bet lost)
    if (activeGames.length > 0) {
      await db
        .update(games)
        .set({
          status: "completed",
          result: "forfeit",
          completedAt: new Date(),
        })
        .where(
          and(
            eq(games.userId, session.user.id),
            inArray(games.status, ["playing", "dealer_turn"]),
          ),
        );

      // Clear games from Redis cache
      for (const game of activeGames) {
        await redis.del(gameKey(game.id));
      }
    }

    // 3. Clear any cached games
    await redis.del(userActiveGameKey(session.user.id));

    // 4. Always return null (no game resumption)
    return NextResponse.json({
      success: true,
      game: null,
      resumed: false,
    });
  } catch (error) {
    console.error("Error fetching active game:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch active game",
      },
      { status: 500 },
    );
  }
}
