"use client";

import { Button } from "@/components/ui/button";
import { Spade } from "lucide-react";
import { useState } from "react";
import { LoginDialog } from "./login-dialog";

export function Hero() {
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);

  return (
    <section className="border-border relative overflow-hidden border-b">
      <div className="container mx-auto px-4 py-24 md:py-32 lg:py-40">
        <div className="mx-auto max-w-4xl text-center">
          <div className="border-border bg-muted mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-2">
            <Spade className="h-4 w-4" />
            <span className="text-sm font-medium">
              Classic Casino Experience
            </span>
          </div>

          <h1 className="mb-6 text-5xl leading-tight font-bold tracking-tighter text-balance md:text-6xl lg:text-7xl">
            Master the art of Blackjack
          </h1>

          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg leading-relaxed text-balance md:text-xl">
            Experience the thrill of the classic card game. Beat the dealer,
            climb the leaderboard, and prove your skills in the ultimate game of
            21.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              size="lg"
              className="w-full text-base sm:w-auto"
              onClick={() => setLoginDialogOpen(true)}
            >
              Start Playing Now
            </Button>
          </div>
        </div>
      </div>

      <LoginDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen} />
    </section>
  );
}
