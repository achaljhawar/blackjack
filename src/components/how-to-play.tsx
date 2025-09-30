import { Card, CardContent } from "@/components/ui/card";

export function HowToPlay() {
  const rules = [
    {
      number: "01",
      title: "The Goal",
      description:
        "Beat the dealer by getting a hand value as close to 21 as possible without going over.",
    },
    {
      number: "02",
      title: "Card Values",
      description:
        "Number cards are worth their face value, face cards are worth 10, and Aces are worth 1 or 11.",
    },
    {
      number: "03",
      title: "Hit or Stand",
      description:
        'Choose to "hit" to receive another card or "stand" to keep your current hand.',
    },
    {
      number: "04",
      title: "Winning",
      description:
        "Win by having a higher hand than the dealer without exceeding 21. Blackjack (21 with two cards) pays 3:2.",
    },
  ];

  return (
    <section id="how-to-play" className="border-border border-b py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
            How to play Blackjack
          </h2>
          <p className="text-muted-foreground mb-16 text-lg leading-relaxed text-balance">
            Master the fundamentals of the game in minutes. Simple rules,
            endless strategy.
          </p>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2">
          {rules.map((rule, index) => (
            <Card key={index} className="border-border">
              <CardContent className="p-8">
                <div className="text-muted-foreground/30 mb-4 font-mono text-4xl font-bold">
                  {rule.number}
                </div>
                <h3 className="mb-3 text-xl font-semibold">{rule.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {rule.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
