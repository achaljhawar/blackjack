import type { Card } from "@/models/game";
import type { PlayingCardProps } from "@/models/components";

// Helper function to map card data to SVG filename
function getCardFileName(card: Card): string {
  const suitMap: Record<string, string> = {
    "♠": "SPADE",
    "♥": "HEART",
    "♦": "DIAMOND",
    "♣": "CLUB",
  };

  const rankMap: Record<string, string> = {
    A: "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "10": "10",
    J: "11-JACK",
    Q: "12-QUEEN",
    K: "13-KING",
  };

  const suit = suitMap[card.suit];
  const rank = rankMap[card.rank];

  return `${suit}-${rank}.svg`;
}

export function PlayingCard({ card, faceDown, isNew }: PlayingCardProps) {
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
      <div className={`relative ${animationClass}`}>
        <img
          src="/backdesign.svg"
          alt="Card back"
          className="h-20 w-14 rounded-lg border-2 border-black sm:h-32 sm:w-24"
        />
      </div>
    );
  }

  const cardFileName = getCardFileName(card);

  return (
    <div className={`relative ${animationClass}`}>
      <img
        src={`/Single Cards (One Per FIle)/${cardFileName}`}
        alt={`${card.rank} of ${card.suit}`}
        className="h-20 w-14 rounded-lg border-2 border-black sm:h-32 sm:w-24"
      />
    </div>
  );
}
