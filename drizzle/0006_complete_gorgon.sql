ALTER TABLE "blackjack_game" ADD COLUMN "lastActivityAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL;--> statement-breakpoint
ALTER TABLE "blackjack_game" ADD COLUMN "expiresAt" timestamp with time zone NOT NULL;--> statement-breakpoint
ALTER TABLE "blackjack_game" ADD COLUMN "abandonedAt" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blackjack_game" ADD COLUMN "abandonReason" varchar(100);--> statement-breakpoint
ALTER TABLE "blackjack_game" ADD COLUMN "lastAction" varchar(50);--> statement-breakpoint
ALTER TABLE "blackjack_game" ADD COLUMN "canResume" boolean DEFAULT true NOT NULL;--> statement-breakpoint
CREATE INDEX "game_expires_at_idx" ON "blackjack_game" USING btree ("expiresAt");--> statement-breakpoint
CREATE INDEX "game_last_activity_idx" ON "blackjack_game" USING btree ("lastActivityAt");--> statement-breakpoint
CREATE INDEX "game_user_status_idx" ON "blackjack_game" USING btree ("userId","status");