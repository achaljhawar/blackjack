"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { BalanceContextType } from "@/models/context";
import type { BalanceResponse } from "@/models/api";

const BalanceContext = createContext<BalanceContextType | undefined>(undefined);

export function BalanceProvider({ children }: { children: ReactNode }) {
  const [balance, setBalance] = useState<number | null>(null);

  const refreshBalance = useCallback(async () => {
    try {
      const response = await fetch("/api/user/balance");
      const data = (await response.json()) as BalanceResponse;

      if (response.ok && data.success !== false) {
        setBalance(data.balance);
      } else {
        console.error("Failed to fetch balance:", data.error);
        toast.error("Could not load balance. Please refresh the page.");
      }
    } catch (error) {
      console.error("Failed to fetch balance:", error);
      toast.error("Network error. Could not load balance.");
    }
  }, []);

  return (
    <BalanceContext.Provider value={{ balance, setBalance, refreshBalance }}>
      {children}
    </BalanceContext.Provider>
  );
}

export function useBalance() {
  const context = useContext(BalanceContext);
  if (context === undefined) {
    throw new Error("useBalance must be used within a BalanceProvider");
  }
  return context;
}
