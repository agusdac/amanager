CREATE TABLE "asset_emails" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"asset_id" uuid NOT NULL,
	"email_id" uuid NOT NULL,
	"purpose" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "asset_emails" ADD CONSTRAINT "asset_emails_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "public"."assets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "asset_emails" ADD CONSTRAINT "asset_emails_email_id_email_addresses_id_fk" FOREIGN KEY ("email_id") REFERENCES "public"."email_addresses"("id") ON DELETE cascade ON UPDATE no action;