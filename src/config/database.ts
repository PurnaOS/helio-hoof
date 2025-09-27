/**
 * Database configuration for Neon PostgreSQL across environments
 * Manages connection pooling, migrations, and environment-specific settings
 */

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import {
  getDatabaseConfig,
  getEnvironment,
  isProduction,
} from "./environments";

// Configure Neon for optimal performance
neonConfig.fetchConnectionCache = true;
neonConfig.useSecureWebSocket = isProduction();

export interface DatabaseEnvironmentConfig {
  connectionString: string;
  directUrl?: string;
  poolConfig: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
    connectionTimeoutMillis: number;
  };
  ssl: boolean;
  schema: string;
  migrations: {
    folder: string;
    table: string;
  };
}

/**
 * Get database configuration for the current environment
 */
export function getDatabaseEnvironmentConfig(): DatabaseEnvironmentConfig {
  const environment = getEnvironment();
  const config = getDatabaseConfig();

  const baseConfig: DatabaseEnvironmentConfig = {
    connectionString: config.connectionString,
    directUrl: config.directUrl,
    poolConfig: {
      max: 10,
      min: 2,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    },
    ssl: true,
    schema: "public",
    migrations: {
      folder: "./migrations",
      table: "__drizzle_migrations",
    },
  };

  // Environment-specific configurations
  switch (environment) {
    case "production":
      return {
        ...baseConfig,
        poolConfig: {
          max: 20, // Higher pool size for production
          min: 5,
          idleTimeoutMillis: 60000,
          connectionTimeoutMillis: 15000,
        },
        ssl: true,
      };

    case "staging":
      return {
        ...baseConfig,
        poolConfig: {
          max: 15,
          min: 3,
          idleTimeoutMillis: 45000,
          connectionTimeoutMillis: 12000,
        },
        ssl: true,
      };

    case "development":
      return {
        ...baseConfig,
        poolConfig: {
          max: 5,
          min: 1,
          idleTimeoutMillis: 15000,
          connectionTimeoutMillis: 8000,
        },
        ssl: false, // Can be disabled for local development if needed
      };

    case "test":
      return {
        ...baseConfig,
        poolConfig: {
          max: 3,
          min: 1,
          idleTimeoutMillis: 10000,
          connectionTimeoutMillis: 5000,
        },
        ssl: false,
        schema: "test",
      };

    default:
      return baseConfig;
  }
}

/**
 * Create database connection
 */
export function createDatabaseConnection() {
  const config = getDatabaseEnvironmentConfig();

  if (!config.connectionString) {
    throw new Error("Database connection string is required");
  }

  // Create Neon connection
  const sql = neon(config.connectionString);

  // Create Drizzle instance
  const db = drizzle(sql);

  return { db, sql };
}

/**
 * Database health check
 */
export async function checkDatabaseHealth() {
  try {
    const { sql } = createDatabaseConnection();

    // Simple connectivity test
    const result = await sql`SELECT 1 as health_check, NOW() as timestamp`;

    return {
      healthy: true,
      timestamp: result[0]?.timestamp,
      latency: Date.now(), // Could be enhanced with proper timing
    };
  } catch (error) {
    console.error("Database health check failed:", error);
    return {
      healthy: false,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Database migration utilities
 */
export class DatabaseMigrationManager {
  private config: DatabaseEnvironmentConfig;

  constructor() {
    this.config = getDatabaseEnvironmentConfig();
  }

  /**
   * Get migration status
   */
  async getMigrationStatus() {
    try {
      const { sql } = createDatabaseConnection();

      // Check if migrations table exists
      const tableExists = await sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = ${this.config.schema}
          AND table_name = ${this.config.migrations.table}
        )
      `;

      if (!tableExists[0]?.exists) {
        return {
          initialized: false,
          appliedMigrations: [],
          pendingMigrations: [],
        };
      }

      // Get applied migrations
      // Note: Using string concatenation due to Neon SQL limitations with dynamic table names
      const query = `SELECT * FROM ${this.config.migrations.table} ORDER BY id ASC`;
      const appliedMigrations = await sql([query] as any);

      return {
        initialized: true,
        appliedMigrations: appliedMigrations.map((m) => ({
          id: m.id,
          hash: m.hash,
          created_at: m.created_at,
        })),
        pendingMigrations: [], // Would need to compare with file system
      };
    } catch (error) {
      console.error("Failed to get migration status:", error);
      throw error;
    }
  }

  /**
   * Validate database schema
   */
  async validateSchema() {
    try {
      const { sql } = createDatabaseConnection();

      // Check for required tables (customize based on your schema)
      const requiredTables = [
        "users",
        "horses",
        "tenants",
        // Add other required tables
      ];

      const results = await Promise.all(
        requiredTables.map(async (tableName) => {
          const exists = await sql`
            SELECT EXISTS (
              SELECT FROM information_schema.tables
              WHERE table_schema = ${this.config.schema}
              AND table_name = ${tableName}
            )
          `;
          return { table: tableName, exists: exists[0]?.exists };
        }),
      );

      const missingTables = results
        .filter((r) => !r.exists)
        .map((r) => r.table);

      return {
        valid: missingTables.length === 0,
        missingTables,
        checkedTables: requiredTables,
      };
    } catch (error) {
      console.error("Schema validation failed:", error);
      throw error;
    }
  }
}

/**
 * Database connection pool manager
 */
export class DatabaseConnectionManager {
  private static instance: DatabaseConnectionManager;
  private connections: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): DatabaseConnectionManager {
    if (!DatabaseConnectionManager.instance) {
      DatabaseConnectionManager.instance = new DatabaseConnectionManager();
    }
    return DatabaseConnectionManager.instance;
  }

  /**
   * Get or create database connection
   */
  getConnection(name: string = "default") {
    if (!this.connections.has(name)) {
      const connection = createDatabaseConnection();
      this.connections.set(name, connection);
    }
    return this.connections.get(name);
  }

  /**
   * Close all connections
   */
  async closeAll() {
    this.connections.clear();
  }

  /**
   * Get connection statistics
   */
  getStats() {
    return {
      activeConnections: this.connections.size,
      connectionNames: Array.from(this.connections.keys()),
    };
  }
}

/**
 * Database environment setup utilities
 */
export async function setupDatabaseEnvironment() {
  const environment = getEnvironment();
  console.log(`Setting up database for environment: ${environment}`);

  try {
    // Test connectivity
    const health = await checkDatabaseHealth();
    if (!health.healthy) {
      throw new Error(`Database health check failed: ${health.error}`);
    }

    // Check migration status
    const migrationManager = new DatabaseMigrationManager();
    const migrationStatus = await migrationManager.getMigrationStatus();

    if (!migrationStatus.initialized && environment !== "test") {
      console.warn(
        "Database migrations table not found. Run migrations first.",
      );
    }

    // Validate schema in production/staging
    if (environment === "production" || environment === "staging") {
      const schemaValidation = await migrationManager.validateSchema();
      if (!schemaValidation.valid) {
        console.error(
          "Schema validation failed:",
          schemaValidation.missingTables,
        );
        throw new Error("Database schema is invalid");
      }
    }

    console.log("Database environment setup completed successfully");
    return {
      success: true,
      environment,
      health,
      migrationStatus,
    };
  } catch (error) {
    console.error("Database environment setup failed:", error);
    throw error;
  }
}

/**
 * Database cleanup utilities for testing
 */
export async function cleanupTestDatabase() {
  const environment = getEnvironment();
  if (environment !== "test") {
    throw new Error("Database cleanup is only allowed in test environment");
  }

  try {
    const { sql } = createDatabaseConnection();

    // Drop test schema and recreate
    await sql`DROP SCHEMA IF EXISTS test CASCADE`;
    await sql`CREATE SCHEMA test`;

    console.log("Test database cleaned up successfully");
  } catch (error) {
    console.error("Test database cleanup failed:", error);
    throw error;
  }
}
