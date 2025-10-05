import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@/server/auth";
import { calculateHandValue } from "@/lib/hand-value";
import type { AiAssistRequest } from "@/models/api";
import fs from "fs";
import path from "path";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const SYSTEM_PROMPT = fs.readFileSync(
  path.join(process.cwd(), "src/prompts/blackjack-advisor.md"),
  "utf-8",
);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = (await request.json()) as AiAssistRequest;

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
