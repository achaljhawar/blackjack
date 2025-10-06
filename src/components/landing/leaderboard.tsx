import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { desc, sql } from "drizzle-orm";

export async function Leaderboard() {
  // Fetch top 10 players from database
  const topPlayers = await db
    .select({
      name: users.name,
      email: users.email,
      totalWins: users.totalWins,
      totalLosses: users.totalLosses,
      totalPushes: users.totalPushes,
    })
    .from(users)
    .orderBy(desc(sql`${users.currentBalance} - 500 - ${users.totalChipsBought}`))
    .limit(10);

  const leaderboardData = topPlayers.map((player, index) => {
    const getIcon = (rank: number) => {
      if (rank === 1) return Trophy;
      if (rank === 2) return Medal;
      if (rank === 3) return Award;
      return undefined;
    };

    return {
      rank: index + 1,
      name: player.name ?? player.email,
      wins: player.totalWins,
      losses: player.totalLosses,
      pushes: player.totalPushes,
      icon: getIcon(index + 1),
    };
  });

  return (
    <section id="leaderboard" className="py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
            Top players leaderboard
          </h2>
          <p className="text-muted-foreground mb-16 text-lg leading-relaxed text-balance">
            See how you stack up against the best players. Rankings updated in
            real-time.
          </p>
        </div>

        <Card className="border-border mx-auto max-w-4xl">
          <CardHeader>
            <CardTitle className="text-2xl">Global Rankings</CardTitle>
            <CardDescription>
              Top 10 players by total wins
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-16 font-semibold">Rank</TableHead>
                    <TableHead className="font-semibold">Player</TableHead>
                    <TableHead className="text-right font-semibold">
                      Wins
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Losses
                    </TableHead>
                    <TableHead className="text-right font-semibold">
                      Pushes
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaderboardData.map((player) => {
                    const Icon = player.icon;
                    return (
                      <TableRow
                        key={player.rank}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="font-mono font-semibold">
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="text-primary h-4 w-4" />}
                            {player.rank}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {player.name}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {player.wins}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {player.losses}
                        </TableCell>
                        <TableCell className="text-muted-foreground text-right">
                          {player.pushes}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
