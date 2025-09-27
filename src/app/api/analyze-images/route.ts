import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { analyzeMultipleImages } from "@/lib/anthropic";
import { db, schema } from "@/lib/db";
import { logDevConfig, validateDevSetup } from "@/lib/dev-config";
import { multipleImagesSchema } from "@/lib/validation/schemas";
import {
  ApiErrorCode,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
  logApiError,
  sanitizeObject,
  setCorsHeaders,
  setSecurityHeaders,
  validateRequest,
} from "@/lib/validation/utils";

export async function POST(request: NextRequest) {
  let response: NextResponse;
  let userId: string | null = null;

  try {
    // Log development configuration
    logDevConfig();

    // Check authentication
    const authResult = await auth();
    userId = authResult.userId;
    if (!userId) {
      response = createErrorResponse(
        "Authentication required",
        401,
        ApiErrorCode.AUTHENTICATION_ERROR,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Rate limiting (stricter for multiple images)
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(
      `analyze-images:${userId}:${clientIP}`,
      20,
      60000,
    ); // 20 requests per minute

    if (!rateLimit.allowed) {
      response = createErrorResponse(
        "Rate limit exceeded. Please try again later.",
        429,
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
      );
      response.headers.set("X-RateLimit-Limit", "20");
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", rateLimit.resetTime.toString());
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Add rate limit headers
    const rateLimitHeaders = {
      "X-RateLimit-Limit": "20",
      "X-RateLimit-Remaining": rateLimit.remainingRequests.toString(),
      "X-RateLimit-Reset": rateLimit.resetTime.toString(),
    };

    // Validate setup
    const validation = validateDevSetup();
    if (!validation.valid) {
      logApiError(
        new Error(validation.message),
        "Configuration validation",
        userId || undefined,
      );
      response = createErrorResponse(
        `Configuration Error: ${validation.message}`,
        500,
        ApiErrorCode.INTERNAL_SERVER_ERROR,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Validate request body
    const validationResult =
      await validateRequest(multipleImagesSchema)(request);
    if (validationResult.error) {
      return setCorsHeaders(setSecurityHeaders(validationResult.error));
    }

    const validatedData = sanitizeObject(validationResult.data);
    const { images, name, description } = validatedData;

    // Debug logging to check what data we're receiving from frontend
    console.log("🔍 API analyze-images received (validated):", {
      imagesCount: images?.length || 0,
      name,
      description,
    });

    const result = await analyzeMultipleImages(images);

    if (!result.success) {
      logApiError(
        new Error(result.error || "Multiple images analysis failed"),
        "Multiple images analysis",
        userId || undefined,
      );
      response = createErrorResponse(
        result.error || "Failed to analyze images",
        500,
        ApiErrorCode.EXTERNAL_API_ERROR,
      );
      Object.entries(rateLimitHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Save analysis to history
    try {
      const imageMetadata = images.map(
        (
          img: {
            filename?: string;
            size?: number;
            mimeType: string;
            base64: string;
          },
          index: number,
        ) => ({
          id: crypto.randomUUID(),
          filename: img.filename || `image-${index + 1}`,
          size: img.size || 0,
          type: img.mimeType,
          base64Data: img.base64, // Save the base64 data for history reconstruction
        }),
      );

      // Handle name and description more explicitly
      const finalName = name?.trim()
        ? name.trim()
        : `Multi Image Analysis - ${new Date().toLocaleDateString()}`;
      const finalDescription = description?.trim() ? description.trim() : null;

      console.log("🔍 Multi-image database insertion values:", {
        name: name,
        nameType: typeof name,
        finalName,
        description: description,
        descriptionType: typeof description,
        finalDescription,
      });

      await db.insert(schema.analysisHistory).values({
        userId,
        name: finalName,
        description: finalDescription,
        analysisType: "multi",
        analysisResult: result.analysis,
        images: imageMetadata,
        imageCount: images.length,
        metadata: {
          processingTime: Date.now(),
          model: "claude-3-5-sonnet",
        },
      });
    } catch (dbError) {
      logApiError(dbError, "Database save", userId || undefined);
      // Don't fail the request if history saving fails
    }

    response = createSuccessResponse(
      {
        analysis: result.analysis,
      },
      "Images analyzed successfully",
    );

    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return setCorsHeaders(setSecurityHeaders(response));
  } catch (error) {
    logApiError(error, "Analyze images API", userId || undefined);
    response = createErrorResponse(
      "Internal server error",
      500,
      ApiErrorCode.INTERNAL_SERVER_ERROR,
    );
    return setCorsHeaders(setSecurityHeaders(response));
  }
}

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(
    setSecurityHeaders(response),
    request.headers.get("origin") || undefined,
  );
}
