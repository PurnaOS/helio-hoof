import { auth } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";
import { analyzeImage } from "@/lib/anthropic";
import { db, schema } from "@/lib/db";
import { logDevConfig, validateDevSetup } from "@/lib/dev-config";
import { singleImageSchema } from "@/lib/validation/schemas";
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

    // Rate limiting
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(
      `analyze-image:${userId}:${clientIP}`,
      50,
      60000,
    ); // 50 requests per minute

    if (!rateLimit.allowed) {
      response = createErrorResponse(
        "Rate limit exceeded. Please try again later.",
        429,
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
      );
      response.headers.set("X-RateLimit-Limit", "50");
      response.headers.set("X-RateLimit-Remaining", "0");
      response.headers.set("X-RateLimit-Reset", rateLimit.resetTime.toString());
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Add rate limit headers
    const rateLimitHeaders = {
      "X-RateLimit-Limit": "50",
      "X-RateLimit-Remaining": rateLimit.remainingRequests.toString(),
      "X-RateLimit-Reset": rateLimit.resetTime.toString(),
    };

    // Validate setup
    const validation = validateDevSetup();
    if (!validation.valid) {
      logApiError(
        new Error(validation.message),
        "Configuration validation",
        userId,
      );
      response = createErrorResponse(
        `Configuration Error: ${validation.message}`,
        500,
        ApiErrorCode.INTERNAL_SERVER_ERROR,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Validate request body
    const validationResult = await validateRequest(singleImageSchema)(request);
    if (validationResult.error) {
      return setCorsHeaders(setSecurityHeaders(validationResult.error));
    }

    const validatedData = sanitizeObject(validationResult.data);
    const { imageBase64, mimeType, filename, size, name, description } =
      validatedData;

    // Debug logging to check what data we're receiving from frontend
    console.log("🔍 API analyze-image received (validated):", {
      hasImageBase64: !!imageBase64,
      mimeType,
      filename,
      size,
      name,
      description,
    });

    const result = await analyzeImage({
      imageBase64,
      mimeType,
    });

    if (!result.success) {
      logApiError(
        new Error(result.error || "Image analysis failed"),
        "Image analysis",
        userId,
      );
      response = createErrorResponse(
        result.error || "Failed to analyze image",
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
      const imageMetadata = {
        id: crypto.randomUUID(),
        filename: filename || "uploaded-image",
        size: size || 0,
        type: mimeType,
        base64Data: imageBase64, // Save the base64 data for history reconstruction
      };

      // Handle name and description more explicitly
      const finalName = name?.trim()
        ? name.trim()
        : `Single Image Analysis - ${new Date().toLocaleDateString()}`;
      const finalDescription = description?.trim() ? description.trim() : null;

      console.log("🔍 Database insertion values:", {
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
        analysisType: "single",
        analysisResult: result.analysis,
        images: [imageMetadata],
        imageCount: 1,
        metadata: {
          processingTime: Date.now(),
          model: "claude-3-5-sonnet",
        },
      });
    } catch (dbError) {
      logApiError(dbError, "Database save", userId);
      // Don't fail the request if history saving fails
    }

    response = createSuccessResponse(
      {
        analysis: result.analysis,
      },
      "Image analyzed successfully",
    );

    Object.entries(rateLimitHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return setCorsHeaders(setSecurityHeaders(response));
  } catch (error) {
    logApiError(error, "Analyze image API", userId || undefined);
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
