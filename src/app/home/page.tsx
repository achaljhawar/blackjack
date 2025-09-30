import { redirect } from "next/navigation";
import { auth } from "@/server/auth";

export default async function HomePage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-4xl font-bold">Welcome to Blackjack!</h1>
        <p className="mb-4 text-xl">
          Hello, {session.user?.name ?? session.user?.email}!
        </p>
        <p className="text-muted-foreground">
          You are now authenticated and ready to play.
        </p>
      </div>
    </div>
  );
}
