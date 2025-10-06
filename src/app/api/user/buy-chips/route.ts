import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { invalidateBalance } from "@/lib/balance-cache";
import type { BuyChipsRequest } from "@/models/api";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as BuyChipsRequest;
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid chip amount" },
        { status: 400 },
      );
    }

    // Update total chips bought and balance in a single DB transaction
    let balanceAfter: number;
    try {
      balanceAfter = await db.transaction(async (tx) => {
        const user = await tx.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: {
            totalChipsBought: true,
            currentBalance: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const newTotalChipsBought = user.totalChipsBought + amount;
        const newBalance = user.currentBalance + amount;

        await tx
          .update(users)
          .set({
            totalChipsBought: newTotalChipsBought,
            currentBalance: newBalance,
          })
          .where(eq(users.id, session.user.id));

        return newBalance;
      });
    } catch (error) {
      // Invalidate cache on error to ensure consistency
      await invalidateBalance(session.user.id);
      throw error;
    }

    return NextResponse.json({
      success: true,
      balance: balanceAfter,
    });
  } catch (error) {
    console.error("Error buying chips:", error);
    return NextResponse.json(
      { error: "Failed to purchase chips" },
      { status: 500 },
    );
  }
}
