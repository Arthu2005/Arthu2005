import { sql } from "drizzle-orm";
import {
  bigserial,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

/* ------------------------------------------------------------------ */
/* Enums                                                               */
/* ------------------------------------------------------------------ */

export const roleEnum = pgEnum("user_role", ["admin", "recruiter", "editor"]);
export const jobStatusEnum = pgEnum("job_status", ["draft", "published", "paused", "closed", "archived"]);
export const workModelEnum = pgEnum("work_model", ["presencial", "hibrido", "remoto"]);
export const applicationModeEnum = pgEnum("application_mode", ["internal", "external"]);
export const fileVisibilityEnum = pgEnum("file_visibility", ["public", "private"]);
export const contentStatusEnum = pgEnum("content_status", ["draft", "published"]);
export const inboxStatusEnum = pgEnum("inbox_status", ["novo", "em_andamento", "respondido", "arquivado"]);
export const talentStatusEnum = pgEnum("talent_status", ["novo", "em_analise", "contatado", "arquivado"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

/* ------------------------------------------------------------------ */
/* Identity & access                                                   */
/* ------------------------------------------------------------------ */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: varchar("email", { length: 254 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    passwordHash: text("password_hash").notNull(),
    role: roleEnum("role").notNull().default("editor"),
    active: boolean("active").notNull().default(true),
    mustChangePassword: boolean("must_change_password").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (t) => [uniqueIndex("users_email_unique").on(sql`lower(${t.email})`)],
);

export const sessions = pgTable(
  "sessions",
  {
    /** SHA-256 of the random session token. The raw token lives only in the user's cookie. */
    id: varchar("id", { length: 64 }).primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    userAgent: varchar("user_agent", { length: 300 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("sessions_user_idx").on(t.userId)],
);

/** Sliding-window rate limiting (login, public forms). */
export const rateEvents = pgTable(
  "rate_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    bucket: varchar("bucket", { length: 40 }).notNull(),
    key: varchar("key", { length: 128 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rate_events_lookup_idx").on(t.bucket, t.key, t.createdAt)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    userEmail: varchar("user_email", { length: 254 }),
    action: varchar("action", { length: 80 }).notNull(),
    entityType: varchar("entity_type", { length: 60 }),
    entityId: varchar("entity_id", { length: 80 }),
    details: jsonb("details").$type<Record<string, unknown>>(),
    ipHash: varchar("ip_hash", { length: 64 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_created_idx").on(t.createdAt), index("audit_entity_idx").on(t.entityType, t.entityId)],
);

/* ------------------------------------------------------------------ */
/* Files (media library + private resumes)                             */
/* ------------------------------------------------------------------ */

export const files = pgTable(
  "files",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storageKey: text("storage_key").notNull(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    mimeType: varchar("mime_type", { length: 120 }).notNull(),
    size: integer("size").notNull(),
    sha256: varchar("sha256", { length: 64 }).notNull(),
    visibility: fileVisibilityEnum("visibility").notNull(),
    /** resume | media | document */
    purpose: varchar("purpose", { length: 20 }).notNull(),
    alt: varchar("alt", { length: 300 }),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("files_storage_key_unique").on(t.storageKey), index("files_purpose_idx").on(t.purpose)],
);

/* ------------------------------------------------------------------ */
/* Careers                                                             */
/* ------------------------------------------------------------------ */

export type JobQuestion = {
  id: string;
  label: string;
  type: "text" | "textarea" | "yesno" | "select";
  required: boolean;
  options?: string[];
};

export const jobs = pgTable(
  "jobs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 160 }).notNull(),
    department: varchar("department", { length: 120 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    workModel: workModelEnum("work_model").notNull().default("presencial"),
    contractType: varchar("contract_type", { length: 40 }).notNull(),
    summary: text("summary").notNull().default(""),
    description: text("description").notNull().default(""),
    responsibilities: jsonb("responsibilities").$type<string[]>().notNull().default([]),
    requirements: jsonb("requirements").$type<string[]>().notNull().default([]),
    niceToHave: jsonb("nice_to_have").$type<string[]>().notNull().default([]),
    benefits: jsonb("benefits").$type<string[]>().notNull().default([]),
    selectionSteps: jsonb("selection_steps").$type<string[]>().notNull().default([]),
    questions: jsonb("questions").$type<JobQuestion[]>().notNull().default([]),
    status: jobStatusEnum("status").notNull().default("draft"),
    applicationMode: applicationModeEnum("application_mode").notNull().default("internal"),
    externalUrl: text("external_url"),
    deadline: date("deadline"),
    maxApplications: integer("max_applications"),
    featured: boolean("featured").notNull().default(false),
    isDemo: boolean("is_demo").notNull().default(false),
    seoTitle: varchar("seo_title", { length: 160 }),
    seoDescription: varchar("seo_description", { length: 300 }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
    ...timestamps,
  },
  (t) => [uniqueIndex("jobs_slug_unique").on(t.slug), index("jobs_status_idx").on(t.status)],
);

export const pipelineStages = pgTable("pipeline_stages", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 40 }).notNull().unique(),
  label: varchar("label", { length: 80 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  color: varchar("color", { length: 20 }).notNull().default("#5a645e"),
  isTerminal: boolean("is_terminal").notNull().default(false),
});

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    protocol: varchar("protocol", { length: 24 }).notNull(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobs.id, { onDelete: "restrict" }),
    stageId: integer("stage_id")
      .notNull()
      .references(() => pipelineStages.id),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    linkedinUrl: text("linkedin_url"),
    portfolioUrl: text("portfolio_url"),
    answers: jsonb("answers").$type<{ questionId: string; label: string; answer: string }[]>().notNull().default([]),
    resumeFileId: uuid("resume_file_id").references(() => files.id, { onDelete: "set null" }),
    consentPrivacy: boolean("consent_privacy").notNull(),
    consentVersion: varchar("consent_version", { length: 20 }).notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    isDemo: boolean("is_demo").notNull().default(false),
    retentionUntil: date("retention_until").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("applications_protocol_unique").on(t.protocol),
    uniqueIndex("applications_job_email_unique").on(t.jobId, sql`lower(${t.email})`),
    index("applications_job_idx").on(t.jobId),
    index("applications_stage_idx").on(t.stageId),
    index("applications_created_idx").on(t.createdAt),
  ],
);

export const applicationNotes = pgTable(
  "application_notes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    authorId: uuid("author_id").references(() => users.id, { onDelete: "set null" }),
    authorName: varchar("author_name", { length: 160 }),
    body: text("body").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("application_notes_app_idx").on(t.applicationId)],
);

export const applicationEvents = pgTable(
  "application_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    userName: varchar("user_name", { length: 160 }),
    type: varchar("type", { length: 40 }).notNull(),
    fromStage: varchar("from_stage", { length: 80 }),
    toStage: varchar("to_stage", { length: 80 }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("application_events_app_idx").on(t.applicationId)],
);

export const talentPool = pgTable(
  "talent_pool",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    protocol: varchar("protocol", { length: 24 }).notNull(),
    fullName: varchar("full_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 30 }).notNull(),
    city: varchar("city", { length: 120 }).notNull(),
    state: varchar("state", { length: 2 }).notNull(),
    areas: jsonb("areas").$type<string[]>().notNull().default([]),
    experience: text("experience"),
    linkedinUrl: text("linkedin_url"),
    resumeFileId: uuid("resume_file_id").references(() => files.id, { onDelete: "set null" }),
    status: talentStatusEnum("status").notNull().default("novo"),
    internalNotes: text("internal_notes"),
    consentTalentPool: boolean("consent_talent_pool").notNull(),
    consentVersion: varchar("consent_version", { length: 20 }).notNull(),
    consentAt: timestamp("consent_at", { withTimezone: true }).notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    isDemo: boolean("is_demo").notNull().default(false),
    retentionUntil: date("retention_until").notNull(),
    ...timestamps,
  },
  (t) => [
    uniqueIndex("talent_pool_protocol_unique").on(t.protocol),
    uniqueIndex("talent_pool_email_unique").on(sql`lower(${t.email})`),
  ],
);

/* ------------------------------------------------------------------ */
/* Contact                                                             */
/* ------------------------------------------------------------------ */

export const contactMessages = pgTable(
  "contact_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    protocol: varchar("protocol", { length: 24 }).notNull(),
    name: varchar("name", { length: 160 }).notNull(),
    email: varchar("email", { length: 254 }).notNull(),
    phone: varchar("phone", { length: 30 }),
    company: varchar("company", { length: 160 }),
    topic: varchar("topic", { length: 40 }).notNull(),
    message: text("message").notNull(),
    status: inboxStatusEnum("status").notNull().default("novo"),
    internalNotes: text("internal_notes"),
    consentPrivacy: boolean("consent_privacy").notNull(),
    ipHash: varchar("ip_hash", { length: 64 }),
    retentionUntil: date("retention_until").notNull(),
    ...timestamps,
  },
  (t) => [uniqueIndex("contact_protocol_unique").on(t.protocol), index("contact_created_idx").on(t.createdAt)],
);

/* ------------------------------------------------------------------ */
/* CMS                                                                 */
/* ------------------------------------------------------------------ */

/** Single editable sections of a page (hero, intro…). Shape is defined in src/lib/content/sections.ts */
export const contentSections = pgTable(
  "content_sections",
  {
    id: serial("id").primaryKey(),
    page: varchar("page", { length: 40 }).notNull(),
    key: varchar("key", { length: 60 }).notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [uniqueIndex("content_sections_page_key_unique").on(t.page, t.key)],
);

/** Repeatable content (solutions, metrics, FAQ, testimonials…). Shape is defined in src/lib/content/collections.ts */
export const contentItems = pgTable(
  "content_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    collection: varchar("collection", { length: 40 }).notNull(),
    slug: varchar("slug", { length: 160 }).notNull(),
    title: varchar("title", { length: 200 }).notNull(),
    status: contentStatusEnum("status").notNull().default("draft"),
    sortOrder: integer("sort_order").notNull().default(0),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    ...timestamps,
    updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
  },
  (t) => [
    uniqueIndex("content_items_collection_slug_unique").on(t.collection, t.slug),
    index("content_items_collection_idx").on(t.collection, t.status, t.sortOrder),
  ],
);

export const settings = pgTable("settings", {
  key: varchar("key", { length: 60 }).primaryKey(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  updatedBy: uuid("updated_by").references(() => users.id, { onDelete: "set null" }),
});

export type User = typeof users.$inferSelect;
export type Role = (typeof roleEnum.enumValues)[number];
export type Job = typeof jobs.$inferSelect;
export type JobStatus = (typeof jobStatusEnum.enumValues)[number];
export type WorkModel = (typeof workModelEnum.enumValues)[number];
export type Application = typeof applications.$inferSelect;
export type PipelineStage = typeof pipelineStages.$inferSelect;
export type ContentItem = typeof contentItems.$inferSelect;
export type FileRecord = typeof files.$inferSelect;
export type TalentRecord = typeof talentPool.$inferSelect;
export type ContactMessage = typeof contactMessages.$inferSelect;
