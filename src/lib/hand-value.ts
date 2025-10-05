import type { Card, HandValue } from "@/models/game";

/**
 * Calculate hand value with soft/hard ace detection
 * This is the canonical implementation used across the app
 */
export function calculateHandValue(hand: Card[]): HandValue {
  let value = 0;
  let aces = 0;

  for (const card of hand) {
    if (card.faceDown) continue;

    if (card.rank === "A") {
      aces += 1;
      value += 11;
    } else if (["J", "Q", "K"].includes(card.rank)) {
      value += 10;
    } else {
      value += Number.parseInt(card.rank);
    }
  }

  let isSoft = aces > 0 && value <= 21;

  // Adjust for aces
  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
    isSoft = false;
  }

  return { value, isSoft };
}

/**
 * Helper to get just the numeric value (for backward compatibility)
 */
export function getHandValue(hand: Card[]): number {
  return calculateHandValue(hand).value;
}
