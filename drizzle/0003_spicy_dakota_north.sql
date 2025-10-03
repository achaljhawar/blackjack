ALTER TABLE "blackjack_user" ADD COLUMN "totalWagered" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blackjack_user" ADD COLUMN "totalWins" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blackjack_user" ADD COLUMN "totalLosses" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blackjack_user" ADD COLUMN "totalPushes" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blackjack_user" ADD COLUMN "totalChipsBought" integer DEFAULT 0 NOT NULL;