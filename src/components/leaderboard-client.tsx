"use client";

import { useState } from "react";
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
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";

interface LeaderboardEntry {
  rank: number;
  name: string;
  wins: number;
  losses: number;
  pushes: number;
  isCurrentUser: boolean;
}

interface LeaderboardClientProps {
  leaderboardData: LeaderboardEntry[];
}

export default function LeaderboardClient({
  leaderboardData,
}: LeaderboardClientProps) {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const itemsPerPage = 10;

  const totalPages = Math.ceil(leaderboardData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = leaderboardData.slice(startIndex, endIndex);

  const handlePreviousPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    router.refresh();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  const getIconForRank = (rank: number) => {
    switch (rank) {
      case 1:
        return Trophy;
      case 2:
        return Medal;
      case 3:
        return Award;
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
            Leaderboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Top players ranked by total profit
          </p>
        </div>

        <Card className="border-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Global Rankings</CardTitle>
                <CardDescription>
                  Showing {startIndex + 1}-{Math.min(endIndex, leaderboardData.length)} of{" "}
                  {leaderboardData.length} players
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="shrink-0"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              </Button>
            </div>
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
                  {currentData.map((player) => {
                    const Icon = getIconForRank(player.rank);
                    return (
                      <TableRow
                        key={player.rank}
                        className={`transition-colors hover:bg-muted/50 ${
                          player.isCurrentUser ? "bg-primary/10" : ""
                        }`}
                      >
                        <TableCell className="font-mono font-semibold">
                          <div className="flex items-center gap-2">
                            {Icon && <Icon className="h-4 w-4 text-primary" />}
                            {player.rank}
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">
                          {player.name}
                          {player.isCurrentUser && (
                            <span className="ml-2 text-xs text-primary">
                              (You)
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {player.wins}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {player.losses}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {player.pushes}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="mr-2 h-4 w-4" />
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  Next
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}