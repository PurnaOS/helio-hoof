CREATE TABLE "analysis_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"analysis_type" text NOT NULL,
	"image_count" integer DEFAULT 1,
	"analysis_result" text NOT NULL,
	"images" jsonb NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
