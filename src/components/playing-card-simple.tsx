import type { Card } from "@/models/game";
import type { PlayingCardProps } from "@/models/components";

/**
 * Simple text-based playing card component for real-time gameplay
 * Uses rank and suit symbols for instant rendering (no image loading)
 */
export function PlayingCardSimple({ card, faceDown, isNew }: PlayingCardProps) {
  const animationClass = isNew ? "card-flip-animation" : "";

  if (!card) {
    // Empty card placeholder
    return (
      <div className="h-20 w-14 rounded-lg border-2 border-white/20 bg-black/40 sm:h-32 sm:w-24" />
    );
  }

  if (faceDown || card.faceDown) {
    // Face-down card
    return (
      <div
        className={`h-20 w-14 rounded-lg border-2 border-white/40 bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center sm:h-32 sm:w-24 ${animationClass}`}
      >
        <div className="h-16 w-10 rounded border-2 border-white/20 sm:h-24 sm:w-16" />
      </div>
    );
  }

  const isRed = card.suit === "♥" || card.suit === "♦";

  return (
    <div
      className={`h-20 w-14 rounded-lg border-2 border-white/40 bg-white flex flex-col items-center justify-center gap-1 p-1 sm:h-32 sm:w-24 sm:gap-2 sm:p-2 ${animationClass}`}
    >
      <span className={`text-xl font-bold sm:text-3xl ${isRed ? "text-red-500" : "text-black"}`}>
        {card.rank}
      </span>
      <span className={`text-2xl sm:text-4xl ${isRed ? "text-red-500" : "text-black"}`}>
        {card.suit}
      </span>
    </div>
  );
}
