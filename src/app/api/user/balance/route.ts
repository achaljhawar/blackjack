import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { getBalance } from "@/lib/balance-cache";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const balanceData = await getBalance(session.user.id);

    return NextResponse.json({
      balance: balanceData.balance,
      version: balanceData.version,
      timestamp: balanceData.timestamp,
    });
  } catch (error) {
    console.error("Error fetching user balance:", error);
    return NextResponse.json(
      { error: "Failed to fetch balance" },
      { status: 500 },
    );
  }
}
