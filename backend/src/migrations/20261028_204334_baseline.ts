import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Production's tables already exist: Payload's dev-mode push created them before there
  // were migrations (see src/db/runMigrations.ts). There this baseline is only recorded as
  // applied; runMigrations' schema check confirms the database matches it.
  const existing = await db.execute(sql`SELECT to_regclass('public.lines') AS lines`)
  if (existing.rows[0]?.lines) return

  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'agent', 'viewer');
  CREATE TYPE "public"."enum_stations_timetable_days_of_operation" AS ENUM('daily', 'weekdays', 'weekend', 'other');
  CREATE TYPE "public"."enum_stations_arrivals_days_of_operation" AS ENUM('daily', 'weekdays', 'weekend', 'other');
  CREATE TYPE "public"."enum_stations_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__stations_v_version_timetable_days_of_operation" AS ENUM('daily', 'weekdays', 'weekend', 'other');
  CREATE TYPE "public"."enum__stations_v_version_arrivals_days_of_operation" AS ENUM('daily', 'weekdays', 'weekend', 'other');
  CREATE TYPE "public"."enum__stations_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum_lines_tenders_status" AS ENUM('open', 'closed', 'awarded');
  CREATE TYPE "public"."enum_lines_tenders_match_type" AS ENUM('auto-matched', 'confirmed');
  CREATE TYPE "public"."line_status" AS ENUM('active_passenger', 'freight_only', 'planned', 'closed');
  CREATE TYPE "public"."enum_lines_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__lines_v_version_tenders_status" AS ENUM('open', 'closed', 'awarded');
  CREATE TYPE "public"."enum__lines_v_version_tenders_match_type" AS ENUM('auto-matched', 'confirmed');
  CREATE TYPE "public"."enum__lines_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"role" "enum_users_role" DEFAULT 'viewer' NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"enable_a_p_i_key" boolean,
  	"api_key" varchar,
  	"api_key_index" varchar,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "stations_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar
  );
  
  CREATE TABLE "stations_timetable" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"line_id_id" varchar,
  	"operator" varchar,
  	"platform" varchar,
  	"train_number" varchar,
  	"train_name" varchar,
  	"days_of_operation" "enum_stations_timetable_days_of_operation",
  	"destination" varchar
  );
  
  CREATE TABLE "stations_arrivals" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"line_id_id" varchar,
  	"operator" varchar,
  	"platform" varchar,
  	"train_number" varchar,
  	"train_name" varchar,
  	"days_of_operation" "enum_stations_arrivals_days_of_operation",
  	"origin" varchar
  );
  
  CREATE TABLE "stations_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" varchar,
  	"label" varchar,
  	"url" varchar,
  	"last_updated" timestamp(3) with time zone
  );
  
  CREATE TABLE "stations" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"coordinates" geometry(Point),
  	"description" varchar,
  	"plk_station_id" numeric,
  	"category" varchar,
  	"address" varchar,
  	"year_built" numeric,
  	"platform_count" numeric,
  	"accessibility" varchar,
  	"photo_url" varchar,
  	"photo_credit" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_stations_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "_stations_v_version_amenities" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_stations_v_version_timetable" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"line_id_id" varchar,
  	"operator" varchar,
  	"platform" varchar,
  	"train_number" varchar,
  	"train_name" varchar,
  	"days_of_operation" "enum__stations_v_version_timetable_days_of_operation",
  	"destination" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_stations_v_version_arrivals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"time" varchar,
  	"line_id_id" varchar,
  	"operator" varchar,
  	"platform" varchar,
  	"train_number" varchar,
  	"train_name" varchar,
  	"days_of_operation" "enum__stations_v_version_arrivals_days_of_operation",
  	"origin" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_stations_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"section" varchar,
  	"label" varchar,
  	"url" varchar,
  	"last_updated" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_stations_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_name" varchar,
  	"version_coordinates" geometry(Point),
  	"version_description" varchar,
  	"version_plk_station_id" numeric,
  	"version_category" varchar,
  	"version_address" varchar,
  	"version_year_built" numeric,
  	"version_platform_count" numeric,
  	"version_accessibility" varchar,
  	"version_photo_url" varchar,
  	"version_photo_credit" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__stations_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "lines_operators" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "lines_passenger_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "lines_end_stations" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"value" varchar
  );
  
  CREATE TABLE "lines_history_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"year" numeric,
  	"label" varchar
  );
  
  CREATE TABLE "lines_history_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"credit" varchar
  );
  
  CREATE TABLE "lines_tenders" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"authority" varchar,
  	"estimated_value_p_l_n" numeric,
  	"publication_date" timestamp(3) with time zone,
  	"deadline" timestamp(3) with time zone,
  	"status" "enum_lines_tenders_status",
  	"url" varchar,
  	"match_type" "enum_lines_tenders_match_type"
  );
  
  CREATE TABLE "lines_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"section" varchar,
  	"label" varchar,
  	"url" varchar,
  	"last_updated" timestamp(3) with time zone
  );
  
  CREATE TABLE "lines" (
  	"id" varchar PRIMARY KEY NOT NULL,
  	"number" varchar,
  	"name" varchar,
  	"status" "line_status",
  	"electrified" boolean DEFAULT false,
  	"length_km" numeric,
  	"tracks" numeric,
  	"max_speed_kmh" numeric,
  	"manually_curated" boolean DEFAULT false,
  	"geometry" jsonb,
  	"history_narrative" varchar,
  	"change_summary" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_lines_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "lines_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" varchar NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" varchar
  );
  
  CREATE TABLE "_lines_v_version_operators" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lines_v_version_passenger_services" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lines_v_version_end_stations" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"value" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lines_v_version_history_timeline" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"year" numeric,
  	"label" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lines_v_version_history_photos" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"url" varchar,
  	"credit" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lines_v_version_tenders" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"authority" varchar,
  	"estimated_value_p_l_n" numeric,
  	"publication_date" timestamp(3) with time zone,
  	"deadline" timestamp(3) with time zone,
  	"status" "enum__lines_v_version_tenders_status",
  	"url" varchar,
  	"match_type" "enum__lines_v_version_tenders_match_type",
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lines_v_version_sources" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"section" varchar,
  	"label" varchar,
  	"url" varchar,
  	"last_updated" timestamp(3) with time zone,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_lines_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" varchar,
  	"version_number" varchar,
  	"version_name" varchar,
  	"version_status" "line_status",
  	"version_electrified" boolean DEFAULT false,
  	"version_length_km" numeric,
  	"version_tracks" numeric,
  	"version_max_speed_kmh" numeric,
  	"version_manually_curated" boolean DEFAULT false,
  	"version_geometry" jsonb,
  	"version_history_narrative" varchar,
  	"version_change_summary" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__lines_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "_lines_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"stations_id" varchar
  );
  
  CREATE TABLE "feedback" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"message" varchar NOT NULL,
  	"page" varchar,
  	"language" varchar,
  	"user_agent" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"stations_id" varchar,
  	"lines_id" varchar,
  	"feedback_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "timetable_info" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"valid_from" timestamp(3) with time zone,
  	"valid_to" timestamp(3) with time zone,
  	"source" varchar,
  	"plk_schedules_version" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stations_amenities" ADD CONSTRAINT "stations_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stations_timetable" ADD CONSTRAINT "stations_timetable_line_id_id_lines_id_fk" FOREIGN KEY ("line_id_id") REFERENCES "public"."lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stations_timetable" ADD CONSTRAINT "stations_timetable_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stations_arrivals" ADD CONSTRAINT "stations_arrivals_line_id_id_lines_id_fk" FOREIGN KEY ("line_id_id") REFERENCES "public"."lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "stations_arrivals" ADD CONSTRAINT "stations_arrivals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "stations_sources" ADD CONSTRAINT "stations_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stations_v_version_amenities" ADD CONSTRAINT "_stations_v_version_amenities_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stations_v_version_timetable" ADD CONSTRAINT "_stations_v_version_timetable_line_id_id_lines_id_fk" FOREIGN KEY ("line_id_id") REFERENCES "public"."lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stations_v_version_timetable" ADD CONSTRAINT "_stations_v_version_timetable_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stations_v_version_arrivals" ADD CONSTRAINT "_stations_v_version_arrivals_line_id_id_lines_id_fk" FOREIGN KEY ("line_id_id") REFERENCES "public"."lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_stations_v_version_arrivals" ADD CONSTRAINT "_stations_v_version_arrivals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stations_v_version_sources" ADD CONSTRAINT "_stations_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_stations_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_stations_v" ADD CONSTRAINT "_stations_v_parent_id_stations_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."stations"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "lines_operators" ADD CONSTRAINT "lines_operators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_passenger_services" ADD CONSTRAINT "lines_passenger_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_end_stations" ADD CONSTRAINT "lines_end_stations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_history_timeline" ADD CONSTRAINT "lines_history_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_history_photos" ADD CONSTRAINT "lines_history_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_tenders" ADD CONSTRAINT "lines_tenders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_sources" ADD CONSTRAINT "lines_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_rels" ADD CONSTRAINT "lines_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "lines_rels" ADD CONSTRAINT "lines_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_version_operators" ADD CONSTRAINT "_lines_v_version_operators_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_version_passenger_services" ADD CONSTRAINT "_lines_v_version_passenger_services_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_version_end_stations" ADD CONSTRAINT "_lines_v_version_end_stations_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_version_history_timeline" ADD CONSTRAINT "_lines_v_version_history_timeline_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_version_history_photos" ADD CONSTRAINT "_lines_v_version_history_photos_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_version_tenders" ADD CONSTRAINT "_lines_v_version_tenders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_version_sources" ADD CONSTRAINT "_lines_v_version_sources_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v" ADD CONSTRAINT "_lines_v_parent_id_lines_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."lines"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_lines_v_rels" ADD CONSTRAINT "_lines_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_lines_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_lines_v_rels" ADD CONSTRAINT "_lines_v_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stations_fk" FOREIGN KEY ("stations_id") REFERENCES "public"."stations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_lines_fk" FOREIGN KEY ("lines_id") REFERENCES "public"."lines"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_feedback_fk" FOREIGN KEY ("feedback_id") REFERENCES "public"."feedback"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "stations_amenities_order_idx" ON "stations_amenities" USING btree ("_order");
  CREATE INDEX "stations_amenities_parent_id_idx" ON "stations_amenities" USING btree ("_parent_id");
  CREATE INDEX "stations_timetable_order_idx" ON "stations_timetable" USING btree ("_order");
  CREATE INDEX "stations_timetable_parent_id_idx" ON "stations_timetable" USING btree ("_parent_id");
  CREATE INDEX "stations_timetable_line_id_idx" ON "stations_timetable" USING btree ("line_id_id");
  CREATE INDEX "stations_arrivals_order_idx" ON "stations_arrivals" USING btree ("_order");
  CREATE INDEX "stations_arrivals_parent_id_idx" ON "stations_arrivals" USING btree ("_parent_id");
  CREATE INDEX "stations_arrivals_line_id_idx" ON "stations_arrivals" USING btree ("line_id_id");
  CREATE INDEX "stations_sources_order_idx" ON "stations_sources" USING btree ("_order");
  CREATE INDEX "stations_sources_parent_id_idx" ON "stations_sources" USING btree ("_parent_id");
  CREATE INDEX "stations_updated_at_idx" ON "stations" USING btree ("updated_at");
  CREATE INDEX "stations_created_at_idx" ON "stations" USING btree ("created_at");
  CREATE INDEX "stations__status_idx" ON "stations" USING btree ("_status");
  CREATE INDEX "_stations_v_version_amenities_order_idx" ON "_stations_v_version_amenities" USING btree ("_order");
  CREATE INDEX "_stations_v_version_amenities_parent_id_idx" ON "_stations_v_version_amenities" USING btree ("_parent_id");
  CREATE INDEX "_stations_v_version_timetable_order_idx" ON "_stations_v_version_timetable" USING btree ("_order");
  CREATE INDEX "_stations_v_version_timetable_parent_id_idx" ON "_stations_v_version_timetable" USING btree ("_parent_id");
  CREATE INDEX "_stations_v_version_timetable_line_id_idx" ON "_stations_v_version_timetable" USING btree ("line_id_id");
  CREATE INDEX "_stations_v_version_arrivals_order_idx" ON "_stations_v_version_arrivals" USING btree ("_order");
  CREATE INDEX "_stations_v_version_arrivals_parent_id_idx" ON "_stations_v_version_arrivals" USING btree ("_parent_id");
  CREATE INDEX "_stations_v_version_arrivals_line_id_idx" ON "_stations_v_version_arrivals" USING btree ("line_id_id");
  CREATE INDEX "_stations_v_version_sources_order_idx" ON "_stations_v_version_sources" USING btree ("_order");
  CREATE INDEX "_stations_v_version_sources_parent_id_idx" ON "_stations_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_stations_v_parent_idx" ON "_stations_v" USING btree ("parent_id");
  CREATE INDEX "_stations_v_version_version_updated_at_idx" ON "_stations_v" USING btree ("version_updated_at");
  CREATE INDEX "_stations_v_version_version_created_at_idx" ON "_stations_v" USING btree ("version_created_at");
  CREATE INDEX "_stations_v_version_version__status_idx" ON "_stations_v" USING btree ("version__status");
  CREATE INDEX "_stations_v_created_at_idx" ON "_stations_v" USING btree ("created_at");
  CREATE INDEX "_stations_v_updated_at_idx" ON "_stations_v" USING btree ("updated_at");
  CREATE INDEX "_stations_v_latest_idx" ON "_stations_v" USING btree ("latest");
  CREATE INDEX "lines_operators_order_idx" ON "lines_operators" USING btree ("_order");
  CREATE INDEX "lines_operators_parent_id_idx" ON "lines_operators" USING btree ("_parent_id");
  CREATE INDEX "lines_passenger_services_order_idx" ON "lines_passenger_services" USING btree ("_order");
  CREATE INDEX "lines_passenger_services_parent_id_idx" ON "lines_passenger_services" USING btree ("_parent_id");
  CREATE INDEX "lines_end_stations_order_idx" ON "lines_end_stations" USING btree ("_order");
  CREATE INDEX "lines_end_stations_parent_id_idx" ON "lines_end_stations" USING btree ("_parent_id");
  CREATE INDEX "lines_history_timeline_order_idx" ON "lines_history_timeline" USING btree ("_order");
  CREATE INDEX "lines_history_timeline_parent_id_idx" ON "lines_history_timeline" USING btree ("_parent_id");
  CREATE INDEX "lines_history_photos_order_idx" ON "lines_history_photos" USING btree ("_order");
  CREATE INDEX "lines_history_photos_parent_id_idx" ON "lines_history_photos" USING btree ("_parent_id");
  CREATE INDEX "lines_tenders_order_idx" ON "lines_tenders" USING btree ("_order");
  CREATE INDEX "lines_tenders_parent_id_idx" ON "lines_tenders" USING btree ("_parent_id");
  CREATE INDEX "lines_sources_order_idx" ON "lines_sources" USING btree ("_order");
  CREATE INDEX "lines_sources_parent_id_idx" ON "lines_sources" USING btree ("_parent_id");
  CREATE INDEX "lines_updated_at_idx" ON "lines" USING btree ("updated_at");
  CREATE INDEX "lines_created_at_idx" ON "lines" USING btree ("created_at");
  CREATE INDEX "lines__status_idx" ON "lines" USING btree ("_status");
  CREATE INDEX "lines_rels_order_idx" ON "lines_rels" USING btree ("order");
  CREATE INDEX "lines_rels_parent_idx" ON "lines_rels" USING btree ("parent_id");
  CREATE INDEX "lines_rels_path_idx" ON "lines_rels" USING btree ("path");
  CREATE INDEX "lines_rels_stations_id_idx" ON "lines_rels" USING btree ("stations_id");
  CREATE INDEX "_lines_v_version_operators_order_idx" ON "_lines_v_version_operators" USING btree ("_order");
  CREATE INDEX "_lines_v_version_operators_parent_id_idx" ON "_lines_v_version_operators" USING btree ("_parent_id");
  CREATE INDEX "_lines_v_version_passenger_services_order_idx" ON "_lines_v_version_passenger_services" USING btree ("_order");
  CREATE INDEX "_lines_v_version_passenger_services_parent_id_idx" ON "_lines_v_version_passenger_services" USING btree ("_parent_id");
  CREATE INDEX "_lines_v_version_end_stations_order_idx" ON "_lines_v_version_end_stations" USING btree ("_order");
  CREATE INDEX "_lines_v_version_end_stations_parent_id_idx" ON "_lines_v_version_end_stations" USING btree ("_parent_id");
  CREATE INDEX "_lines_v_version_history_timeline_order_idx" ON "_lines_v_version_history_timeline" USING btree ("_order");
  CREATE INDEX "_lines_v_version_history_timeline_parent_id_idx" ON "_lines_v_version_history_timeline" USING btree ("_parent_id");
  CREATE INDEX "_lines_v_version_history_photos_order_idx" ON "_lines_v_version_history_photos" USING btree ("_order");
  CREATE INDEX "_lines_v_version_history_photos_parent_id_idx" ON "_lines_v_version_history_photos" USING btree ("_parent_id");
  CREATE INDEX "_lines_v_version_tenders_order_idx" ON "_lines_v_version_tenders" USING btree ("_order");
  CREATE INDEX "_lines_v_version_tenders_parent_id_idx" ON "_lines_v_version_tenders" USING btree ("_parent_id");
  CREATE INDEX "_lines_v_version_sources_order_idx" ON "_lines_v_version_sources" USING btree ("_order");
  CREATE INDEX "_lines_v_version_sources_parent_id_idx" ON "_lines_v_version_sources" USING btree ("_parent_id");
  CREATE INDEX "_lines_v_parent_idx" ON "_lines_v" USING btree ("parent_id");
  CREATE INDEX "_lines_v_version_version_updated_at_idx" ON "_lines_v" USING btree ("version_updated_at");
  CREATE INDEX "_lines_v_version_version_created_at_idx" ON "_lines_v" USING btree ("version_created_at");
  CREATE INDEX "_lines_v_version_version__status_idx" ON "_lines_v" USING btree ("version__status");
  CREATE INDEX "_lines_v_created_at_idx" ON "_lines_v" USING btree ("created_at");
  CREATE INDEX "_lines_v_updated_at_idx" ON "_lines_v" USING btree ("updated_at");
  CREATE INDEX "_lines_v_latest_idx" ON "_lines_v" USING btree ("latest");
  CREATE INDEX "_lines_v_rels_order_idx" ON "_lines_v_rels" USING btree ("order");
  CREATE INDEX "_lines_v_rels_parent_idx" ON "_lines_v_rels" USING btree ("parent_id");
  CREATE INDEX "_lines_v_rels_path_idx" ON "_lines_v_rels" USING btree ("path");
  CREATE INDEX "_lines_v_rels_stations_id_idx" ON "_lines_v_rels" USING btree ("stations_id");
  CREATE INDEX "feedback_updated_at_idx" ON "feedback" USING btree ("updated_at");
  CREATE INDEX "feedback_created_at_idx" ON "feedback" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_stations_id_idx" ON "payload_locked_documents_rels" USING btree ("stations_id");
  CREATE INDEX "payload_locked_documents_rels_lines_id_idx" ON "payload_locked_documents_rels" USING btree ("lines_id");
  CREATE INDEX "payload_locked_documents_rels_feedback_id_idx" ON "payload_locked_documents_rels" USING btree ("feedback_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "stations_amenities" CASCADE;
  DROP TABLE "stations_timetable" CASCADE;
  DROP TABLE "stations_arrivals" CASCADE;
  DROP TABLE "stations_sources" CASCADE;
  DROP TABLE "stations" CASCADE;
  DROP TABLE "_stations_v_version_amenities" CASCADE;
  DROP TABLE "_stations_v_version_timetable" CASCADE;
  DROP TABLE "_stations_v_version_arrivals" CASCADE;
  DROP TABLE "_stations_v_version_sources" CASCADE;
  DROP TABLE "_stations_v" CASCADE;
  DROP TABLE "lines_operators" CASCADE;
  DROP TABLE "lines_passenger_services" CASCADE;
  DROP TABLE "lines_end_stations" CASCADE;
  DROP TABLE "lines_history_timeline" CASCADE;
  DROP TABLE "lines_history_photos" CASCADE;
  DROP TABLE "lines_tenders" CASCADE;
  DROP TABLE "lines_sources" CASCADE;
  DROP TABLE "lines" CASCADE;
  DROP TABLE "lines_rels" CASCADE;
  DROP TABLE "_lines_v_version_operators" CASCADE;
  DROP TABLE "_lines_v_version_passenger_services" CASCADE;
  DROP TABLE "_lines_v_version_end_stations" CASCADE;
  DROP TABLE "_lines_v_version_history_timeline" CASCADE;
  DROP TABLE "_lines_v_version_history_photos" CASCADE;
  DROP TABLE "_lines_v_version_tenders" CASCADE;
  DROP TABLE "_lines_v_version_sources" CASCADE;
  DROP TABLE "_lines_v" CASCADE;
  DROP TABLE "_lines_v_rels" CASCADE;
  DROP TABLE "feedback" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "timetable_info" CASCADE;
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_stations_timetable_days_of_operation";
  DROP TYPE "public"."enum_stations_arrivals_days_of_operation";
  DROP TYPE "public"."enum_stations_status";
  DROP TYPE "public"."enum__stations_v_version_timetable_days_of_operation";
  DROP TYPE "public"."enum__stations_v_version_arrivals_days_of_operation";
  DROP TYPE "public"."enum__stations_v_version_status";
  DROP TYPE "public"."enum_lines_tenders_status";
  DROP TYPE "public"."enum_lines_tenders_match_type";
  DROP TYPE "public"."line_status";
  DROP TYPE "public"."enum_lines_status";
  DROP TYPE "public"."enum__lines_v_version_tenders_status";
  DROP TYPE "public"."enum__lines_v_version_tenders_match_type";
  DROP TYPE "public"."enum__lines_v_version_status";`)
}
