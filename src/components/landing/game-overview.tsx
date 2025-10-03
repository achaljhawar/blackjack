import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Target, Users, TrendingUp } from "lucide-react";

export function GameOverview() {
  const features = [
    {
      icon: Trophy,
      title: "Competitive Play",
      description:
        "Compete against players worldwide and climb the global leaderboard.",
    },
    {
      icon: Target,
      title: "Perfect Strategy",
      description:
        "Learn optimal blackjack strategy and improve your win rate.",
    },
    {
      icon: Users,
      title: "Active Community",
      description:
        "Join thousands of players in the ultimate blackjack experience.",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your profits, wins, and statistics over time.",
    },
  ];

  return (
    <section id="overview" className="border-border border-b py-24 md:py-32">
      <div className="container mx-auto px-4">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-balance md:text-4xl lg:text-5xl">
            Why play Blackjack with us?
          </h2>
          <p className="text-muted-foreground mb-16 text-lg leading-relaxed text-balance">
            Experience the classic casino game with modern features designed for
            competitive players.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-border hover:border-foreground/20 transition-colors"
            >
              <CardContent className="p-6">
                <div className="bg-primary mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg">
                  <feature.icon className="text-primary-foreground h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
