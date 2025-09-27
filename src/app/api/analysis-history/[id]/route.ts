import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { uuidSchema } from "@/lib/validation/schemas";
import {
  ApiErrorCode,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
  logApiError,
  setCorsHeaders,
  setSecurityHeaders,
} from "@/lib/validation/utils";

// GET - Retrieve specific analysis by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let response: NextResponse;
  let userId: string | null = null;

  try {
    const { userId: authUserId } = await auth();
    userId = authUserId;

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
      `get-analysis:${userId}:${clientIP}`,
      200,
      60000,
    ); // 200 requests per minute

    if (!rateLimit.allowed) {
      response = createErrorResponse(
        "Rate limit exceeded. Please try again later.",
        429,
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    const { id } = await params;

    // Validate UUID format
    try {
      uuidSchema.parse(id);
    } catch {
      response = createErrorResponse(
        "Invalid analysis ID format",
        400,
        ApiErrorCode.VALIDATION_ERROR,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    const analysis = await db
      .select()
      .from(schema.analysisHistory)
      .where(
        and(
          eq(schema.analysisHistory.id, id),
          eq(schema.analysisHistory.userId, userId),
        ),
      )
      .limit(1);

    if (analysis.length === 0) {
      response = createErrorResponse(
        "Analysis not found",
        404,
        ApiErrorCode.NOT_FOUND,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    response = createSuccessResponse(
      {
        analysis: analysis[0],
      },
      "Analysis retrieved successfully",
    );

    return setCorsHeaders(setSecurityHeaders(response));
  } catch (error) {
    logApiError(error, "Get analysis by ID", userId || undefined);
    response = createErrorResponse(
      "Failed to fetch analysis",
      500,
      ApiErrorCode.DATABASE_ERROR,
    );
    return setCorsHeaders(setSecurityHeaders(response));
  }
}

// DELETE - Delete specific analysis
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  let response: NextResponse;
  let userId: string | null = null;

  try {
    const { userId: authUserId } = await auth();
    userId = authUserId;

    if (!userId) {
      response = createErrorResponse(
        "Authentication required",
        401,
        ApiErrorCode.AUTHENTICATION_ERROR,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Rate limiting (stricter for delete operations)
    const clientIP =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const rateLimit = checkRateLimit(
      `delete-analysis:${userId}:${clientIP}`,
      50,
      60000,
    ); // 50 requests per minute

    if (!rateLimit.allowed) {
      response = createErrorResponse(
        "Rate limit exceeded. Please try again later.",
        429,
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    const { id } = await params;

    // Validate UUID format
    try {
      uuidSchema.parse(id);
    } catch {
      response = createErrorResponse(
        "Invalid analysis ID format",
        400,
        ApiErrorCode.VALIDATION_ERROR,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    const result = await db
      .delete(schema.analysisHistory)
      .where(
        and(
          eq(schema.analysisHistory.id, id),
          eq(schema.analysisHistory.userId, userId),
        ),
      )
      .returning();

    if (result.length === 0) {
      response = createErrorResponse(
        "Analysis not found",
        404,
        ApiErrorCode.NOT_FOUND,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    response = createSuccessResponse(null, "Analysis deleted successfully");

    return setCorsHeaders(setSecurityHeaders(response));
  } catch (error) {
    logApiError(error, "Delete analysis by ID", userId || undefined);
    response = createErrorResponse(
      "Failed to delete analysis",
      500,
      ApiErrorCode.DATABASE_ERROR,
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
