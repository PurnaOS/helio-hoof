-- Manual migration to add GIN indexes for JSONB columns
-- These indexes will improve performance for JSON queries on metadata and images columns

-- GIN index for metadata JSONB column (enables efficient JSON queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "analysis_history_metadata_gin_idx"
ON "analysis_history" USING gin ("metadata");

-- GIN index for images JSONB column (enables efficient JSON queries on image metadata)
CREATE INDEX CONCURRENTLY IF NOT EXISTS "analysis_history_images_gin_idx"
ON "analysis_history" USING gin ("images");