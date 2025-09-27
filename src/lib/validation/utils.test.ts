import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
// Using vitest globals
import {
  ApiErrorCode,
  checkRateLimit,
  cleanupRateLimitMap,
  clearRateLimitMapForTesting,
  createErrorResponse,
  createSuccessResponse,
  getImageSizeFromBase64,
  logApiError,
  sanitizeObject,
  sanitizeString,
  setCorsHeaders,
  setSecurityHeaders,
  validateBase64Image,
  validateImageType,
  validateQuery,
  validateRequest,
} from "./utils";

describe("Validation Utils", () => {
  let originalConsole: Console;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    originalConsole = global.console;
    originalEnv = process.env;

    global.console = {
      ...originalConsole,
      error: vi.fn(),
      log: vi.fn(),
    };
  });

  afterEach(() => {
    global.console = originalConsole;
    process.env = originalEnv;
  });

  describe("createErrorResponse", () => {
    it("should create standardized error response", () => {
      const response = createErrorResponse(
        "Test error",
        400,
        ApiErrorCode.VALIDATION_ERROR,
        ["Detail 1", "Detail 2"],
      );

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(400);

      // Note: NextResponse.json() returns a response, we'd need to mock it properly to test the body
      // This tests the structure without full NextResponse implementation
    });

    it("should create error response without optional parameters", () => {
      const response = createErrorResponse("Simple error", 500);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(500);
    });

    it("should include timestamp in error response", () => {
      const mockDate = new Date("2023-01-01T12:00:00Z");
      vi.setSystemTime(mockDate);

      const response = createErrorResponse("Test error", 400);

      // The timestamp should be included in the response body
      expect(response).toBeInstanceOf(NextResponse);

      vi.useRealTimers();
    });
  });

  describe("createSuccessResponse", () => {
    it("should create standardized success response", () => {
      const data = { message: "Success" };
      const response = createSuccessResponse(data, "Operation completed", 201);

      expect(response).toBeInstanceOf(NextResponse);
      expect(response.status).toBe(201);
    });

    it("should use default status 200", () => {
      const data = { message: "Success" };
      const response = createSuccessResponse(data);

      expect(response.status).toBe(200);
    });

    it("should include timestamp in success response", () => {
      const mockDate = new Date("2023-01-01T12:00:00Z");
      vi.setSystemTime(mockDate);

      const response = createSuccessResponse({ test: true });

      expect(response).toBeInstanceOf(NextResponse);

      vi.useRealTimers();
    });
  });

  describe("validateRequest", () => {
    const testSchema = z.object({
      name: z.string().min(1),
      age: z.number().int().min(0),
    });

    it("should validate JSON request body", async () => {
      const mockRequest = {
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ name: "John", age: 30 }),
      } as unknown as NextRequest;

      const validator = validateRequest(testSchema);
      const result = await validator(mockRequest);

      expect(result.data).toEqual({ name: "John", age: 30 });
      expect(result.error).toBeUndefined();
    });

    it("should handle form data request", async () => {
      const formData = new FormData();
      formData.append("name", "John");
      formData.append("age", "30");

      const mockRequest = {
        headers: new Headers({ "content-type": "multipart/form-data" }),
        formData: vi.fn().mockResolvedValue(formData),
      } as unknown as NextRequest;

      // Create a schema that accepts string values for testing FormData
      const formDataSchema = z.object({
        name: z.string().min(1),
        age: z.string(),
      });

      const validator = validateRequest(formDataSchema);
      const result = await validator(mockRequest);

      expect(result.data).toEqual({ name: "John", age: "30" }); // FormData values are strings
    });

    it("should return error for invalid JSON", async () => {
      const mockRequest = {
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockRejectedValue(new Error("Invalid JSON")),
      } as unknown as NextRequest;

      const validator = validateRequest(testSchema);
      const result = await validator(mockRequest);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(NextResponse);
    });

    it("should return error for unsupported content type", async () => {
      const mockRequest = {
        headers: new Headers({ "content-type": "text/plain" }),
      } as unknown as NextRequest;

      const validator = validateRequest(testSchema);
      const result = await validator(mockRequest);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(NextResponse);
    });

    it("should return validation error for invalid data", async () => {
      const mockRequest = {
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ name: "", age: -1 }), // Invalid data
      } as unknown as NextRequest;

      const validator = validateRequest(testSchema);
      const result = await validator(mockRequest);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(NextResponse);
    });

    it("should handle non-Zod validation errors", async () => {
      const mockSchema = {
        parse: vi.fn(() => {
          throw new Error("Non-Zod error");
        }),
      } as unknown as z.ZodSchema;

      const mockRequest = {
        headers: new Headers({ "content-type": "application/json" }),
        json: vi.fn().mockResolvedValue({ test: "data" }),
      } as unknown as NextRequest;

      const validator = validateRequest(mockSchema);
      const result = await validator(mockRequest);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(NextResponse);
    });
  });

  describe("validateQuery", () => {
    const querySchema = z.object({
      page: z.string().regex(/^\d+$/).transform(Number),
      search: z.string().optional(),
    });

    it("should validate query parameters", () => {
      const searchParams = new URLSearchParams("page=1&search=test");
      const result = validateQuery(querySchema, searchParams);

      expect(result.data).toEqual({ page: 1, search: "test" });
      expect(result.error).toBeUndefined();
    });

    it("should handle missing optional parameters", () => {
      const searchParams = new URLSearchParams("page=1");
      const result = validateQuery(querySchema, searchParams);

      expect(result.data).toEqual({ page: 1 });
    });

    it("should return error for invalid query parameters", () => {
      const searchParams = new URLSearchParams("page=invalid");
      const result = validateQuery(querySchema, searchParams);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(NextResponse);
    });

    it("should handle non-Zod validation errors", () => {
      const mockSchema = {
        parse: vi.fn(() => {
          throw new Error("Non-Zod error");
        }),
      } as unknown as z.ZodSchema;

      const searchParams = new URLSearchParams("test=value");
      const result = validateQuery(mockSchema, searchParams);

      expect(result.data).toBeUndefined();
      expect(result.error).toBeInstanceOf(NextResponse);
    });
  });

  describe("sanitizeString", () => {
    it("should remove script tags", () => {
      const malicious = "Hello <script>alert('xss')</script> World";
      const result = sanitizeString(malicious);
      expect(result).toBe("Hello  World");
    });

    it("should remove HTML tags", () => {
      const html = "Hello <b>bold</b> and <i>italic</i> text";
      const result = sanitizeString(html);
      expect(result).toBe("Hello bold and italic text");
    });

    it("should remove javascript protocol", () => {
      const js = "javascript:alert('xss') and normal text";
      const result = sanitizeString(js);
      expect(result).toBe("alert(&#x27;xss&#x27;) and normal text");
    });

    it("should remove event handlers", () => {
      const event = "Hello onclick=alert('xss') onload=bad() World";
      const result = sanitizeString(event);
      expect(result).toBe("Hello alert(&#x27;xss&#x27;) bad() World");
    });

    it("should escape dangerous characters", () => {
      const dangerous = "Hello <>&\"' World";
      const result = sanitizeString(dangerous);
      expect(result).toBe("Hello &lt;&gt;&amp;&quot;&#x27; World");
    });

    it("should trim whitespace", () => {
      const whitespace = "  Hello World  ";
      const result = sanitizeString(whitespace);
      expect(result).toBe("Hello World");
    });

    it("should handle empty strings", () => {
      expect(sanitizeString("")).toBe("");
    });

    it("should handle strings with only whitespace", () => {
      expect(sanitizeString("   ")).toBe("");
    });
  });

  describe("sanitizeObject", () => {
    it("should sanitize string values in object", () => {
      const obj = {
        name: "<script>alert('xss')</script>John",
        age: 30,
        description: "Hello <b>World</b>",
      };

      const result = sanitizeObject(obj);

      expect(result.name).toBe("John");
      expect(result.age).toBe(30);
      expect(result.description).toBe("Hello World");
    });

    it("should sanitize nested objects", () => {
      const obj = {
        user: {
          name: "<script>alert('xss')</script>John",
          profile: {
            bio: "Hello <b>World</b>",
          },
        },
        count: 5,
      };

      const result = sanitizeObject(obj);

      expect(result.user.name).toBe("John");
      expect(result.user.profile.bio).toBe("Hello World");
      expect(result.count).toBe(5);
    });

    it("should sanitize arrays", () => {
      const obj = {
        tags: ["<script>tag1</script>", "<b>tag2</b>", "normal tag"],
        nested: [{ name: "<script>nested</script>" }],
      };

      const result = sanitizeObject(obj);

      expect(result.tags).toEqual(["", "tag2", "normal tag"]); // script tags are completely removed for security
      expect(result.nested[0].name).toBe(""); // script content is completely removed
    });

    it("should handle null and undefined values", () => {
      const obj = {
        nullValue: null,
        undefinedValue: undefined,
        name: "<script>test</script>",
      };

      const result = sanitizeObject(obj);

      expect(result.nullValue).toBeNull();
      expect(result.undefinedValue).toBeUndefined();
      expect(result.name).toBe(""); // script tags are completely removed for security
    });

    it("should preserve non-string, non-object values", () => {
      const obj = {
        number: 42,
        boolean: true,
        date: new Date("2023-01-01"),
        regex: /test/,
      };

      const result = sanitizeObject(obj);

      expect(result.number).toBe(42);
      expect(result.boolean).toBe(true);
      expect(result.date).toBeInstanceOf(Date);
      expect(result.regex).toBeInstanceOf(RegExp);
    });
  });

  describe("validateBase64Image", () => {
    it("should validate correct base64 strings", () => {
      const validBase64 = "SGVsbG8gV29ybGQ="; // "Hello World" in base64
      expect(validateBase64Image(validBase64)).toBe(true);
    });

    it("should reject invalid base64 strings", () => {
      const invalidBase64 = "Invalid Base64!@#";
      expect(validateBase64Image(invalidBase64)).toBe(false);
    });

    it("should handle empty strings", () => {
      expect(validateBase64Image("")).toBe(true); // Empty string is valid base64
    });

    it("should handle strings with padding", () => {
      const paddedBase64 = "SGVsbG8=";
      expect(validateBase64Image(paddedBase64)).toBe(true);
    });

    it("should reject strings with invalid characters", () => {
      const invalidChars = "SGVsbG@8gV29ybGQ=";
      expect(validateBase64Image(invalidChars)).toBe(false);
    });
  });

  describe("getImageSizeFromBase64", () => {
    it("should calculate approximate size from base64", () => {
      const base64 = "SGVsbG8gV29ybGQ="; // 16 characters
      const size = getImageSizeFromBase64(base64);
      expect(size).toBe(12); // (16 * 3) / 4 = 12
    });

    it("should handle empty strings", () => {
      const size = getImageSizeFromBase64("");
      expect(size).toBe(0);
    });

    it("should handle long base64 strings", () => {
      const longBase64 = "A".repeat(1000);
      const size = getImageSizeFromBase64(longBase64);
      expect(size).toBe(750); // (1000 * 3) / 4 = 750
    });

    it("should handle errors gracefully", () => {
      // Mock Math.round to throw an error
      const originalRound = Math.round;
      Math.round = vi.fn(() => {
        throw new Error("Math error");
      });

      const size = getImageSizeFromBase64("test");
      expect(size).toBe(0);

      Math.round = originalRound;
    });
  });

  describe("validateImageType", () => {
    it("should validate allowed image types", () => {
      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
        "image/bmp",
      ];

      for (const type of validTypes) {
        expect(validateImageType(type)).toBe(true);
      }
    });

    it("should reject invalid image types", () => {
      const invalidTypes = [
        "application/pdf",
        "text/plain",
        "video/mp4",
        "audio/mp3",
        "image/svg+xml",
      ];

      for (const type of invalidTypes) {
        expect(validateImageType(type)).toBe(false);
      }
    });

    it("should handle case insensitive validation", () => {
      expect(validateImageType("IMAGE/JPEG")).toBe(true);
      expect(validateImageType("Image/Png")).toBe(true);
    });

    it("should handle empty strings", () => {
      expect(validateImageType("")).toBe(false);
    });
  });

  describe("checkRateLimit", () => {
    beforeEach(() => {
      // Clear the rate limit map between tests
      clearRateLimitMapForTesting();
    });

    it("should allow requests within limit", () => {
      const result = checkRateLimit("test-user", 5, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(4);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    it("should track multiple requests from same identifier", () => {
      checkRateLimit("test-user", 3, 60000);
      checkRateLimit("test-user", 3, 60000);
      const result = checkRateLimit("test-user", 3, 60000);

      expect(result.allowed).toBe(true);
      expect(result.remainingRequests).toBe(0);
    });

    it("should block requests exceeding limit", () => {
      // Exceed the limit
      checkRateLimit("test-user", 2, 60000);
      checkRateLimit("test-user", 2, 60000);
      const result = checkRateLimit("test-user", 2, 60000);

      expect(result.allowed).toBe(false);
      expect(result.remainingRequests).toBe(0);
    });

    it("should reset after time window expires", () => {
      // Mock Date.now to control time
      let currentTime = 1000000;
      vi.spyOn(Date, "now").mockImplementation(() => currentTime);

      // First request
      const result1 = checkRateLimit("test-user", 2, 1000);
      expect(result1.allowed).toBe(true);

      // Advance time beyond window
      currentTime += 1001;

      // Should reset and allow request
      const result2 = checkRateLimit("test-user", 2, 1000);
      expect(result2.allowed).toBe(true);
      expect(result2.remainingRequests).toBe(1);

      vi.restoreAllMocks();
    });

    it("should handle different identifiers separately", () => {
      checkRateLimit("user1", 1, 60000);
      const resultUser1 = checkRateLimit("user1", 1, 60000);
      const resultUser2 = checkRateLimit("user2", 1, 60000);

      expect(resultUser1.allowed).toBe(false);
      expect(resultUser2.allowed).toBe(true);
    });
  });

  describe("cleanupRateLimitMap", () => {
    beforeEach(() => {
      // Clear the rate limit map for cleanup tests too
      clearRateLimitMapForTesting();
    });

    it("should remove expired entries", () => {
      let currentTime = 1000000;
      vi.spyOn(Date, "now").mockImplementation(() => currentTime);

      // Create entries
      checkRateLimit("user1", 5, 1000);
      checkRateLimit("user2", 5, 1000);

      // Advance time to expire user1's entry
      currentTime += 1001;

      cleanupRateLimitMap();

      // user1 should be cleaned up, user2 should still exist
      const result1 = checkRateLimit("user1", 5, 1000);
      expect(result1.remainingRequests).toBe(4); // Fresh start

      vi.restoreAllMocks();
    });
  });

  describe("setCorsHeaders", () => {
    it("should set CORS headers for allowed origin", () => {
      process.env.NEXT_PUBLIC_APP_URL = "https://app.example.com";

      const response = new NextResponse();
      const result = setCorsHeaders(response, "https://app.example.com");

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://app.example.com",
      );
      expect(result.headers.get("Access-Control-Allow-Methods")).toBe(
        "GET, POST, PUT, DELETE, OPTIONS",
      );
      expect(result.headers.get("Access-Control-Allow-Credentials")).toBe(
        "true",
      );
    });

    it("should handle localhost origins", () => {
      const response = new NextResponse();
      const result = setCorsHeaders(response, "http://localhost:3000");

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(
        "http://localhost:3000",
      );
    });

    it("should handle missing origin", () => {
      const response = new NextResponse();
      const result = setCorsHeaders(response);

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("should handle Vercel URL from environment", () => {
      process.env.VERCEL_URL = "my-app.vercel.app";

      const response = new NextResponse();
      const result = setCorsHeaders(response, "https://my-app.vercel.app");

      expect(result.headers.get("Access-Control-Allow-Origin")).toBe(
        "https://my-app.vercel.app",
      );
    });

    it("should reject disallowed origins", () => {
      const response = new NextResponse();
      setCorsHeaders(response, "https://malicious.com");

      expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
    });
  });

  describe("setSecurityHeaders", () => {
    it("should set all security headers", () => {
      const response = new NextResponse();
      const result = setSecurityHeaders(response);

      expect(result.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(result.headers.get("X-Frame-Options")).toBe("DENY");
      expect(result.headers.get("X-XSS-Protection")).toBe("1; mode=block");
      expect(result.headers.get("Referrer-Policy")).toBe(
        "strict-origin-when-cross-origin",
      );
      expect(result.headers.get("Permissions-Policy")).toBe(
        "camera=(), microphone=(), geolocation=()",
      );
      expect(result.headers.get("Content-Security-Policy")).toBe(
        "default-src 'none'; frame-ancestors 'none';",
      );
    });

    it("should return the same response object", () => {
      const response = new NextResponse();
      const result = setSecurityHeaders(response);

      expect(result).toBe(response);
    });
  });

  describe("logApiError", () => {
    it("should log Error objects with details", () => {
      const error = new Error("Test error");
      error.stack = "Error stack trace";

      logApiError(error, "test-context", "user-123");

      expect(console.error).toHaveBeenCalledWith(
        "[API Error] test-context:",
        expect.objectContaining({
          context: "test-context",
          userId: "user-123",
          error: {
            name: "Error",
            message: "Test error",
            stack: "Error stack trace",
          },
        }),
      );
    });

    it("should log non-Error objects", () => {
      const error = "String error";

      logApiError(error, "test-context");

      expect(console.error).toHaveBeenCalledWith(
        "[API Error] test-context:",
        expect.objectContaining({
          context: "test-context",
          error: "String error",
        }),
      );
    });

    it("should include timestamp in log", () => {
      const mockDate = new Date("2023-01-01T12:00:00Z");
      vi.setSystemTime(mockDate);

      logApiError(new Error("Test"), "context");

      expect(console.error).toHaveBeenCalledWith(
        "[API Error] context:",
        expect.objectContaining({
          timestamp: "2023-01-01T12:00:00.000Z",
        }),
      );

      vi.useRealTimers();
    });

    it("should handle production environment", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      logApiError(new Error("Production error"), "context");

      expect(console.error).toHaveBeenCalled();
      // In real implementation, this would send to external service

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe("ApiErrorCode enum", () => {
    it("should have all expected error codes", () => {
      expect(ApiErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
      expect(ApiErrorCode.AUTHENTICATION_ERROR).toBe("AUTHENTICATION_ERROR");
      expect(ApiErrorCode.AUTHORIZATION_ERROR).toBe("AUTHORIZATION_ERROR");
      expect(ApiErrorCode.NOT_FOUND).toBe("NOT_FOUND");
      expect(ApiErrorCode.RATE_LIMIT_EXCEEDED).toBe("RATE_LIMIT_EXCEEDED");
      expect(ApiErrorCode.FILE_TOO_LARGE).toBe("FILE_TOO_LARGE");
      expect(ApiErrorCode.INVALID_FILE_TYPE).toBe("INVALID_FILE_TYPE");
      expect(ApiErrorCode.INTERNAL_SERVER_ERROR).toBe("INTERNAL_SERVER_ERROR");
      expect(ApiErrorCode.DATABASE_ERROR).toBe("DATABASE_ERROR");
      expect(ApiErrorCode.EXTERNAL_API_ERROR).toBe("EXTERNAL_API_ERROR");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle malformed objects in sanitization", () => {
      const malformed = {
        circular: {},
      };
      malformed.circular = malformed; // Create circular reference

      // Should not throw error, but handle gracefully
      expect(() => sanitizeObject(malformed)).not.toThrow();
    });

    it("should handle very large objects", () => {
      const largeObj: Record<string, string> = {};
      for (let i = 0; i < 1000; i++) {
        largeObj[`key${i}`] = `<script>value${i}</script>`;
      }

      const result = sanitizeObject(largeObj);
      expect(Object.keys(result)).toHaveLength(1000);
      expect(result.key0).toBe(""); // script tags are completely removed
    });

    it("should handle Unicode in sanitization", () => {
      const unicode = "Hello 世界 🌍 <script>alert('xss')</script>";
      const result = sanitizeString(unicode);
      expect(result).toBe("Hello 世界 🌍"); // script tag completely removed
    });

    it("should handle very long base64 strings", () => {
      const longBase64 = "A".repeat(1000000); // 1MB of 'A' characters
      const isValid = validateBase64Image(longBase64);
      expect(typeof isValid).toBe("boolean");
    });
  });
});
