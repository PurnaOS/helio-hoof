/**
 * Development Configuration Utilities
 * Helper functions to manage development settings
 */

export interface DevConfig {
  useMockLLM: boolean;
  hasAnthropicKey: boolean;
  environment: string;
}

/**
 * Get current development configuration
 */
export function getDevConfig(): DevConfig {
  const useMockLLM = process.env.USE_MOCK_LLM === "true";
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY;
  const environment = process.env.NODE_ENV || "development";

  return {
    useMockLLM,
    hasAnthropicKey,
    environment,
  };
}

/**
 * Log current configuration for debugging
 */
export function logDevConfig(): void {
  if (typeof window !== "undefined") {
    // Only log on client side for debugging
    return;
  }

  const config = getDevConfig();
  console.log("🔧 Development Configuration:");
  console.log(`   Environment: ${config.environment}`);
  console.log(
    `   Mock LLM Mode: ${config.useMockLLM ? "✅ ENABLED" : "❌ DISABLED"}`,
  );
  console.log(
    `   Anthropic API Key: ${config.hasAnthropicKey ? "✅ PRESENT" : "❌ MISSING"}`,
  );

  if (config.environment === "development") {
    if (config.useMockLLM) {
      console.log("💡 Using mock responses - no API costs incurred");
    } else if (!config.hasAnthropicKey) {
      console.log("⚠️  WARNING: No API key found and mock mode disabled");
    } else {
      console.log("💰 Using real API - costs will be incurred");
    }
  }
}

/**
 * Validate development setup
 */
export function validateDevSetup(): { valid: boolean; message: string } {
  const config = getDevConfig();

  if (config.environment === "development") {
    if (!config.useMockLLM && !config.hasAnthropicKey) {
      return {
        valid: false,
        message:
          "Missing ANTHROPIC_API_KEY. Either set the API key or enable mock mode by setting USE_MOCK_LLM=true",
      };
    }
  }

  if (config.environment === "production" && config.useMockLLM) {
    return {
      valid: false,
      message: "Mock mode should not be enabled in production",
    };
  }

  return {
    valid: true,
    message: "Configuration is valid",
  };
}
