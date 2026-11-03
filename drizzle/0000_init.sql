CREATE TYPE "public"."application_mode" AS ENUM('internal', 'external');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'published');--> statement-breakpoint
CREATE TYPE "public"."file_visibility" AS ENUM('public', 'private');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('novo', 'em_andamento', 'respondido', 'arquivado');--> statement-breakpoint
CREATE TYPE "public"."job_status" AS ENUM('draft', 'published', 'paused', 'closed', 'archived');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'recruiter', 'editor');--> statement-breakpoint
CREATE TYPE "public"."talent_status" AS ENUM('novo', 'em_analise', 'contatado', 'arquivado');--> statement-breakpoint
CREATE TYPE "public"."work_model" AS ENUM('presencial', 'hibrido', 'remoto');--> statement-breakpoint
CREATE TABLE "application_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"user_id" uuid,
	"user_name" varchar(160),
	"type" varchar(40) NOT NULL,
	"from_stage" varchar(80),
	"to_stage" varchar(80),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "application_notes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"author_id" uuid,
	"author_name" varchar(160),
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol" varchar(24) NOT NULL,
	"job_id" uuid NOT NULL,
	"stage_id" integer NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"email" varchar(254) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"city" varchar(120) NOT NULL,
	"state" varchar(2) NOT NULL,
	"linkedin_url" text,
	"portfolio_url" text,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"resume_file_id" uuid,
	"consent_privacy" boolean NOT NULL,
	"consent_version" varchar(20) NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"ip_hash" varchar(64),
	"is_demo" boolean DEFAULT false NOT NULL,
	"retention_until" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"user_email" varchar(254),
	"action" varchar(80) NOT NULL,
	"entity_type" varchar(60),
	"entity_id" varchar(80),
	"details" jsonb,
	"ip_hash" varchar(64),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contact_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol" varchar(24) NOT NULL,
	"name" varchar(160) NOT NULL,
	"email" varchar(254) NOT NULL,
	"phone" varchar(30),
	"company" varchar(160),
	"topic" varchar(40) NOT NULL,
	"message" text NOT NULL,
	"status" "inbox_status" DEFAULT 'novo' NOT NULL,
	"internal_notes" text,
	"consent_privacy" boolean NOT NULL,
	"ip_hash" varchar(64),
	"retention_until" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collection" varchar(40) NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(200) NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "content_sections" (
	"id" serial PRIMARY KEY NOT NULL,
	"page" varchar(40) NOT NULL,
	"key" varchar(60) NOT NULL,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"storage_key" text NOT NULL,
	"original_name" varchar(255) NOT NULL,
	"mime_type" varchar(120) NOT NULL,
	"size" integer NOT NULL,
	"sha256" varchar(64) NOT NULL,
	"visibility" "file_visibility" NOT NULL,
	"purpose" varchar(20) NOT NULL,
	"alt" varchar(300),
	"uploaded_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(160) NOT NULL,
	"title" varchar(160) NOT NULL,
	"department" varchar(120) NOT NULL,
	"city" varchar(120) NOT NULL,
	"state" varchar(2) NOT NULL,
	"work_model" "work_model" DEFAULT 'presencial' NOT NULL,
	"contract_type" varchar(40) NOT NULL,
	"summary" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"responsibilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"requirements" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"nice_to_have" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"benefits" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"selection_steps" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "job_status" DEFAULT 'draft' NOT NULL,
	"application_mode" "application_mode" DEFAULT 'internal' NOT NULL,
	"external_url" text,
	"deadline" date,
	"max_applications" integer,
	"featured" boolean DEFAULT false NOT NULL,
	"is_demo" boolean DEFAULT false NOT NULL,
	"seo_title" varchar(160),
	"seo_description" varchar(300),
	"published_at" timestamp with time zone,
	"closed_at" timestamp with time zone,
	"created_by" uuid,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pipeline_stages" (
	"id" serial PRIMARY KEY NOT NULL,
	"key" varchar(40) NOT NULL,
	"label" varchar(80) NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"color" varchar(20) DEFAULT '#6b7280' NOT NULL,
	"is_terminal" boolean DEFAULT false NOT NULL,
	CONSTRAINT "pipeline_stages_key_unique" UNIQUE("key")
);
--> statement-breakpoint
CREATE TABLE "rate_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"bucket" varchar(40) NOT NULL,
	"key" varchar(128) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"ip_hash" varchar(64),
	"user_agent" varchar(300),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(60) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid
);
--> statement-breakpoint
CREATE TABLE "talent_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"protocol" varchar(24) NOT NULL,
	"full_name" varchar(160) NOT NULL,
	"email" varchar(254) NOT NULL,
	"phone" varchar(30) NOT NULL,
	"city" varchar(120) NOT NULL,
	"state" varchar(2) NOT NULL,
	"areas" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"experience" text,
	"linkedin_url" text,
	"resume_file_id" uuid,
	"status" "talent_status" DEFAULT 'novo' NOT NULL,
	"internal_notes" text,
	"consent_talent_pool" boolean NOT NULL,
	"consent_version" varchar(20) NOT NULL,
	"consent_at" timestamp with time zone NOT NULL,
	"ip_hash" varchar(64),
	"is_demo" boolean DEFAULT false NOT NULL,
	"retention_until" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(254) NOT NULL,
	"name" varchar(160) NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'editor' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"must_change_password" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_events" ADD CONSTRAINT "application_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application_notes" ADD CONSTRAINT "application_notes_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_id_jobs_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_stage_id_pipeline_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."pipeline_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "applications" ADD CONSTRAINT "applications_resume_file_id_files_id_fk" FOREIGN KEY ("resume_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_items" ADD CONSTRAINT "content_items_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_sections" ADD CONSTRAINT "content_sections_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "files" ADD CONSTRAINT "files_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settings" ADD CONSTRAINT "settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "talent_pool" ADD CONSTRAINT "talent_pool_resume_file_id_files_id_fk" FOREIGN KEY ("resume_file_id") REFERENCES "public"."files"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "application_events_app_idx" ON "application_events" USING btree ("application_id");--> statement-breakpoint
CREATE INDEX "application_notes_app_idx" ON "application_notes" USING btree ("application_id");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_protocol_unique" ON "applications" USING btree ("protocol");--> statement-breakpoint
CREATE UNIQUE INDEX "applications_job_email_unique" ON "applications" USING btree ("job_id",lower("email"));--> statement-breakpoint
CREATE INDEX "applications_job_idx" ON "applications" USING btree ("job_id");--> statement-breakpoint
CREATE INDEX "applications_stage_idx" ON "applications" USING btree ("stage_id");--> statement-breakpoint
CREATE INDEX "applications_created_idx" ON "applications" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_created_idx" ON "audit_logs" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "audit_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "contact_protocol_unique" ON "contact_messages" USING btree ("protocol");--> statement-breakpoint
CREATE INDEX "contact_created_idx" ON "contact_messages" USING btree ("created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "content_items_collection_slug_unique" ON "content_items" USING btree ("collection","slug");--> statement-breakpoint
CREATE INDEX "content_items_collection_idx" ON "content_items" USING btree ("collection","status","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "content_sections_page_key_unique" ON "content_sections" USING btree ("page","key");--> statement-breakpoint
CREATE UNIQUE INDEX "files_storage_key_unique" ON "files" USING btree ("storage_key");--> statement-breakpoint
CREATE INDEX "files_purpose_idx" ON "files" USING btree ("purpose");--> statement-breakpoint
CREATE UNIQUE INDEX "jobs_slug_unique" ON "jobs" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "jobs_status_idx" ON "jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "rate_events_lookup_idx" ON "rate_events" USING btree ("bucket","key","created_at");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "talent_pool_protocol_unique" ON "talent_pool" USING btree ("protocol");--> statement-breakpoint
CREATE UNIQUE INDEX "talent_pool_email_unique" ON "talent_pool" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree (lower("email"));