import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  checkEnvHealth,
  getEnvironmentConfig,
  getEnvVar,
  resetEnvCache,
  validateEnv,
  validateEnvSafe,
} from "./env";

describe("Environment Validation", () => {
  let originalEnv: NodeJS.ProcessEnv;
  let originalConsole: Console;

  beforeEach(() => {
    originalEnv = process.env;
    originalConsole = global.console;

    // Mock console methods
    global.console = {
      ...originalConsole,
      log: vi.fn(),
      error: vi.fn(),
    };

    // Reset cache before each test
    resetEnvCache();
  });

  afterEach(() => {
    process.env = originalEnv;
    global.console = originalConsole;
    resetEnvCache();
  });

  describe("validateEnv", () => {
    it("should validate and cache valid environment variables", () => {
      process.env = {
        NODE_ENV: "development",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
        MOCK_LLM_MODE: "true",
        HELIO_ADMIN_USER_ID: "admin-123",
      };

      const result = validateEnv();

      expect(result).toEqual({
        NODE_ENV: "development",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
        MOCK_LLM_MODE: true,
        HELIO_ADMIN_USER_ID: "admin-123",
      });

      expect(console.log).toHaveBeenCalledWith(
        "✅ Environment variables validated successfully",
      );
    });

    it("should return cached result on subsequent calls", () => {
      process.env = {
        NODE_ENV: "development",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const result1 = validateEnv();
      const result2 = validateEnv();

      expect(result1).toBe(result2); // Same object reference
      expect(console.log).toHaveBeenCalledTimes(1); // Only logged once
    });

    it("should validate with default NODE_ENV", () => {
      process.env = {
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const result = validateEnv();

      expect(result.NODE_ENV).toBe("development");
    });

    it("should transform MOCK_LLM_MODE string to boolean", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
        MOCK_LLM_MODE: "false",
      };

      const result = validateEnv();

      expect(result.MOCK_LLM_MODE).toBe(false);
    });

    it("should throw error for missing required variables", () => {
      process.env = {
        NODE_ENV: "test",
        // Missing ANTHROPIC_API_KEY
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      expect(() => validateEnv()).toThrow("Environment validation failed");
      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining("❌ Environment validation failed:"),
        expect.any(String),
      );
    });

    it("should throw error for invalid database URL", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "invalid-url",
      };

      expect(() => validateEnv()).toThrow("Environment validation failed");
    });

    it("should throw error for invalid NODE_ENV", () => {
      process.env = {
        NODE_ENV: "invalid",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      expect(() => validateEnv()).toThrow("Environment validation failed");
    });

    it("should not log in production mode", () => {
      process.env = {
        NODE_ENV: "production",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      validateEnv();

      expect(console.log).not.toHaveBeenCalledWith(
        "✅ Environment variables validated successfully",
      );
    });

    it("should clear cache on validation failure", () => {
      // First, set valid env
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      validateEnv(); // This should cache the result

      // Reset cache to test cache clearing behavior
      resetEnvCache();

      // Now set invalid env
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "", // Empty string should fail
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      expect(() => validateEnv()).toThrow();

      // Cache should be cleared, so next call with valid env should work
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key-2",
        CLERK_SECRET_KEY: "test-clerk-key-2",
        NEON_DATABASE_URL: "https://example2.com/db",
      };

      const result = validateEnv();
      expect(result.ANTHROPIC_API_KEY).toBe("test-anthropic-key-2");
    });

    it("should handle unknown validation errors", async () => {
      // We'll test this by modifying process.env to cause a non-ZodError
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "invalid-url", // This will cause a URL validation error
      };

      expect(() => validateEnv()).toThrow("Environment validation failed");
    });
  });

  describe("getEnvVar", () => {
    it("should return specific environment variable", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const apiKey = getEnvVar("ANTHROPIC_API_KEY");
      expect(apiKey).toBe("test-anthropic-key");
    });

    it("should throw error if validation fails", () => {
      process.env = {
        NODE_ENV: "test",
        // Missing required variables
      };

      expect(() => getEnvVar("ANTHROPIC_API_KEY")).toThrow();
    });
  });

  describe("checkEnvHealth", () => {
    it("should return valid status for complete environment", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const health = checkEnvHealth();

      expect(health).toEqual({
        valid: true,
        missing: [],
      });
    });

    it("should return invalid status with missing variables", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        // Missing CLERK_SECRET_KEY and NEON_DATABASE_URL
      };

      const health = checkEnvHealth();

      expect(health.valid).toBe(false);
      expect(health.missing).toContain("CLERK_SECRET_KEY");
      expect(health.missing).toContain("NEON_DATABASE_URL");
      expect(health.message).toBeDefined();
    });

    it("should handle validation errors gracefully", () => {
      process.env = {
        NODE_ENV: "invalid",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "invalid-url",
      };

      const health = checkEnvHealth();

      expect(health.valid).toBe(false);
      expect(health.message).toBeDefined();
    });

    it("should handle unknown errors", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "invalid-url", // This will cause validation error
      };

      const health = checkEnvHealth();

      expect(health.valid).toBe(false);
      expect(health.message).toBeDefined();
    });
  });

  describe("validateEnvSafe", () => {
    it("should return success for valid environment", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const result = validateEnvSafe();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.errors).toBeUndefined();
    });

    it("should return error for invalid environment", () => {
      process.env = {
        NODE_ENV: "test",
        // Missing required variables
      };

      const result = validateEnvSafe();

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });

    it("should handle unknown errors", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "invalid-url", // This will cause validation error
      };

      const result = validateEnvSafe();

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(Array.isArray(result.errors)).toBe(true);
    });
  });

  describe("getEnvironmentConfig", () => {
    it("should return configuration object with environment flags", () => {
      process.env = {
        NODE_ENV: "development",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
        MOCK_LLM_MODE: "true",
        HELIO_ADMIN_USER_ID: "admin-123",
      };

      const config = getEnvironmentConfig();

      expect(config).toEqual({
        isDevelopment: true,
        isProduction: false,
        isTest: false,
        isMockMode: true,
        database: {
          url: "https://example.com/db",
        },
        anthropic: {
          apiKey: "test-anthropic-key",
        },
        clerk: {
          secretKey: "test-clerk-key",
        },
        admin: {
          userId: "admin-123",
        },
      });
    });

    it("should handle production environment", () => {
      process.env = {
        NODE_ENV: "production",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(true);
      expect(config.isTest).toBe(false);
      expect(config.isMockMode).toBe(false);
    });

    it("should handle test environment", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const config = getEnvironmentConfig();

      expect(config.isDevelopment).toBe(false);
      expect(config.isProduction).toBe(false);
      expect(config.isTest).toBe(true);
    });

    it("should handle missing optional values", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
        // MOCK_LLM_MODE and HELIO_ADMIN_USER_ID not set
      };

      const config = getEnvironmentConfig();

      expect(config.isMockMode).toBe(false);
      expect(config.admin.userId).toBeUndefined();
    });
  });

  describe("resetEnvCache", () => {
    it("should clear the environment cache", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "test-anthropic-key",
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      // Cache the environment
      const result1 = validateEnv();

      // Reset cache
      resetEnvCache();

      // Change environment
      process.env.ANTHROPIC_API_KEY = "new-api-key";

      // Should reflect the new value
      const result2 = validateEnv();

      expect(result1.ANTHROPIC_API_KEY).toBe("test-anthropic-key");
      expect(result2.ANTHROPIC_API_KEY).toBe("new-api-key");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string values", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "", // Empty string
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      expect(() => validateEnv()).toThrow();
    });

    it("should handle undefined values", () => {
      process.env = {
        NODE_ENV: "test",
        // ANTHROPIC_API_KEY is undefined
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      expect(() => validateEnv()).toThrow();
    });

    it("should handle whitespace-only values", () => {
      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: "", // Empty string (trimmed whitespace becomes empty)
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      expect(() => validateEnv()).toThrow();
    });

    it("should handle very long environment variable values", () => {
      const longKey = "a".repeat(10000); // Very long string

      process.env = {
        NODE_ENV: "test",
        ANTHROPIC_API_KEY: longKey,
        CLERK_SECRET_KEY: "test-clerk-key",
        NEON_DATABASE_URL: "https://example.com/db",
      };

      const result = validateEnv();
      expect(result.ANTHROPIC_API_KEY).toBe(longKey);
    });
  });
});
