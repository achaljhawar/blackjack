import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import HistoryClient from "@/components/history-client";
import { db } from "@/server/db";
import { games } from "@/server/db/schema";
import { eq, desc } from "drizzle-orm";
import type { Card, GameHistoryEntry } from "@/models/game";

export const revalidate = 0; // Disable caching for this page

export default async function HistoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Fetch game history from database
  const completedGames = await db
    .select()
    .from(games)
    .where(eq(games.userId, session.user.id))
    .orderBy(desc(games.completedAt));

  const history: GameHistoryEntry[] = completedGames
    .filter((game) => game.completedAt && game.result)
    .map((game) => {
      const winnings =
        game.result === "win"
          ? game.betAmount
          : game.result === "blackjack"
            ? Math.floor(game.betAmount * 1.5)
            : game.result === "lose" || game.result === "forfeit"
              ? -game.betAmount
              : 0;

      return {
        id: game.id,
        date: game.completedAt!,
        bet: game.betAmount,
        playerScore: game.playerScore ?? 0,
        dealerScore: game.dealerScore ?? 0,
        playerHand: game.playerHand as Card[],
        dealerHand: game.dealerHand as Card[],
        result: game.result as
          | "win"
          | "lose"
          | "push"
          | "blackjack"
          | "forfeit",
        winnings,
      };
    });

  return <HistoryClient initialHistory={history} />;
}
