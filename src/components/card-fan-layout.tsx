"use client";

import { cn } from "@/lib/utils";

type Card = {
  suit: "♠" | "♥" | "♦" | "♣";
  value: string;
  color: "red" | "black";
};

const cards: Card[] = [
  { suit: "♠", value: "A", color: "black" },
  { suit: "♥", value: "K", color: "red" },
  { suit: "♦", value: "Q", color: "red" },
  { suit: "♣", value: "J", color: "black" },
  { suit: "♠", value: "10", color: "black" },
  { suit: "♥", value: "9", color: "red" },
  { suit: "♦", value: "8", color: "red" },
];

export function CardFan() {
  return (
    <div className="relative flex h-[400px] items-center justify-center">
      <div className="relative h-64 w-full max-w-2xl">
        {cards.map((card, index) => {
          const totalCards = cards.length;
          const middleIndex = (totalCards - 1) / 2;
          const offset = index - middleIndex;

          // Calculate rotation angle for fan effect
          const rotationAngle = offset * 8; // 8 degrees per card

          // Calculate vertical offset for arc effect
          const verticalOffset = Math.abs(offset) * 15;

          // Calculate horizontal spread
          const horizontalOffset = offset * 45;

          return (
            <div
              key={index}
              className="absolute top-1/2 left-1/2"
              style={{
                transform: `
                  translate(-50%, -50%)
                  translateX(${horizontalOffset}px)
                  translateY(${verticalOffset}px)
                  rotate(${rotationAngle}deg)
                `,
                zIndex: 10 + index,
              }}
            >
              <div
                className={cn(
                  "h-36 w-24 rounded-lg border-2 border-gray-200 bg-white shadow-xl",
                  "flex flex-col items-center justify-between p-3",
                  "select-none",
                )}
              >
                <div className="flex flex-col items-center">
                  <span
                    className={cn(
                      "text-3xl font-bold",
                      card.color === "red" ? "text-red-600" : "text-gray-900",
                    )}
                  >
                    {card.value}
                  </span>
                  <span
                    className={cn(
                      "text-4xl",
                      card.color === "red" ? "text-red-600" : "text-gray-900",
                    )}
                  >
                    {card.suit}
                  </span>
                </div>
                <div className="flex rotate-180 flex-col items-center">
                  <span
                    className={cn(
                      "text-3xl font-bold",
                      card.color === "red" ? "text-red-600" : "text-gray-900",
                    )}
                  >
                    {card.value}
                  </span>
                  <span
                    className={cn(
                      "text-4xl",
                      card.color === "red" ? "text-red-600" : "text-gray-900",
                    )}
                  >
                    {card.suit}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
