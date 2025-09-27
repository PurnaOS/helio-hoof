import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Analysis history table
export const analysisHistory = pgTable(
  "analysis_history",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull(), // Clerk user ID
    name: text("name"), // User-defined name for the analysis
    description: text("description"), // Optional description explaining the purpose
    analysisType: text("analysis_type").notNull(), // 'single' or 'multi'
    imageCount: integer("image_count").default(1),
    analysisResult: text("analysis_result").notNull(), // The AI analysis text
    images: jsonb("images")
      .$type<
        {
          id: string;
          filename: string;
          size: number;
          type: string;
          base64Data?: string; // Base64 encoded image data for reconstruction
          url?: string; // Optional - for future image storage
        }[]
      >()
      .notNull(), // Metadata and data about uploaded images
    metadata: jsonb("metadata").$type<{
      processingTime?: number;
      model?: string;
      [key: string]: string | number | boolean | null | undefined;
    }>(), // Additional metadata
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (table) => ({
    // Primary index for user-specific queries ordered by creation time
    // This covers the most common query pattern: getUserHistory ordered by createdAt DESC
    userCreatedAtIdx: index("analysis_history_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    // Index for user-specific queries (covers userId filtering)
    userIdIdx: index("analysis_history_user_id_idx").on(table.userId),
    // Index for time-based queries and sorting
    createdAtIdx: index("analysis_history_created_at_idx").on(table.createdAt),
    // Index for analysis type filtering (useful for analytics and filtering)
    analysisTypeIdx: index("analysis_history_analysis_type_idx").on(
      table.analysisType,
    ),
    // Composite index for user + analysis type queries
    userAnalysisTypeIdx: index("analysis_history_user_analysis_type_idx").on(
      table.userId,
      table.analysisType,
    ),
  }),
);

export type AnalysisHistory = typeof analysisHistory.$inferSelect;
export type NewAnalysisHistory = typeof analysisHistory.$inferInsert;
