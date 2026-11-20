-- Runbook tables only (password_manager / user.locale already in 0003–0004).
CREATE TABLE "runbook_execution_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"execution_id" uuid NOT NULL,
	"step_key" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text DEFAULT 'manual' NOT NULL,
	"title" text NOT NULL,
	"body_markdown" text DEFAULT '' NOT NULL,
	"risk" text DEFAULT 'low' NOT NULL,
	"depends_on_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"origin_step_id" uuid
);
--> statement-breakpoint
CREATE TABLE "runbook_executions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"runbook_id" uuid NOT NULL,
	"started_by" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"content_binding" text DEFAULT 'snapshot' NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "runbook_step_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"execution_id" uuid NOT NULL,
	"execution_step_id" uuid,
	"runbook_step_id" uuid,
	"status" text DEFAULT 'todo' NOT NULL,
	"result_note" text,
	"completed_at" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runbook_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"runbook_id" uuid NOT NULL,
	"step_key" text NOT NULL,
	"position" integer NOT NULL,
	"kind" text DEFAULT 'manual' NOT NULL,
	"title" text NOT NULL,
	"body_markdown" text DEFAULT '' NOT NULL,
	"risk" text DEFAULT 'low' NOT NULL,
	"depends_on_json" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"source" text DEFAULT 'generated' NOT NULL,
	"hidden_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "runbook_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"schema_json" jsonb NOT NULL,
	"content_markdown" text,
	CONSTRAINT "runbook_templates_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "runbooks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"environment_id" uuid,
	"template_id" uuid,
	"template_slug" text,
	"title" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"overview_markdown" text,
	"instance_version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "runbook_execution_steps" ADD CONSTRAINT "runbook_execution_steps_execution_id_runbook_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."runbook_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_execution_steps" ADD CONSTRAINT "runbook_execution_steps_origin_step_id_runbook_steps_id_fk" FOREIGN KEY ("origin_step_id") REFERENCES "public"."runbook_steps"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_executions" ADD CONSTRAINT "runbook_executions_runbook_id_runbooks_id_fk" FOREIGN KEY ("runbook_id") REFERENCES "public"."runbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_executions" ADD CONSTRAINT "runbook_executions_started_by_users_id_fk" FOREIGN KEY ("started_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_step_results" ADD CONSTRAINT "runbook_step_results_execution_id_runbook_executions_id_fk" FOREIGN KEY ("execution_id") REFERENCES "public"."runbook_executions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_step_results" ADD CONSTRAINT "runbook_step_results_execution_step_id_runbook_execution_steps_id_fk" FOREIGN KEY ("execution_step_id") REFERENCES "public"."runbook_execution_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_step_results" ADD CONSTRAINT "runbook_step_results_runbook_step_id_runbook_steps_id_fk" FOREIGN KEY ("runbook_step_id") REFERENCES "public"."runbook_steps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbook_steps" ADD CONSTRAINT "runbook_steps_runbook_id_runbooks_id_fk" FOREIGN KEY ("runbook_id") REFERENCES "public"."runbooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbooks" ADD CONSTRAINT "runbooks_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbooks" ADD CONSTRAINT "runbooks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbooks" ADD CONSTRAINT "runbooks_environment_id_project_environments_id_fk" FOREIGN KEY ("environment_id") REFERENCES "public"."project_environments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "runbooks" ADD CONSTRAINT "runbooks_template_id_runbook_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."runbook_templates"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "runbook_steps_key_idx" ON "runbook_steps" USING btree ("runbook_id","step_key");