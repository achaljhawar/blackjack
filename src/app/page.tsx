import { redirect } from "next/navigation";
import { Hero } from "@/components/landing/hero";
import { GameOverview } from "@/components/landing/game-overview";
import { HowToPlay } from "@/components/landing/how-to-play";
import { Leaderboard } from "@/components/landing/leaderboard";
import { Footer } from "@/components/landing/footer";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen">
      <main>
        <Hero />
        <GameOverview />
        <HowToPlay />
        <Leaderboard />
      </main>
      <Footer />
    </div>
  );
}
