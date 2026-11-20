ALTER TABLE "runbook_templates" ADD COLUMN "workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "runbook_templates" ADD CONSTRAINT "runbook_templates_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_templates" DROP CONSTRAINT "runbook_templates_slug_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "runbook_templates_system_slug_idx" ON "runbook_templates" ("slug") WHERE "workspace_id" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "runbook_templates_workspace_slug_idx" ON "runbook_templates" ("workspace_id", "slug") WHERE "workspace_id" IS NOT NULL;