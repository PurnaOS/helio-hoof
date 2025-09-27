import { describe, expect, it } from "vitest";

// Test that all exports are available from the index file
describe("Validation Index Exports", () => {
  describe("Environment Validation Exports", () => {
    it("should export environment validation functions", async () => {
      const envModule = await import("./index");

      expect(envModule.validateEnv).toBeDefined();
      expect(envModule.getEnvVar).toBeDefined();
      expect(envModule.checkEnvHealth).toBeDefined();
      expect(envModule.resetEnvCache).toBeDefined();
      expect(envModule.validateEnvSafe).toBeDefined();
      expect(envModule.getEnvironmentConfig).toBeDefined();
    });
  });

  describe("Schema Exports", () => {
    it("should export all validation schemas", async () => {
      const schemaModule = await import("./index");

      expect(schemaModule.envSchema).toBeDefined();
      expect(schemaModule.imageMetadataSchema).toBeDefined();
      expect(schemaModule.singleImageSchema).toBeDefined();
      expect(schemaModule.multipleImagesSchema).toBeDefined();
      expect(schemaModule.createAnalysisHistorySchema).toBeDefined();
      expect(schemaModule.paginationSchema).toBeDefined();
      expect(schemaModule.analysisHistoryQuerySchema).toBeDefined();
      expect(schemaModule.uuidSchema).toBeDefined();
      expect(schemaModule.sanitizeStringSchema).toBeDefined();
      expect(schemaModule.rateLimitSchema).toBeDefined();
      expect(schemaModule.fileUploadSchema).toBeDefined();
      expect(schemaModule.corsOptionsSchema).toBeDefined();
      expect(schemaModule.securityHeadersSchema).toBeDefined();
    });
  });

  describe("Type Exports", () => {
    it("should export schema types", async () => {
      // Type exports are compile-time only, so we just check they exist at runtime
      const indexModule = await import("./index");

      // Verify the schemas exist (which proves the types are exported)
      expect(indexModule.envSchema).toBeDefined();
      expect(indexModule.singleImageSchema).toBeDefined();
      expect(indexModule.multipleImagesSchema).toBeDefined();
      expect(indexModule.createAnalysisHistorySchema).toBeDefined();
      expect(indexModule.analysisHistoryQuerySchema).toBeDefined();
      expect(indexModule.securityHeadersSchema).toBeDefined();
      expect(indexModule.corsOptionsSchema).toBeDefined();
    });

    it("should export utility types", async () => {
      // Type exports are compile-time only, so we just check the related runtime values exist
      const indexModule = await import("./index");

      expect(indexModule.createErrorResponse).toBeDefined();
      expect(indexModule.createSuccessResponse).toBeDefined();
      expect(indexModule.ApiErrorCode).toBeDefined();
    });
  });

  describe("Utility Function Exports", () => {
    it("should export response creation utilities", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.createErrorResponse).toBeDefined();
      expect(utilsModule.createSuccessResponse).toBeDefined();
    });

    it("should export validation utilities", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.validateRequest).toBeDefined();
      expect(utilsModule.validateQuery).toBeDefined();
    });

    it("should export sanitization utilities", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.sanitizeString).toBeDefined();
      expect(utilsModule.sanitizeObject).toBeDefined();
    });

    it("should export image validation utilities", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.validateBase64Image).toBeDefined();
      expect(utilsModule.getImageSizeFromBase64).toBeDefined();
      expect(utilsModule.validateImageType).toBeDefined();
    });

    it("should export rate limiting utilities", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.checkRateLimit).toBeDefined();
      expect(utilsModule.cleanupRateLimitMap).toBeDefined();
    });

    it("should export header utilities", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.setCorsHeaders).toBeDefined();
      expect(utilsModule.setSecurityHeaders).toBeDefined();
    });

    it("should export logging utilities", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.logApiError).toBeDefined();
    });

    it("should export ApiErrorCode enum", async () => {
      const utilsModule = await import("./index");

      expect(utilsModule.ApiErrorCode).toBeDefined();
      expect(utilsModule.ApiErrorCode.VALIDATION_ERROR).toBe(
        "VALIDATION_ERROR",
      );
      expect(utilsModule.ApiErrorCode.AUTHENTICATION_ERROR).toBe(
        "AUTHENTICATION_ERROR",
      );
      expect(utilsModule.ApiErrorCode.RATE_LIMIT_EXCEEDED).toBe(
        "RATE_LIMIT_EXCEEDED",
      );
    });
  });

  describe("Integration Tests", () => {
    it("should allow using exported functions together", async () => {
      const {
        validateEnv,
        createSuccessResponse,
        sanitizeString,
        validateBase64Image,
      } = await import("./index");

      // Test that functions can be called (basic integration)
      expect(typeof validateEnv).toBe("function");
      expect(typeof createSuccessResponse).toBe("function");
      expect(typeof sanitizeString).toBe("function");
      expect(typeof validateBase64Image).toBe("function");

      // Test basic functionality
      const sanitized = sanitizeString("Hello <script>alert('xss')</script>");
      expect(sanitized).toBe("Hello");

      const isValidBase64 = validateBase64Image("SGVsbG8=");
      expect(isValidBase64).toBe(true);
    });

    it("should allow schema validation from exports", async () => {
      const { uuidSchema, sanitizeStringSchema } = await import("./index");

      // Test schema exports work
      const validUuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(() => uuidSchema.parse(validUuid)).not.toThrow();

      const sanitizedString = sanitizeStringSchema.parse(
        "Hello <script>test</script>",
      );
      expect(sanitizedString).toBe("Hello");
    });

    it("should provide complete validation pipeline", async () => {
      process.env.NODE_ENV = "test";
      process.env.ANTHROPIC_API_KEY = "test-key";
      process.env.CLERK_SECRET_KEY = "test-key";
      process.env.NEON_DATABASE_URL = "https://example.com/db";

      const {
        validateEnv,
        getEnvironmentConfig,
        resetEnvCache,
        singleImageSchema,
        createSuccessResponse,
        ApiErrorCode,
      } = await import("./index");

      // Reset cache to ensure fresh validation
      resetEnvCache();

      // Test complete validation pipeline
      const env = validateEnv();
      expect(env.NODE_ENV).toBe("test");

      const config = getEnvironmentConfig();
      expect(config.isTest).toBe(true);

      // Test image validation
      const imageData = {
        imageBase64: "SGVsbG8gV29ybGQ=",
        mimeType: "image/jpeg",
      };
      expect(() => singleImageSchema.parse(imageData)).not.toThrow();

      // Test response creation
      const response = createSuccessResponse({ message: "Success" });
      expect(response.status).toBe(200);

      // Test error code availability
      expect(ApiErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    });
  });

  describe("Module Structure", () => {
    it("should not export unexpected properties", async () => {
      const validationModule = await import("./index");

      // Get all exported keys
      const exportedKeys = Object.keys(validationModule);

      // Expected exports (this helps catch accidental exports)
      const expectedExports = [
        // Environment validation
        "validateEnv",
        "getEnvVar",
        "checkEnvHealth",
        "resetEnvCache",
        "validateEnvSafe",
        "getEnvironmentConfig",
        // Schemas
        "envSchema",
        "imageMetadataSchema",
        "singleImageSchema",
        "multipleImagesSchema",
        "createAnalysisHistorySchema",
        "paginationSchema",
        "analysisHistoryQuerySchema",
        "uuidSchema",
        "sanitizeStringSchema",
        "rateLimitSchema",
        "fileUploadSchema",
        "corsOptionsSchema",
        "securityHeadersSchema",
        // Utilities
        "createErrorResponse",
        "createSuccessResponse",
        "validateRequest",
        "validateQuery",
        "sanitizeString",
        "sanitizeObject",
        "validateBase64Image",
        "getImageSizeFromBase64",
        "validateImageType",
        "checkRateLimit",
        "cleanupRateLimitMap",
        "getRateLimitMapForTesting",
        "clearRateLimitMapForTesting",
        "setCorsHeaders",
        "setSecurityHeaders",
        "logApiError",
        "ApiErrorCode",
      ];

      // Check that we don't have unexpected exports
      for (const key of exportedKeys) {
        expect(expectedExports).toContain(key);
      }

      // Check that we have all expected exports
      for (const expected of expectedExports) {
        expect(exportedKeys).toContain(expected);
      }
    });

    it("should maintain consistent export structure", async () => {
      const validationModule = await import("./index");

      // Test that functions are actually functions
      const functionExports = [
        "validateEnv",
        "getEnvVar",
        "checkEnvHealth",
        "resetEnvCache",
        "validateEnvSafe",
        "getEnvironmentConfig",
        "createErrorResponse",
        "createSuccessResponse",
        "validateRequest",
        "validateQuery",
        "sanitizeString",
        "sanitizeObject",
        "validateBase64Image",
        "getImageSizeFromBase64",
        "validateImageType",
        "checkRateLimit",
        "cleanupRateLimitMap",
        "setCorsHeaders",
        "setSecurityHeaders",
        "logApiError",
      ];

      for (const funcName of functionExports) {
        expect(typeof validationModule[funcName]).toBe("function");
      }

      // Test that schemas have parse method (Zod schemas)
      const schemaExports = [
        "envSchema",
        "imageMetadataSchema",
        "singleImageSchema",
        "multipleImagesSchema",
        "createAnalysisHistorySchema",
        "paginationSchema",
        "analysisHistoryQuerySchema",
        "uuidSchema",
        "sanitizeStringSchema",
        "rateLimitSchema",
        "fileUploadSchema",
        "corsOptionsSchema",
        "securityHeadersSchema",
      ];

      for (const schemaName of schemaExports) {
        expect(typeof validationModule[schemaName].parse).toBe("function");
      }

      // Test that ApiErrorCode is an object with string values
      expect(typeof validationModule.ApiErrorCode).toBe("object");
      expect(typeof validationModule.ApiErrorCode.VALIDATION_ERROR).toBe(
        "string",
      );
    });
  });

  describe("Re-export Verification", () => {
    it("should re-export functions from env module correctly", async () => {
      const indexModule = await import("./index");
      const envModule = await import("./env");

      expect(indexModule.validateEnv).toBe(envModule.validateEnv);
      expect(indexModule.getEnvVar).toBe(envModule.getEnvVar);
      expect(indexModule.checkEnvHealth).toBe(envModule.checkEnvHealth);
      expect(indexModule.resetEnvCache).toBe(envModule.resetEnvCache);
      expect(indexModule.validateEnvSafe).toBe(envModule.validateEnvSafe);
      expect(indexModule.getEnvironmentConfig).toBe(
        envModule.getEnvironmentConfig,
      );
    });

    it("should re-export schemas from schemas module correctly", async () => {
      const indexModule = await import("./index");
      const schemasModule = await import("./schemas");

      expect(indexModule.envSchema).toBe(schemasModule.envSchema);
      expect(indexModule.singleImageSchema).toBe(
        schemasModule.singleImageSchema,
      );
      expect(indexModule.multipleImagesSchema).toBe(
        schemasModule.multipleImagesSchema,
      );
      expect(indexModule.uuidSchema).toBe(schemasModule.uuidSchema);
    });

    it("should re-export utilities from utils module correctly", async () => {
      const indexModule = await import("./index");
      const utilsModule = await import("./utils");

      expect(indexModule.createErrorResponse).toBe(
        utilsModule.createErrorResponse,
      );
      expect(indexModule.createSuccessResponse).toBe(
        utilsModule.createSuccessResponse,
      );
      expect(indexModule.validateRequest).toBe(utilsModule.validateRequest);
      expect(indexModule.sanitizeString).toBe(utilsModule.sanitizeString);
      expect(indexModule.ApiErrorCode).toBe(utilsModule.ApiErrorCode);
    });
  });
});
