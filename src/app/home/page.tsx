import { redirect } from "next/navigation";
import { auth } from "@/server/auth";
import BlackjackClient from "@/components/blackjack-client";

export default async function BlackjackPage() {
  const session = await auth();

  if (!session) {
    redirect("/");
  }

  return <BlackjackClient />;
}
