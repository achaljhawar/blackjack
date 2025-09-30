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

export function Leaderboard() {
  const leaderboardData = [
    {
      rank: 1,
      name: "Alexandra Chen",
      profit: "+$12,450",
      wins: 342,
      icon: Trophy,
    },
    {
      rank: 2,
      name: "Marcus Rodriguez",
      profit: "+$9,820",
      wins: 298,
      icon: Medal,
    },
    {
      rank: 3,
      name: "Sarah Johnson",
      profit: "+$8,340",
      wins: 276,
      icon: Award,
    },
    { rank: 4, name: "David Kim", profit: "+$7,125", wins: 251 },
    { rank: 5, name: "Emma Williams", profit: "+$6,890", wins: 243 },
    { rank: 6, name: "James Anderson", profit: "+$5,670", wins: 229 },
    { rank: 7, name: "Olivia Martinez", profit: "+$4,920", wins: 215 },
    { rank: 8, name: "Michael Brown", profit: "+$4,350", wins: 198 },
    { rank: 9, name: "Sophia Taylor", profit: "+$3,780", wins: 187 },
    { rank: 10, name: "Daniel Wilson", profit: "+$3,240", wins: 172 },
  ];

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
              Top 10 players by total profit this month
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
                      Profit
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
                        <TableCell className="text-primary text-right font-mono font-semibold">
                          {player.profit}
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
