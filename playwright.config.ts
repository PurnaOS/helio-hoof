import { defineConfig, devices } from "@playwright/test";
import dotenv from "dotenv";

// Load environment variables for tests
// Try .env.test first, then fall back to .env.local
dotenv.config({ path: ".env.test" });
dotenv.config({ path: ".env.local" });

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false, // Disable for auth tests to avoid conflicts
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html"], ["list"]],
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 10000,
    navigationTimeout: 30000,
    // Ignore HTTPS errors in development
    ignoreHTTPSErrors: true,
  },

  projects: [
    {
      name: "auth-flow",
      testMatch: "**/auth-flow.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "protected-routes",
      testMatch: "**/protected-routes.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "app-functionality",
      testMatch: "**/app-functionality.spec.ts",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "bun run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
