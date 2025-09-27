/**
 * Environment configuration management for Helio-Hoof
 * Provides type-safe access to environment variables across different deployment environments
 */

export type Environment = "development" | "test" | "staging" | "production";

export interface EnvironmentConfig {
  // Core application
  NODE_ENV: string;
  APP_URL: string;
  API_URL: string;

  // Authentication
  CLERK_PUBLISHABLE_KEY: string;
  CLERK_SECRET_KEY?: string;
  CLERK_WEBHOOK_SECRET?: string;

  // Database
  DATABASE_URL?: string;
  DIRECT_URL?: string;

  // AI Services
  ANTHROPIC_API_KEY?: string;

  // Feature flags
  ENABLE_ANALYTICS: boolean;
  ENABLE_ERROR_REPORTING: boolean;
  ENABLE_PERFORMANCE_MONITORING: boolean;

  // Security
  NEXTAUTH_SECRET?: string;
  NEXTAUTH_URL: string;

  // Monitoring
  SENTRY_DSN?: string;
  SENTRY_ORG?: string;
  SENTRY_PROJECT?: string;
}

/**
 * Get the current environment
 */
export function getEnvironment(): Environment {
  const env = process.env.NODE_ENV as Environment;

  if (!env || !["development", "test", "staging", "production"].includes(env)) {
    return "development";
  }

  return env;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return getEnvironment() === "production";
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return getEnvironment() === "development";
}

/**
 * Check if running in test environment
 */
export function isTest(): boolean {
  return getEnvironment() === "test";
}

/**
 * Check if running in staging
 */
export function isStaging(): boolean {
  return getEnvironment() === "staging";
}

/**
 * Get environment-specific configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const env = getEnvironment();

  // Base configuration that applies to all environments
  const baseConfig: EnvironmentConfig = {
    NODE_ENV: env,
    APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
    API_URL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api",
    CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || "",
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === "true",
    ENABLE_ERROR_REPORTING:
      process.env.NEXT_PUBLIC_ENABLE_ERROR_REPORTING === "true",
    ENABLE_PERFORMANCE_MONITORING:
      process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING === "true",
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    NEXTAUTH_URL:
      process.env.NEXTAUTH_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "http://localhost:3000",
    SENTRY_DSN: process.env.SENTRY_DSN,
    SENTRY_ORG: process.env.SENTRY_ORG,
    SENTRY_PROJECT: process.env.SENTRY_PROJECT,
  };

  // Environment-specific overrides
  switch (env) {
    case "production":
      return {
        ...baseConfig,
        ENABLE_ANALYTICS: true,
        ENABLE_ERROR_REPORTING: true,
        ENABLE_PERFORMANCE_MONITORING: true,
      };

    case "staging":
      return {
        ...baseConfig,
        ENABLE_ANALYTICS: false,
        ENABLE_ERROR_REPORTING: true,
        ENABLE_PERFORMANCE_MONITORING: false,
      };

    case "test":
      return {
        ...baseConfig,
        APP_URL: "http://localhost:3000",
        API_URL: "http://localhost:3000/api",
        ENABLE_ANALYTICS: false,
        ENABLE_ERROR_REPORTING: false,
        ENABLE_PERFORMANCE_MONITORING: false,
      };

    default:
      return {
        ...baseConfig,
        ENABLE_ANALYTICS: false,
        ENABLE_ERROR_REPORTING: false,
        ENABLE_PERFORMANCE_MONITORING: false,
      };
  }
}

/**
 * Validate required environment variables
 */
export function validateEnvironmentConfig(): {
  valid: boolean;
  missing: string[];
  errors: string[];
} {
  const config = getEnvironmentConfig();
  const env = getEnvironment();
  const missing: string[] = [];
  const errors: string[] = [];

  // Required in all environments
  if (!config.CLERK_PUBLISHABLE_KEY) {
    missing.push("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY");
  }

  // Required in non-development environments
  if (env !== "development" && env !== "test") {
    if (!config.CLERK_SECRET_KEY) {
      missing.push("CLERK_SECRET_KEY");
    }

    if (!config.DATABASE_URL) {
      missing.push("DATABASE_URL");
    }

    if (!config.NEXTAUTH_SECRET) {
      missing.push("NEXTAUTH_SECRET");
    }
  }

  // Required in production
  if (env === "production") {
    if (!config.ANTHROPIC_API_KEY) {
      missing.push("ANTHROPIC_API_KEY");
    }

    if (!config.SENTRY_DSN) {
      missing.push("SENTRY_DSN");
    }
  }

  // Validate URL formats
  try {
    new URL(config.APP_URL);
  } catch {
    errors.push(`Invalid APP_URL format: ${config.APP_URL}`);
  }

  try {
    new URL(config.API_URL);
  } catch {
    errors.push(`Invalid API_URL format: ${config.API_URL}`);
  }

  return {
    valid: missing.length === 0 && errors.length === 0,
    missing,
    errors,
  };
}

/**
 * Get database configuration for Drizzle
 */
export function getDatabaseConfig() {
  const config = getEnvironmentConfig();

  if (!config.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }

  return {
    connectionString: config.DATABASE_URL,
    directUrl: config.DIRECT_URL,
  };
}

/**
 * Get Clerk configuration
 */
export function getClerkConfig() {
  const config = getEnvironmentConfig();

  return {
    publishableKey: config.CLERK_PUBLISHABLE_KEY,
    secretKey: config.CLERK_SECRET_KEY,
    webhookSecret: config.CLERK_WEBHOOK_SECRET,
  };
}

/**
 * Get monitoring configuration
 */
export function getMonitoringConfig() {
  const config = getEnvironmentConfig();

  return {
    sentry: {
      dsn: config.SENTRY_DSN,
      org: config.SENTRY_ORG,
      project: config.SENTRY_PROJECT,
      enabled: config.ENABLE_ERROR_REPORTING,
    },
    analytics: {
      enabled: config.ENABLE_ANALYTICS,
    },
    performance: {
      enabled: config.ENABLE_PERFORMANCE_MONITORING,
    },
  };
}
