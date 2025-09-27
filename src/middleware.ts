import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { type NextRequest, NextResponse } from "next/server";

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/analysis(.*)",
  "/api/analyze-image",
  "/api/analyze-images",
  "/api/analysis-history(.*)",
]);

/**
 * Security headers configuration
 */
function setSecurityHeaders(response: NextResponse): NextResponse {
  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Enable XSS protection (legacy browsers)
  response.headers.set("X-XSS-Protection", "1; mode=block");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Feature policy / permissions policy
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=(), gyroscope=(), magnetometer=(), accelerometer=()",
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.clerk.dev https://*.clerk.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https: http:",
    "connect-src 'self' https://*.clerk.dev https://*.clerk.com https://api.anthropic.com https://*.neon.tech wss://*.neon.tech",
    "frame-src 'self' https://*.clerk.dev https://*.clerk.com",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "media-src 'self'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "upgrade-insecure-requests",
  ].join("; ");

  response.headers.set("Content-Security-Policy", csp);

  // Strict Transport Security (only in production with HTTPS)
  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload",
    );
  }

  return response;
}

/**
 * CORS configuration
 */
function setCorsHeaders(response: NextResponse, origin?: string): NextResponse {
  const allowedOrigins = [
    "http://localhost:3000",
    "https://localhost:3000",
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NODE_ENV === "development" ? "http://127.0.0.1:3000" : null,
  ].filter(Boolean) as string[];

  // Check if origin is allowed
  const isAllowedOrigin =
    !origin ||
    allowedOrigins.some(
      (allowed) =>
        allowed === origin ||
        origin.endsWith(`.${allowed.replace(/^https?:\/\//, "")}`),
    );

  if (isAllowedOrigin && origin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
  } else if (!origin) {
    // For same-origin requests
    response.headers.set("Access-Control-Allow-Origin", "*");
  }

  response.headers.set(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, PATCH, OPTIONS",
  );

  response.headers.set(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With, Accept, Origin, X-CSRF-Token",
  );

  response.headers.set("Access-Control-Allow-Credentials", "true");
  response.headers.set("Access-Control-Max-Age", "86400"); // 24 hours

  return response;
}

/**
 * Handle preflight requests
 */
function handlePreflight(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  const origin = request.headers.get("origin");

  setCorsHeaders(response, origin || undefined);
  setSecurityHeaders(response);

  return response;
}

/**
 * Rate limiting per IP
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkGlobalRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 1000; // 1000 requests per minute per IP

  const current = rateLimitMap.get(ip);

  // Clean up expired entries
  if (!current || now > current.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  current.count += 1;

  if (current.count > maxRequests) {
    return false;
  }

  return true;
}

// Clean up rate limit map periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of rateLimitMap.entries()) {
    if (now > value.resetTime) {
      rateLimitMap.delete(key);
    }
  }
}, 60000); // Clean up every minute

export default clerkMiddleware(async (auth, req) => {
  // Handle preflight requests first
  if (req.method === "OPTIONS") {
    return handlePreflight(req);
  }

  // Get client IP for rate limiting
  const ip =
    req.headers.get("x-forwarded-for") ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") || // Cloudflare
    "unknown";

  // Global rate limiting
  if (!checkGlobalRateLimit(ip)) {
    const response = new NextResponse(
      JSON.stringify({
        error: "Too many requests",
        code: "RATE_LIMIT_EXCEEDED",
        message: "Please slow down and try again later",
      }),
      {
        status: 429,
        headers: { "Content-Type": "application/json" },
      },
    );

    return setCorsHeaders(
      setSecurityHeaders(response),
      req.headers.get("origin") || undefined,
    );
  }

  // Protect routes that require authentication
  if (isProtectedRoute(req)) {
    await auth.protect({
      // Redirect to waitlist instead of default sign-in
      unauthenticatedUrl: "/waitlist",
    });
  }

  // Continue with the request
  const response = NextResponse.next();

  // Add security and CORS headers to all responses
  setCorsHeaders(response, req.headers.get("origin") || undefined);
  setSecurityHeaders(response);

  // Add custom headers for monitoring
  response.headers.set("X-Request-ID", crypto.randomUUID());
  response.headers.set("X-Timestamp", new Date().toISOString());

  // Add environment info (non-sensitive)
  if (process.env.NODE_ENV === "development") {
    response.headers.set("X-Environment", "development");
  }

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
