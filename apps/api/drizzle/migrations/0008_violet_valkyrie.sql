ALTER TABLE "card" RENAME TO "product";--> statement-breakpoint
ALTER TABLE "product" DROP CONSTRAINT "card_group_id_card_group_group_id_fk";
--> statement-breakpoint
ALTER TABLE "card_subtype" DROP CONSTRAINT "card_subtype_product_id_card_product_id_fk";
--> statement-breakpoint
ALTER TABLE "extended_data" DROP CONSTRAINT "extended_data_product_id_card_product_id_fk";
--> statement-breakpoint
ALTER TABLE "presale_info" DROP CONSTRAINT "presale_info_product_id_card_product_id_fk";
--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_group_id_card_group_group_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."card_group"("group_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_subtype" ADD CONSTRAINT "card_subtype_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "extended_data" ADD CONSTRAINT "extended_data_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "presale_info" ADD CONSTRAINT "presale_info_product_id_product_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("product_id") ON DELETE cascade ON UPDATE no action;