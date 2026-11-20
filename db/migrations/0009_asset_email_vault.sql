ALTER TABLE "asset_emails" ADD COLUMN "password_manager_item_url" text;--> statement-breakpoint
UPDATE "asset_emails" ae
SET "password_manager_item_url" = ea."password_manager_item_url"
FROM "email_addresses" ea
WHERE ae."email_id" = ea."id"
  AND ea."password_manager_item_url" IS NOT NULL
  AND ae."password_manager_item_url" IS NULL;