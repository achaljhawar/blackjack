import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { desc, sql } from "drizzle-orm";
import LeaderboardClient from "@/components/leaderboard-client";

export const revalidate = 0; // Disable caching for this page

export default async function LeaderboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  // Fetch top players by total wins
  const topPlayers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      currentBalance: users.currentBalance,
      totalWagered: users.totalWagered,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalPushes: users.totalPushes,
      profit: sql<number>`${users.currentBalance} - 500 - ${users.totalChipsBought}`,
    })
    .from(users)
    .orderBy(desc(users.totalWins))
    .limit(100); // Fetch top 100 players

  const leaderboardData = topPlayers.map((player, index) => ({
    rank: index + 1,
    name: player.name ?? player.email,
    wins: player.totalWins,
    losses: player.totalLosses,
    pushes: player.totalPushes,
    isCurrentUser: player.id === session.user.id,
  }));

  return <LeaderboardClient leaderboardData={leaderboardData} />;
}