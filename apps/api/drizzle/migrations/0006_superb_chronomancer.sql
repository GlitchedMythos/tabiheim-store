CREATE TABLE "category" (
	"category_id" integer PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"display_name" text,
	"published_on" timestamp,
	"modified_on" timestamp
);
--> statement-breakpoint
ALTER TABLE "card_group" ADD CONSTRAINT "card_group_category_id_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."category"("category_id") ON DELETE cascade ON UPDATE no action;