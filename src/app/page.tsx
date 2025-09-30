import { redirect } from "next/navigation";
import { Header } from "@/components/header";
import { Hero } from "@/components/hero";
import { GameOverview } from "@/components/game-overview";
import { HowToPlay } from "@/components/how-to-play";
import { Leaderboard } from "@/components/leaderboard";
import { Footer } from "@/components/footer";
import { auth } from "@/server/auth";

export default async function Home() {
  const session = await auth();

  if (session) {
    redirect("/home");
  }

  return (
    <div className="min-h-screen">
      <Header />
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
