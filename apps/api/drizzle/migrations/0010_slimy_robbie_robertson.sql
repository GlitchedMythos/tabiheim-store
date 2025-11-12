ALTER TABLE "product_subtype" DROP COLUMN "is_active";--> statement-breakpoint
ALTER TABLE "product_subtype" DROP COLUMN "first_seen_at";--> statement-breakpoint
ALTER TABLE "product_subtype" DROP COLUMN "last_seen_at";--> statement-breakpoint
ALTER TABLE "product_subtype" ADD CONSTRAINT "product_subtype_product_id_sub_type_name_unique" UNIQUE("product_id","sub_type_name");