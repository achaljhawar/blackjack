"use client";

import { useState, useEffect } from "react";
import { AuthenticatedNavbar } from "./authenticated-navbar";
import { BuyChipsDialog } from "./buy-chips-dialog";
import { useBalance } from "@/lib/balance-context";
import type { NavbarClientWrapperProps } from "@/models/components";
import type { BalanceResponse } from "@/models/api";

export function NavbarClientWrapper({ session }: NavbarClientWrapperProps) {
  const { balance, setBalance, refreshBalance } = useBalance();
  const [buyChipsOpen, setBuyChipsOpen] = useState(false);

  useEffect(() => {
    void refreshBalance();
  }, [refreshBalance]);

  const handleBuyChips = async (amount: number) => {
    try {
      const response = await fetch("/api/user/buy-chips", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ amount }),
      });

      if (response.ok) {
        const data = (await response.json()) as BalanceResponse;
        setBalance(data.balance);
      }
    } catch (error) {
      console.error("Failed to buy chips:", error);
    }
  };

  return (
    <>
      <AuthenticatedNavbar
        session={session}
        chips={balance ?? 0}
        onBuyChips={() => setBuyChipsOpen(true)}
      />
      <BuyChipsDialog
        open={buyChipsOpen}
        onOpenChange={setBuyChipsOpen}
        onPurchase={handleBuyChips}
        currentBalance={balance ?? 0}
      />
    </>
  );
}
