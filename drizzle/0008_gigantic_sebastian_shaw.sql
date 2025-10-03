ALTER TABLE "blackjack_game" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blackjack_game" ALTER COLUMN "lastActivityAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blackjack_transaction" ALTER COLUMN "createdAt" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "blackjack_user" ALTER COLUMN "emailVerified" SET DEFAULT now();