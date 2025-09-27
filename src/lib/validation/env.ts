import { type EnvSchema, envSchema } from "./schemas";

// Global environment variables cache
let envCache: EnvSchema | null = null;

/**
 * Validates and caches environment variables on first access
 * @returns Validated environment variables
 * @throws Error if validation fails
 */
export function validateEnv(): EnvSchema {
  if (envCache) {
    return envCache;
  }

  try {
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
      NEON_DATABASE_URL: process.env.NEON_DATABASE_URL,
      MOCK_LLM_MODE: process.env.MOCK_LLM_MODE,
      HELIO_ADMIN_USER_ID: process.env.HELIO_ADMIN_USER_ID,
    };

    envCache = envSchema.parse(env);

    // Log successful validation in development
    if (envCache.NODE_ENV === "development") {
      console.log("✅ Environment variables validated successfully");
    }

    return envCache;
  } catch (error) {
    // Clear cache on validation failure
    envCache = null;

    if (error instanceof Error) {
      console.error("❌ Environment validation failed:", error.message);
      throw new Error(`Environment validation failed: ${error.message}`);
    }

    throw new Error("Environment validation failed: Unknown error");
  }
}

/**
 * Get a specific environment variable with validation
 * @param key Environment variable key
 * @returns The validated environment variable value
 */
export function getEnvVar<K extends keyof EnvSchema>(key: K): EnvSchema[K] {
  const env = validateEnv();
  return env[key];
}

/**
 * Check if all required environment variables are present
 * @returns Object with validation status and missing variables
 */
export function checkEnvHealth(): {
  valid: boolean;
  missing: string[];
  message?: string;
} {
  try {
    validateEnv();
    return { valid: true, missing: [] };
  } catch (error) {
    const missingVars: string[] = [];

    // Check each required variable
    const requiredVars = [
      "ANTHROPIC_API_KEY",
      "CLERK_SECRET_KEY",
      "NEON_DATABASE_URL",
    ];

    for (const varName of requiredVars) {
      if (!process.env[varName]) {
        missingVars.push(varName);
      }
    }

    return {
      valid: false,
      missing: missingVars,
      message:
        error instanceof Error
          ? error.message
          : "Environment validation failed",
    };
  }
}

/**
 * Reset environment cache (useful for testing)
 */
export function resetEnvCache(): void {
  envCache = null;
}

/**
 * Validate environment in runtime with detailed error reporting
 * @returns Object with validation result and errors
 */
export function validateEnvSafe(): {
  success: boolean;
  data?: EnvSchema;
  errors?: string[];
} {
  try {
    const data = validateEnv();
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      errors:
        error instanceof Error ? [error.message] : ["Unknown validation error"],
    };
  }
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig() {
  const env = validateEnv();

  return {
    isDevelopment: env.NODE_ENV === "development",
    isProduction: env.NODE_ENV === "production",
    isTest: env.NODE_ENV === "test",
    isMockMode: env.MOCK_LLM_MODE || false,
    database: {
      url: env.NEON_DATABASE_URL,
    },
    anthropic: {
      apiKey: env.ANTHROPIC_API_KEY,
    },
    clerk: {
      secretKey: env.CLERK_SECRET_KEY,
    },
    admin: {
      userId: env.HELIO_ADMIN_USER_ID,
    },
  };
}
