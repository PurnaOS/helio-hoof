import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  jsonb,
} from "drizzle-orm/pg-core";

// Analysis history table
export const analysisHistory = pgTable("analysis_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(), // Clerk user ID
  analysisType: text("analysis_type").notNull(), // 'single' or 'multi'
  imageCount: integer("image_count").default(1),
  analysisResult: text("analysis_result").notNull(), // The AI analysis text
  images: jsonb("images").$type<{
    id: string;
    filename: string;
    size: number;
    type: string;
    base64Data?: string; // Base64 encoded image data for reconstruction
    url?: string; // Optional - for future image storage
  }[]>().notNull(), // Metadata and data about uploaded images
  metadata: jsonb("metadata").$type<{
    processingTime?: number;
    model?: string;
    [key: string]: any;
  }>(), // Additional metadata
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow(),
});

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type NewAnalysisHistory = typeof analysisHistory.$inferInsert;