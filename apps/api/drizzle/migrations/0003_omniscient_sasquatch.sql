-- Note: TimescaleDB extension is already enabled in the database
-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
--> statement-breakpoint
CREATE TABLE "card" (
	"product_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"clean_name" text,
	"image_url" text,
	"category_id" integer,
	"group_id" integer NOT NULL,
	"url" text,
	"modified_on" timestamp,
	"image_count" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "card_group" (
	"group_id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"abbreviation" text,
	"is_supplemental" boolean DEFAULT false,
	"published_on" timestamp,
	"modified_on" timestamp,
	"category_id" integer
);
--> statement-breakpoint
CREATE TABLE "card_subtype" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"sub_type_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"first_seen_at" timestamp,
	"last_seen_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "extended_data" (
	"id" serial PRIMARY KEY NOT NULL,
	"product_id" integer NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"value" text
);
--> statement-breakpoint
CREATE TABLE "presale_info" (
	"product_id" integer PRIMARY KEY NOT NULL,
	"is_presale" boolean DEFAULT false NOT NULL,
	"released_on" timestamp,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "price" (
	"id" serial NOT NULL,
	"card_subtype_id" integer NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"low_price" numeric(10, 2),
	"mid_price" numeric(10, 2),
	"high_price" numeric(10, 2),
	"market_price" numeric(10, 2),
	"direct_low_price" numeric(10, 2),
	CONSTRAINT "price_id_recorded_at_pk" PRIMARY KEY("id","recorded_at")
);
--> statement-breakpoint
ALTER TABLE "card" ADD CONSTRAINT "card_group_id_card_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."card_group"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_subtype" ADD CONSTRAINT "card_subtype_product_id_card_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."card"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extended_data" ADD CONSTRAINT "extended_data_product_id_card_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."card"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presale_info" ADD CONSTRAINT "presale_info_product_id_card_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."card"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "price" ADD CONSTRAINT "price_card_subtype_id_card_subtype_id_fk" FOREIGN KEY ("card_subtype_id") REFERENCES "public"."card_subtype"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- Convert price table to TimescaleDB hypertable for time-series data
-- Partitions data by recorded_at timestamp with 7-day chunks
-- Note: Only works if TimescaleDB extension is available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'timescaledb') THEN
    PERFORM create_hypertable('price', 'recorded_at',
      chunk_time_interval => INTERVAL '7 days',
      if_not_exists => TRUE
    );
  ELSE
    RAISE NOTICE 'TimescaleDB extension not available - skipping hypertable creation';
  END IF;
END $$;
--> statement-breakpoint
-- Time-series indexes for price table
-- Index for fetching recent prices for a specific card subtype
CREATE INDEX IF NOT EXISTS "idx_price_card_subtype_time" ON "price" ("card_subtype_id", "recorded_at" DESC);
--> statement-breakpoint
-- Index for time-range queries across all prices
CREATE INDEX IF NOT EXISTS "idx_price_recorded_at" ON "price" ("recorded_at" DESC);
--> statement-breakpoint
-- Search-optimized indexes for card name searches
-- Trigram indexes enable fuzzy matching for names like "Pikachu & Zekrom"
CREATE INDEX IF NOT EXISTS "idx_card_name_trgm" ON "card" USING gin ("name" gin_trgm_ops);
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_card_clean_name_trgm" ON "card" USING gin ("clean_name" gin_trgm_ops);
--> statement-breakpoint
-- Index for filtering by card group name (e.g., "Obsidian Flames")
CREATE INDEX IF NOT EXISTS "idx_card_group_name" ON "card_group" ("name");
--> statement-breakpoint
-- Composite index for combined searches: filter by group, then search by name
-- Supports queries like "find all Pikachu cards in Obsidian Flames set"
CREATE INDEX IF NOT EXISTS "idx_card_group_id_name" ON "card" ("group_id", "name");