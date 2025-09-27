import { z } from "zod";

// Environment validation schema
export const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  ANTHROPIC_API_KEY: z.string().min(1, "Anthropic API key is required"),
  CLERK_SECRET_KEY: z.string().min(1, "Clerk secret key is required"),
  NEON_DATABASE_URL: z.string().url("Invalid database URL"),
  MOCK_LLM_MODE: z
    .string()
    .optional()
    .transform((val) => val === "true"),
  HELIO_ADMIN_USER_ID: z.string().optional(),
});

// Image validation schemas
export const imageMetadataSchema = z.object({
  id: z.string().uuid().optional(),
  filename: z.string().min(1).max(255).optional(),
  size: z
    .number()
    .int()
    .min(0)
    .max(50 * 1024 * 1024), // 50MB max
  type: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp|bmp)$/i, "Invalid image type"),
  base64Data: z.string().min(1, "Base64 data is required"),
});

export const singleImageSchema = z.object({
  imageBase64: z
    .string()
    .min(1, "Image data is required")
    .refine((val) => {
      // Check if it's a valid base64 string (basic check)
      try {
        return btoa(atob(val)) === val;
      } catch {
        return /^[A-Za-z0-9+/]*={0,2}$/.test(val);
      }
    }, "Invalid base64 format"),
  mimeType: z
    .string()
    .regex(/^image\/(jpeg|jpg|png|gif|webp|bmp)$/i, "Invalid MIME type"),
  filename: z.string().max(255).optional(),
  size: z
    .number()
    .int()
    .min(0)
    .max(50 * 1024 * 1024)
    .optional(), // 50MB max
  name: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
});

export const multipleImagesSchema = z.object({
  images: z
    .array(
      z.object({
        base64: z
          .string()
          .min(1, "Image data is required")
          .refine((val) => {
            // Check if it's a valid base64 string (basic check)
            try {
              return btoa(atob(val)) === val;
            } catch {
              return /^[A-Za-z0-9+/]*={0,2}$/.test(val);
            }
          }, "Invalid base64 format"),
        mimeType: z
          .string()
          .regex(/^image\/(jpeg|jpg|png|gif|webp|bmp)$/i, "Invalid MIME type"),
        filename: z.string().max(255).optional(),
        size: z
          .number()
          .int()
          .min(0)
          .max(50 * 1024 * 1024)
          .optional(), // 50MB max
      }),
    )
    .min(1, "At least one image is required")
    .max(10, "Maximum 10 images allowed"),
  name: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
});

// Analysis history schemas
export const createAnalysisHistorySchema = z.object({
  analysisType: z.enum(["single", "multi"]),
  analysisResult: z.string().min(1, "Analysis result is required"),
  images: z.array(imageMetadataSchema).min(1, "At least one image is required"),
  metadata: z.record(z.string(), z.unknown()).optional(),
  name: z.string().max(255).optional(),
  description: z.string().max(1000).optional(),
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1))
    .optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().min(1).max(100))
    .optional(),
});

export const analysisHistoryQuerySchema = paginationSchema.extend({
  type: z.enum(["single", "multi"]).optional(),
  search: z.string().max(255).optional(),
});

// ID parameter validation
export const uuidSchema = z.string().uuid("Invalid UUID format");

// Security validation
export const sanitizeStringSchema = z.string().transform((val) => {
  // Remove potentially dangerous HTML/script tags
  return val
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<[^>]*>/g, "") // Remove all HTML tags
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .trim();
});

// Rate limiting schema
export const rateLimitSchema = z.object({
  windowMs: z.number().int().min(1000).max(3600000), // 1 second to 1 hour
  maxRequests: z.number().int().min(1).max(1000),
});

// File upload validation
export const fileUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine(
      (file) => file.size <= 50 * 1024 * 1024,
      "File size must be less than 50MB",
    )
    .refine(
      (file) => /^image\/(jpeg|jpg|png|gif|webp|bmp)$/i.test(file.type),
      "File must be a valid image format",
    ),
});

// CORS validation
export const corsOptionsSchema = z.object({
  origin: z
    .union([z.string().url(), z.array(z.string().url()), z.boolean()])
    .optional(),
  methods: z
    .array(z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]))
    .optional(),
  allowedHeaders: z.array(z.string()).optional(),
  credentials: z.boolean().optional(),
});

// Security headers schema
export const securityHeadersSchema = z.object({
  "Content-Security-Policy": z.string().optional(),
  "X-Frame-Options": z.enum(["DENY", "SAMEORIGIN"]).optional(),
  "X-Content-Type-Options": z.literal("nosniff").optional(),
  "Referrer-Policy": z
    .enum([
      "no-referrer",
      "no-referrer-when-downgrade",
      "origin",
      "origin-when-cross-origin",
      "same-origin",
      "strict-origin",
      "strict-origin-when-cross-origin",
      "unsafe-url",
    ])
    .optional(),
  "Permissions-Policy": z.string().optional(),
});

export type EnvSchema = z.infer<typeof envSchema>;
export type SingleImageSchema = z.infer<typeof singleImageSchema>;
export type MultipleImagesSchema = z.infer<typeof multipleImagesSchema>;
export type CreateAnalysisHistorySchema = z.infer<
  typeof createAnalysisHistorySchema
>;
export type AnalysisHistoryQuerySchema = z.infer<
  typeof analysisHistoryQuerySchema
>;
export type SecurityHeadersSchema = z.infer<typeof securityHeadersSchema>;
export type CorsOptionsSchema = z.infer<typeof corsOptionsSchema>;
