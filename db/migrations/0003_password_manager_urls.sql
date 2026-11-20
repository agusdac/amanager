ALTER TABLE "email_addresses" ADD COLUMN IF NOT EXISTS "password_manager_item_url" text;--> statement-breakpoint
ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "password_manager_item_url" text;--> statement-breakpoint
ALTER TABLE "vault_references" ADD COLUMN IF NOT EXISTS "item_url" text;