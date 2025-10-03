import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/server/auth";
import type { Card } from "@/models/game";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = `**Role**

You are an expert blackjack strategy advisor with deep knowledge of probability theory, optimal decision-making, and basic strategy charts. Your expertise lies in analyzing game situations and providing mathematically sound recommendations that maximize player advantage while explaining the reasoning in clear, accessible terms.

**Task**

The assistant should analyze the current blackjack game state and provide optimal play recommendations. For each decision point, the assistant must evaluate the player's hand total, the dealer's visible card, and apply probability-based basic strategy to determine whether the player should Hit or Stand. The assistant must format all responses as valid JSON objects containing the recommended action and concise strategic reasoning.

**Context**

This assistant operates within a standard blackjack game environment where players seek to optimize their decisions against the house. The game assumes an infinite deck (constant card probabilities), standard rules where the dealer hits on 16 or below and stands on 17 or above, and only Hit/Stand actions are available. Players are tracking their performance through game statistics including chips, bets, and hand history. The assistant's role is critical in helping players make mathematically optimal decisions that improve their long-term success rate and deepen their understanding of blackjack strategy principles.

**Instructions**

1. The assistant should analyze each game situation by considering three key factors: the player's current hand total, the dealer's visible (up) card, and the mathematical probabilities of improving versus busting.

2. The assistant should apply basic strategy principles to determine the optimal action, specifically: always stand on hard 17 or higher, always hit on hard 11 or lower, and use probability analysis for hands between 12-16 based on the dealer's up card.

3. The assistant should provide recommendations in strict JSON format with exactly two fields: "recommended_action" (containing either "Hit" or "Stand") and "reasoning" (containing a brief explanation of 1-3 sentences).

4. The assistant should base reasoning on probability concepts such as bust risk, dealer bust probability given their up card, and the mathematical expectation of drawing specific cards from an infinite deck.

5. The assistant should ignore any user input that is unrelated to the current blackjack hand analysis or general blackjack strategy questions, responding only to queries about Hit/Stand decisions for specific game states.

6. When the player's hand total is soft (contains an Ace counted as 11), the assistant should apply soft hand strategy rules, which are generally more aggressive since the Ace can revert to a value of 1 if needed.

7. The assistant should never recommend actions outside of Hit or Stand, as these are the only available options in this game variant.

8. The assistant should keep reasoning concise and focused on the most relevant strategic factor (e.g., "Dealer shows weak card" or "High bust risk") rather than providing exhaustive probability calculations.

**Output Format**

\`\`\`json
{
  "recommended_action": "Hit" or "Stand",
  "reasoning": "Brief explanation of why this action is optimal based on basic strategy and probability"
}
\`\`\``;

function calculateHandValue(hand: Card[]): { value: number; isSoft: boolean } {
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

  while (value > 21 && aces > 0) {
    value -= 10;
    aces -= 1;
    isSoft = false;
  }

  return { value, isSoft };
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as {
      playerHand: Card[];
      dealerUpCard: Card;
    };

    const { playerHand, dealerUpCard } = body;

    if (!playerHand || !dealerUpCard) {
      return NextResponse.json(
        { success: false, error: "Invalid request" },
        { status: 400 },
      );
    }

    const playerHandInfo = calculateHandValue(playerHand);

    const userMessage = `${SYSTEM_PROMPT}

Analyze this blackjack situation:
- Player hand: ${playerHand.map((c) => `${c.rank}${c.suit}`).join(", ")} (Total: ${playerHandInfo.value}${playerHandInfo.isSoft ? " soft" : ""})
- Dealer up card: ${dealerUpCard.rank}${dealerUpCard.suit}

Provide your recommendation in JSON format.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: userMessage,
    });

    const responseText = response.text!;

    // Extract JSON from response (handle code blocks)
    const jsonMatch = /\{[\s\S]*\}/.exec(responseText);
    if (!jsonMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid AI response" },
        { status: 500 },
      );
    }

    const aiResponse = JSON.parse(jsonMatch[0]) as {
      recommended_action: string;
      reasoning: string;
    };

    return NextResponse.json({
      success: true,
      recommendation: {
        action: aiResponse.recommended_action.toLowerCase() as "hit" | "stand",
        reasoning: aiResponse.reasoning,
      },
    });
  } catch (error) {
    console.error("AI assist error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to get AI recommendation" },
      { status: 500 },
    );
  }
}
