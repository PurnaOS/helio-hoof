import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { type NextRequest, NextResponse } from "next/server";
import { db, schema } from "@/lib/db";
import { analysisHistoryQuerySchema } from "@/lib/validation/schemas";
import {
  ApiErrorCode,
  checkRateLimit,
  createErrorResponse,
  createSuccessResponse,
  logApiError,
  setCorsHeaders,
  setSecurityHeaders,
  validateQuery,
} from "@/lib/validation/utils";

// GET - Retrieve user's analysis history
export async function GET(request: NextRequest) {
  let response: NextResponse;
  let userId: string | null = null;

  try {
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
      `history:${userId}:${clientIP}`,
      100,
      60000,
    ); // 100 requests per minute

    if (!rateLimit.allowed) {
      response = createErrorResponse(
        "Rate limit exceeded. Please try again later.",
        429,
        ApiErrorCode.RATE_LIMIT_EXCEEDED,
      );
      return setCorsHeaders(setSecurityHeaders(response));
    }

    // Validate query parameters
    const url = new URL(request.url);
    const queryValidation = validateQuery(
      analysisHistoryQuerySchema,
      url.searchParams,
    );
    if (queryValidation.error) {
      return setCorsHeaders(setSecurityHeaders(queryValidation.error));
    }

    const { page = 1, limit = 50, type } = queryValidation.data;
    const offset = (page - 1) * limit;

    // Build where conditions
    const whereConditions = [eq(schema.analysisHistory.userId, userId)];

    // Add type filter if specified
    if (type) {
      whereConditions.push(eq(schema.analysisHistory.analysisType, type));
    }

    const query = db
      .select()
      .from(schema.analysisHistory)
      .where(and(...whereConditions))
      .orderBy(desc(schema.analysisHistory.createdAt))
      .limit(limit)
      .offset(offset);

    // Note: Search functionality would require a more complex query with text search
    // This is a simplified version
    const history = await query;

    response = createSuccessResponse(
      {
        history,
        pagination: {
          page,
          limit,
          hasMore: history.length === limit,
        },
      },
      "Analysis history retrieved successfully",
    );

    return setCorsHeaders(setSecurityHeaders(response));
  } catch (error) {
    logApiError(error, "Get analysis history", userId || undefined);
    response = createErrorResponse(
      "Failed to fetch analysis history",
      500,
      ApiErrorCode.DATABASE_ERROR,
    );
    return setCorsHeaders(setSecurityHeaders(response));
  }
}

// POST - Save new analysis to history
// TODO: Fix TypeScript compilation issue with schema.analysisHistory insert
/*
export async function POST(request: NextRequest) {
  let response: NextResponse;
  let userId: string | null = null;

  try {
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

    // Implementation temporarily disabled for build fix
    response = createErrorResponse(
      "Endpoint temporarily disabled",
      503,
      ApiErrorCode.INTERNAL_SERVER_ERROR,
    );
    return setCorsHeaders(setSecurityHeaders(response));
  } catch (error) {
    logApiError(error, "Save analysis history", userId || undefined);
    response = createErrorResponse(
      "Failed to save analysis",
      500,
      ApiErrorCode.DATABASE_ERROR,
    );
    return setCorsHeaders(setSecurityHeaders(response));
  }
}
*/

// Handle preflight requests
export async function OPTIONS(request: NextRequest) {
  const response = new NextResponse(null, { status: 200 });
  return setCorsHeaders(
    setSecurityHeaders(response),
    request.headers.get("origin") || undefined,
  );
}
