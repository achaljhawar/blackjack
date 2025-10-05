"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PlayingCard } from "@/components/playing-card";
import type { Card, GameHistoryEntry } from "@/models/game";
import type { HistoryClientProps } from "@/models/components";

const ITEMS_PER_PAGE = 5;

// Card Fan Layout Component
function CardFanLayout({ cards }: { cards: Card[] }) {
  if (!cards || cards.length === 0) {
    return <div className="text-muted-foreground text-sm">No cards</div>;
  }

  return (
    <div className="relative h-full w-full">
      {cards.map((card, index) => {
        const totalCards = cards.length;
        const middleIndex = (totalCards - 1) / 2;
        const offset = index - middleIndex;

        // Calculate rotation angle for fan effect (smaller angle for subtle fan)
        const rotationAngle = offset * 6; // 6 degrees per card

        // Calculate vertical offset for arc effect
        const verticalOffset = Math.abs(offset) * 8;

        // Calculate horizontal spread
        const horizontalOffset = offset * 30;

        return (
          <div
            key={index}
            className="absolute top-1/2 left-1/2"
            style={{
              transform: `
                translate(-50%, -50%)
                translateX(${horizontalOffset}px)
                translateY(${verticalOffset}px)
                rotate(${rotationAngle}deg)
              `,
              zIndex: 10 + index,
            }}
          >
            <PlayingCard card={card} />
          </div>
        );
      })}
    </div>
  );
}

export default function HistoryClient({ initialHistory }: HistoryClientProps) {
  const [history] = useState<GameHistoryEntry[]>(initialHistory);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(history.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentItems = history.slice(startIndex, endIndex);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "numeric",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getResultDisplay = (entry: GameHistoryEntry) => {
    if (entry.result === "win") {
      return { text: `Win (+${entry.winnings})`, color: "text-green-500" };
    } else if (entry.result === "lose") {
      return { text: "Lose", color: "text-red-500" };
    } else if (entry.result === "forfeit") {
      return {
        text: "Abandoned (Page Reload)",
        color: "text-orange-500",
        subtitle: "Game was abandoned - bet lost",
      };
    } else {
      return { text: "Push", color: "text-yellow-500" };
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage, "...", totalPages);
      }
    }

    return pages;
  };

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-8 py-12">
        <h2 className="mb-8 text-4xl font-bold">Game History</h2>

        {history.length === 0 ? (
          <div className="text-muted-foreground py-12 text-center">
            <p className="text-xl">No games played yet</p>
          </div>
        ) : (
          <>
            {/* History Table */}
            <div className="mb-8 space-y-6">
              {currentItems.map((entry) => {
                const resultDisplay = getResultDisplay(entry);
                return (
                  <div
                    key={entry.id}
                    className="border-border bg-card rounded-lg border p-6"
                  >
                    {/* Top Section: Date, Bet, Result */}
                    <div className="mb-6 grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-muted-foreground mb-1 text-sm">
                          Date
                        </div>
                        <div className="font-medium">
                          {formatDate(entry.date)}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-sm">
                          Bet
                        </div>
                        <div className="font-medium">{entry.bet} chips</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground mb-1 text-sm">
                          Result
                        </div>
                        <div className={`font-bold ${resultDisplay.color}`}>
                          {resultDisplay.text}
                        </div>
                        {resultDisplay.subtitle && (
                          <div className="text-muted-foreground mt-1 text-xs italic">
                            {resultDisplay.subtitle}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Cards Section */}
                    <div className="space-y-4">
                      {/* Dealer's Hand */}
                      <div>
                        <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                          <span>Dealer&apos;s Hand</span>
                          <span className="font-semibold">
                            Score: {entry.dealerScore}
                          </span>
                        </div>
                        <div className="relative flex h-32 items-center justify-center overflow-visible">
                          <CardFanLayout cards={entry.dealerHand} />
                        </div>
                      </div>

                      {/* Player's Hand */}
                      <div>
                        <div className="text-muted-foreground mb-2 flex items-center justify-between text-sm">
                          <span>Your Hand</span>
                          <span className="font-semibold">
                            Score: {entry.playerScore}
                          </span>
                        </div>
                        <div className="relative flex h-32 items-center justify-center overflow-visible">
                          <CardFanLayout cards={entry.playerHand} />
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="hover:bg-accent disabled:opacity-30"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>

                  {renderPageNumbers().map((page, index) =>
                    page === "..." ? (
                      <span
                        key={`ellipsis-${index}`}
                        className="text-muted-foreground px-3"
                      >
                        ...
                      </span>
                    ) : (
                      <Button
                        key={page}
                        variant="ghost"
                        onClick={() => goToPage(page as number)}
                        className={`h-10 w-10 ${
                          currentPage === page
                            ? "bg-primary text-primary-foreground hover:bg-primary/90"
                            : "hover:bg-accent"
                        }`}
                      >
                        {page}
                      </Button>
                    ),
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="hover:bg-accent disabled:opacity-30"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>

                <p className="text-muted-foreground text-sm">
                  Showing {startIndex + 1}-{Math.min(endIndex, history.length)}{" "}
                  of {history.length} games
                </p>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
