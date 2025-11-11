ALTER TABLE "card" ADD COLUMN "card_number" text;--> statement-breakpoint
-- Indexes for card number searches
-- Exact match index (most common use case)
CREATE INDEX IF NOT EXISTS "idx_card_number" ON "card" ("card_number");
--> statement-breakpoint
-- Combined index for searching card numbers within a specific set/group
CREATE INDEX IF NOT EXISTS "idx_card_group_number" ON "card" ("group_id", "card_number");
--> statement-breakpoint
-- Trigram index for fuzzy matching and pattern searches (e.g., finding all cards in Pokemon set "*/142")
CREATE INDEX IF NOT EXISTS "idx_card_number_trgm" ON "card" USING gin ("card_number" gin_trgm_ops);