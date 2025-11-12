ALTER TABLE "category" RENAME TO "product_category";--> statement-breakpoint
ALTER TABLE "card_group" RENAME TO "product_group";--> statement-breakpoint
ALTER TABLE "price" RENAME TO "product_price";--> statement-breakpoint
ALTER TABLE "card_subtype" RENAME TO "product_subtype";--> statement-breakpoint
ALTER TABLE "product_price" RENAME COLUMN "card_subtype_id" TO "product_subtype_id";--> statement-breakpoint
ALTER TABLE "product_group" DROP CONSTRAINT "card_group_category_id_category_category_id_fk";
--> statement-breakpoint
ALTER TABLE "product_subtype" DROP CONSTRAINT "card_subtype_product_id_product_product_id_fk";
--> statement-breakpoint
ALTER TABLE "product_price" DROP CONSTRAINT "price_card_subtype_id_card_subtype_id_fk";
--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "product_group_id_card_group_group_id_fk";
--> statement-breakpoint
ALTER TABLE "product_price" DROP CONSTRAINT "price_id_recorded_at_pk";--> statement-breakpoint
ALTER TABLE "product_price" ADD CONSTRAINT "product_price_id_recorded_at_pk" PRIMARY KEY("id","recorded_at");--> statement-breakpoint
ALTER TABLE "product_group" ADD CONSTRAINT "product_group_category_id_product_category_category_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_category"("category_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_subtype" ADD CONSTRAINT "product_subtype_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product_price" ADD CONSTRAINT "product_price_product_subtype_id_product_subtype_id_fk" FOREIGN KEY ("product_subtype_id") REFERENCES "public"."product_subtype"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_group_id_product_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."product_group"("group_id") ON DELETE cascade ON UPDATE no action;