import { NextResponse } from "next/server";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import { users } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { adjustBalance, invalidateBalance } from "@/lib/balance-cache";

export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { amount: number };
    const { amount } = body as { amount: number };

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Invalid chip amount" },
        { status: 400 },
      );
    }

    // Update total chips bought in DB transaction
    try {
      await db.transaction(async (tx) => {
        const user = await tx.query.users.findFirst({
          where: eq(users.id, session.user.id),
          columns: {
            totalChipsBought: true,
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        const newTotalChipsBought = user.totalChipsBought + amount;

        await tx
          .update(users)
          .set({
            totalChipsBought: newTotalChipsBought,
          })
          .where(eq(users.id, session.user.id));
      });
    } catch (error) {
      // Invalidate cache on error to ensure consistency
      await invalidateBalance(session.user.id);
      throw error;
    }

    // Add chips to balance with cache integration (after successful transaction)
    const balanceResult = await adjustBalance(session.user.id, amount);

    return NextResponse.json({
      success: true,
      balance: balanceResult.balance,
    });
  } catch (error) {
    console.error("Error buying chips:", error);
    return NextResponse.json(
      { error: "Failed to purchase chips" },
      { status: 500 },
    );
  }
}
