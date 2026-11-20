ALTER TABLE "sessions" ADD COLUMN "active_workspace_id" uuid;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_active_workspace_id_workspaces_id_fk" FOREIGN KEY ("active_workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "sessions" s SET "active_workspace_id" = (
  SELECT wm."workspace_id" FROM "workspace_members" wm
  INNER JOIN "workspaces" w ON w."id" = wm."workspace_id"
  WHERE wm."user_id" = s."user_id" AND w."type" = 'personal'
  LIMIT 1
);--> statement-breakpoint
CREATE TABLE "workspace_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by_user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"revoked_at" timestamp with time zone,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "workspace_invites_token_hash_unique" UNIQUE("token_hash")
);--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workspace_invites" ADD CONSTRAINT "workspace_invites_invited_by_user_id_users_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "workspace_invites_workspace_email_idx" ON "workspace_invites" USING btree ("workspace_id","email");--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "projects" p SET "created_by_user_id" = w."owner_user_id" FROM "workspaces" w WHERE w."id" = p."workspace_id";--> statement-breakpoint
ALTER TABLE "verifications" ADD COLUMN "assignee_user_id" uuid;--> statement-breakpoint
ALTER TABLE "verifications" ADD CONSTRAINT "verifications_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_steps" ADD COLUMN "default_assignee_user_id" uuid;--> statement-breakpoint
ALTER TABLE "runbook_steps" ADD CONSTRAINT "runbook_steps_default_assignee_user_id_users_id_fk" FOREIGN KEY ("default_assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_execution_steps" ADD COLUMN "assignee_user_id" uuid;--> statement-breakpoint
ALTER TABLE "runbook_execution_steps" ADD CONSTRAINT "runbook_execution_steps_assignee_user_id_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;