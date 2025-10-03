CREATE TABLE "blackjack_transaction" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"userId" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"amount" integer NOT NULL,
	"balanceBefore" integer NOT NULL,
	"balanceAfter" integer NOT NULL,
	"gameId" varchar(255),
	"metadata" jsonb,
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
ALTER TABLE "blackjack_transaction" ADD CONSTRAINT "blackjack_transaction_userId_blackjack_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."blackjack_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "transaction_user_id_idx" ON "blackjack_transaction" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "transaction_created_at_idx" ON "blackjack_transaction" USING btree ("createdAt");--> statement-breakpoint
CREATE INDEX "transaction_game_id_idx" ON "blackjack_transaction" USING btree ("gameId");