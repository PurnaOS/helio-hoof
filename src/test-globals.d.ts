/**
 * Global test utilities and type definitions
 */

declare global {
  /**
   * Helper function to temporarily set environment variables during tests
   * @param key - Environment variable key
   * @param value - Environment variable value
   */
  function setTestEnv(key: string, value: string): void;

  /**
   * Helper function to restore environment variables after tests
   * @param key - Environment variable key
   * @param originalValue - Original value to restore (if any)
   */
  function restoreTestEnv(key: string, originalValue?: string): void;
}

export {};