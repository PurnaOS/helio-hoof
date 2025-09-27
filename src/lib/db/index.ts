import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Environment validation
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required");
}

// Neon serverless configuration optimized for Vercel
const sql = neon(process.env.DATABASE_URL, {
  // Enable connection pooling for better performance
  fullResults: true,

  // Connection timeout settings for serverless environment
  fetchOptions: {
    // Timeout for individual queries (30 seconds)
    timeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || "30000", 10),
  },
});

// Create Drizzle instance with optimized configuration
export const db = drizzle(sql, {
  schema,
  // Enable logging in development
  logger: process.env.NODE_ENV === "development",
});

// Database health check function
export async function healthCheck(): Promise<{
  status: "healthy" | "unhealthy";
  latency?: number;
}> {
  try {
    const start = Date.now();
    await sql`SELECT 1 as health`;
    const latency = Date.now() - start;

    return { status: "healthy", latency };
  } catch (error) {
    console.error("Database health check failed:", error);
    return { status: "unhealthy" };
  }
}

// Connection pool metrics (for monitoring)
export function getConnectionInfo() {
  return {
    databaseUrl: process.env.DATABASE_URL ? "configured" : "missing",
    environment: process.env.NODE_ENV || "unknown",
    timeout: parseInt(process.env.DATABASE_QUERY_TIMEOUT || "30000", 10),
  };
}

export { schema };
