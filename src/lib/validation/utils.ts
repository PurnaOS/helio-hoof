import { type NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodSchema } from "zod";

// Standard API error response interface
export interface ApiError {
  error: string;
  details?: string[];
  code?: string;
  timestamp?: string;
}

// Standard API success response interface
export interface ApiResponse<T = unknown> {
  data?: T;
  success: boolean;
  message?: string;
  timestamp?: string;
}

// Error types for better error handling
export enum ApiErrorCode {
  VALIDATION_ERROR = "VALIDATION_ERROR",
  AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR",
  AUTHORIZATION_ERROR = "AUTHORIZATION_ERROR",
  NOT_FOUND = "NOT_FOUND",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
  FILE_TOO_LARGE = "FILE_TOO_LARGE",
  INVALID_FILE_TYPE = "INVALID_FILE_TYPE",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  DATABASE_ERROR = "DATABASE_ERROR",
  EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR",
}

// Create standardized error responses
export function createErrorResponse(
  error: string,
  status: number,
  code?: ApiErrorCode,
  details?: string[],
): NextResponse<ApiError> {
  const response: ApiError = {
    error,
    timestamp: new Date().toISOString(),
    ...(code && { code }),
    ...(details && { details }),
  };

  return NextResponse.json(response, { status });
}

// Create standardized success responses
export function createSuccessResponse<T>(
  data: T,
  message?: string,
  status: number = 200,
): NextResponse<ApiResponse<T>> {
  const response: ApiResponse<T> = {
    data,
    success: true,
    timestamp: new Date().toISOString(),
    ...(message && { message }),
  };

  return NextResponse.json(response, { status });
}

// Validation middleware wrapper
export function validateRequest<T>(schema: ZodSchema<T>) {
  return async (
    request: NextRequest,
  ): Promise<
    { data: T; error?: never } | { data?: never; error: NextResponse }
  > => {
    try {
      let body: unknown;

      // Handle different content types
      const contentType = request.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        try {
          body = await request.json();
        } catch {
          return {
            error: createErrorResponse(
              "Invalid JSON in request body",
              400,
              ApiErrorCode.VALIDATION_ERROR,
            ),
          };
        }
      } else if (contentType?.includes("multipart/form-data")) {
        const formData = await request.formData();
        body = Object.fromEntries(formData.entries());
      } else {
        return {
          error: createErrorResponse(
            "Unsupported content type",
            400,
            ApiErrorCode.VALIDATION_ERROR,
          ),
        };
      }

      const validatedData = schema.parse(body);
      return { data: validatedData };
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map(
          (err) => `${err.path.join(".")}: ${err.message}`,
        );
        return {
          error: createErrorResponse(
            "Validation failed",
            400,
            ApiErrorCode.VALIDATION_ERROR,
            details,
          ),
        };
      }

      return {
        error: createErrorResponse(
          "Request validation failed",
          400,
          ApiErrorCode.VALIDATION_ERROR,
        ),
      };
    }
  };
}

// Query parameter validation
export function validateQuery<T>(
  schema: ZodSchema<T>,
  searchParams: URLSearchParams,
): { data: T; error?: never } | { data?: never; error: NextResponse } {
  try {
    const query = Object.fromEntries(searchParams.entries());
    const validatedData = schema.parse(query);
    return { data: validatedData };
  } catch (error) {
    if (error instanceof ZodError) {
      const details = error.issues.map(
        (err) => `${err.path.join(".")}: ${err.message}`,
      );
      return {
        error: createErrorResponse(
          "Query parameter validation failed",
          400,
          ApiErrorCode.VALIDATION_ERROR,
          details,
        ),
      };
    }

    return {
      error: createErrorResponse(
        "Query validation failed",
        400,
        ApiErrorCode.VALIDATION_ERROR,
      ),
    };
  }
}

// Sanitization utilities
export function sanitizeString(input: string): string {
  return input
    .replace(/<script\b[^>]*>.*?<\/script>/gi, "") // Remove script tags completely (security)
    .replace(/javascript:/gi, "") // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, "") // Remove event handlers
    .replace(/<\s*\/?\s*[a-zA-Z][a-zA-Z0-9]*\s*[^<>]*>/g, "") // Remove HTML tags but keep content
    .replace(/[<>'"&]/g, (char) => {
      // Then escape any remaining dangerous characters
      const escapeMap: Record<string, string> = {
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#x27;",
        "&": "&amp;",
      };
      return escapeMap[char] || char;
    })
    .trim();
}

export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  visited = new WeakSet(),
): T {
  // Handle null and undefined
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Prevent circular references
  if (visited.has(obj)) {
    return {} as T;
  }
  visited.add(obj);

  const sanitized = { ...obj } as any;

  for (const [key, value] of Object.entries(sanitized)) {
    if (value === null || value === undefined) {
      // Keep null and undefined values as-is
    } else if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (value instanceof Date || value instanceof RegExp) {
      // Preserve Date and RegExp objects
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === "string"
          ? sanitizeString(item)
          : typeof item === "object" &&
              item !== null &&
              !(item instanceof Date) &&
              !(item instanceof RegExp)
            ? sanitizeObject(item as Record<string, unknown>, visited)
            : item,
      );
    } else if (
      typeof value === "object" &&
      value !== null &&
      !(value instanceof Date) &&
      !(value instanceof RegExp)
    ) {
      sanitized[key] = sanitizeObject(
        value as Record<string, unknown>,
        visited,
      );
    }
  }

  return sanitized;
}

// Image validation utilities
export function validateBase64Image(base64: string): boolean {
  try {
    // Check if it's a valid base64 string
    const decoded = atob(base64);
    return btoa(decoded) === base64;
  } catch {
    return false;
  }
}

export function getImageSizeFromBase64(base64: string): number {
  try {
    // Calculate approximate size of base64 string
    // Base64 adds ~33% overhead, so actual size is roughly 3/4 of base64 length
    return Math.round((base64.length * 3) / 4);
  } catch {
    return 0;
  }
}

export function validateImageType(mimeType: string): boolean {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/bmp",
  ];
  return allowedTypes.includes(mimeType.toLowerCase());
}

// Rate limiting utilities
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Export for testing purposes only
export const getRateLimitMapForTesting = () => rateLimitMap;
export const clearRateLimitMapForTesting = () => rateLimitMap.clear();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 100,
  windowMs: number = 60000,
): { allowed: boolean; remainingRequests: number; resetTime: number } {
  const now = Date.now();
  const key = identifier;

  const current = rateLimitMap.get(key);

  // If no entry exists or window has expired, create new entry
  if (!current || now > current.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return {
      allowed: true,
      remainingRequests: maxRequests - 1,
      resetTime: now + windowMs,
    };
  }

  // Increment count
  current.count += 1;

  // Check if limit exceeded
  if (current.count > maxRequests) {
    return {
      allowed: false,
      remainingRequests: 0,
      resetTime: current.resetTime,
    };
  }

  return {
    allowed: true,
    remainingRequests: maxRequests - current.count,
    resetTime: current.resetTime,
  };
}

// Cleanup old rate limit entries periodically
export function cleanupRateLimitMap(): void {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}

// CORS utilities
export function setCorsHeaders(
  response: NextResponse,
  origin?: string,
): NextResponse {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.NEXT_PUBLIC_APP_URL,
  ].filter(Boolean);

  // Check if origin is allowed
  const isAllowedOrigin =
    !origin ||
    allowedOrigins.some(
      (allowed) =>
        allowed &&
        (allowed === origin ||
          origin.endsWith(`.${allowed.replace(/^https?:\/\//, "")}`)),
    );

  if (isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin || "*");
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS",
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With",
  );
  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

// Security headers
export function setSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );

  // CSP for API routes
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none';",
  );

  return response;
}

// Error logging utility
export function logApiError(
  error: unknown,
  context: string,
  userId?: string,
): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    userId,
    error:
      error instanceof Error
        ? {
            name: error.name,
            message: error.message,
            stack: error.stack,
          }
        : error,
  };

  console.error(`[API Error] ${context}:`, errorInfo);

  // In production, you might want to send this to an external logging service
  if (process.env.NODE_ENV === "production") {
    // TODO: Send to external logging service (e.g., Sentry, LogRocket, etc.)
  }
}
