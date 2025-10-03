CREATE TABLE "blackjack_game" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"betAmount" integer NOT NULL,
	"playerHand" jsonb NOT NULL,
	"dealerHand" jsonb NOT NULL,
	"deck" jsonb NOT NULL,
	"status" varchar(50) NOT NULL,
	"result" varchar(50),
	"playerScore" integer,
	"dealerScore" integer,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"completedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "blackjack_game" ADD CONSTRAINT "blackjack_game_userId_blackjack_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."blackjack_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_user_id_idx" ON "blackjack_game" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "game_status_idx" ON "blackjack_game" USING btree ("status");--> statement-breakpoint
CREATE INDEX "game_created_at_idx" ON "blackjack_game" USING btree ("createdAt");