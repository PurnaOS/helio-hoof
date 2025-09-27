/// <reference types="vitest" />

import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test-setup.ts"],
    globals: true,
    css: false,
    testTimeout: 15000, // Increase timeout for reliability
    hookTimeout: 15000, // Increase hook timeout
    include: ["src/**/*.{test,spec}.{js,ts,jsx,tsx}"],
    exclude: ["tests/**/*", "node_modules/**/*", "**/*.e2e.{js,ts}"],
    pool: "forks", // Use forks for better isolation
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for consistency
      },
    },
    isolate: true, // Ensure test isolation
    sequence: {
      shuffle: false, // Disable shuffling for consistent results
    },
    retry: 0, // Disable retries to catch flaky tests
    server: {
      deps: {
        inline: [
          "@testing-library/react",
          "@testing-library/jest-dom",
          "@clerk/nextjs",
        ],
      },
    },
    clearMocks: true, // Clear mocks between tests
    restoreMocks: true, // Restore mocks after tests
    mockReset: true, // Reset mocks to initial state
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/test-setup.ts",
        "**/*.d.ts",
        "**/*.config.{js,ts}",
        "**/dist/**",
        "**/.next/**",
        "**/__tests__/**",
        "**/*.test.*",
        "**/*.spec.*",
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 75,
          lines: 75,
          statements: 75,
        },
      },
      all: true,
      clean: true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
