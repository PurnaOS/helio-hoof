import { type NextRequest, NextResponse } from "next/server";
import { checkEnvHealth, validateEnvSafe } from "@/lib/validation/env";
import {
  ApiErrorCode,
  createErrorResponse,
  createSuccessResponse,
  setCorsHeaders,
  setSecurityHeaders,
} from "@/lib/validation/utils";

export async function GET(_request: NextRequest) {
  try {
    // Check environment variables
    const envHealth = checkEnvHealth();
    const envValidation = validateEnvSafe();

    // Basic health checks
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version || "unknown",
      checks: {
        environment: {
          status: envHealth.valid ? "pass" : "fail",
          details: envHealth.valid
            ? "All required environment variables are present"
            : `Missing: ${envHealth.missing.join(", ")}`,
        },
        validation: {
          status: envValidation.success ? "pass" : "fail",
          details: envValidation.success
            ? "Environment validation passed"
            : envValidation.errors?.join(", "),
        },
        database: {
          status: process.env.NEON_DATABASE_URL ? "pass" : "fail",
          details: process.env.NEON_DATABASE_URL
            ? "Database URL configured"
            : "Database URL missing",
        },
        anthropic: {
          status: process.env.ANTHROPIC_API_KEY ? "pass" : "fail",
          details: process.env.ANTHROPIC_API_KEY
            ? "Anthropic API key configured"
            : "Anthropic API key missing",
        },
        clerk: {
          status: process.env.CLERK_SECRET_KEY ? "pass" : "fail",
          details: process.env.CLERK_SECRET_KEY
            ? "Clerk secret key configured"
            : "Clerk secret key missing",
        },
      },
    };

    // Determine overall status
    const allPassed = Object.values(health.checks).every(
      (check) => check.status === "pass",
    );
    health.status = allPassed ? "healthy" : "degraded";

    const statusCode = allPassed ? 200 : 503;

    const response = createSuccessResponse(
      health,
      "Health check completed",
      statusCode,
    );

    // Add cache control headers for health endpoint
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate",
    );
    response.headers.set("Pragma", "no-cache");
    response.headers.set("Expires", "0");

    return setCorsHeaders(setSecurityHeaders(response));
  } catch (error) {
    console.error("Health check error:", error);

    const response = createErrorResponse(
      "Health check failed",
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
