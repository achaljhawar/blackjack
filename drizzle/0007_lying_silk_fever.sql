DROP INDEX "game_expires_at_idx";--> statement-breakpoint
ALTER TABLE "blackjack_game" DROP COLUMN "expiresAt";--> statement-breakpoint
ALTER TABLE "blackjack_game" DROP COLUMN "abandonedAt";--> statement-breakpoint
ALTER TABLE "blackjack_game" DROP COLUMN "abandonReason";--> statement-breakpoint
ALTER TABLE "blackjack_game" DROP COLUMN "canResume";