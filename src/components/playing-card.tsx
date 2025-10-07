import type { Card } from "@/models/game";
import type { PlayingCardProps } from "@/models/components";

// import Image from "next/image";

// // Helper function to map card data to WebP filename
// function getCardFileName(card: Card): string {
//   const suitMap: Record<string, string> = {
//     "♠": "SPADE",
//     "♥": "HEART",
//     "♦": "DIAMOND",
//     "♣": "CLUB",
//   };

//   const rankMap: Record<string, string> = {
//     A: "1",
//     "2": "2",
//     "3": "3",
//     "4": "4",
//     "5": "5",
//     "6": "6",
//     "7": "7",
//     "8": "8",
//     "9": "9",
//     "10": "10",
//     J: "11-JACK",
//     Q: "12-QUEEN",
//     K: "13-KING",
//   };

//   const suit = suitMap[card.suit];
//   const rank = rankMap[card.rank];

//   return `${suit}-${rank}.webp`;
// }

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

  // Image-based version (commented out)
  // if (faceDown || card.faceDown) {
  //   return (
  //     <div className={`relative ${animationClass}`}>
  //       <Image
  //         src="/cards-webp/backdesign.webp"
  //         alt="Card back"
  //         width={96}
  //         height={128}
  //         className="h-20 w-14 rounded-lg border-2 border-black sm:h-32 sm:w-24"
  //         priority
  //       />
  //     </div>
  //   );
  // }

  // const cardFileName = getCardFileName(card);

  // return (
  //   <div className={`relative ${animationClass}`}>
  //     <Image
  //       src={`/cards-webp/${cardFileName}`}
  //       alt={`${card.rank} of ${card.suit}`}
  //       width={96}
  //       height={128}
  //       className="h-20 w-14 rounded-lg border-2 border-black sm:h-32 sm:w-24"
  //       priority
  //     />
  //   </div>
  // );
}
