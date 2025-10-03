"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { BuyChipsDialogProps } from "@/models/components";

const chipPackages = [
  { amount: 100, label: "100 Chips" },
  { amount: 500, label: "500 Chips" },
  { amount: 1000, label: "1000 Chips" },
  { amount: 5000, label: "5000 Chips" },
];

export function BuyChipsDialog({
  open,
  onOpenChange,
  onPurchase,
  currentBalance,
}: BuyChipsDialogProps) {
  const handlePurchase = (amount: number) => {
    onPurchase(amount);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-border bg-card text-card-foreground max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold">Buy Chips</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="hover:bg-accent h-6 w-6 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-muted-foreground pt-2 text-sm">
            Select the amount of chips you want to purchase.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4 py-6">
          {chipPackages.map((pkg) => (
            <Button
              key={pkg.amount}
              onClick={() => handlePurchase(pkg.amount)}
              className="h-24 text-lg font-semibold transition-all"
              variant="outline"
            >
              {pkg.label}
            </Button>
          ))}
        </div>

        <div className="text-muted-foreground pb-2 text-center text-sm">
          Current Balance:{" "}
          <span className="text-foreground font-semibold">
            {currentBalance} chips
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
