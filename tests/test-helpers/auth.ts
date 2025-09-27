import { expect, type Page } from "@playwright/test";

/**
 * Secure authentication helper for E2E tests
 * Uses environment variables for test credentials to avoid hardcoded secrets
 */
export async function authenticateUser(page: Page): Promise<void> {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set for E2E tests. " +
        "Please check your .env.local file and ensure test credentials are configured.",
    );
  }

  // Navigate to the application
  await page.goto("/");

  // Check if we need to sign in
  const signInButton = page.getByText("Sign In").first();
  if (await signInButton.isVisible()) {
    console.log("Performing authentication...");

    // Click sign in
    await signInButton.click();
    await page.waitForLoadState("networkidle");

    // Fill in credentials
    await page.getByLabel("Email address").fill(testEmail);
    await page.getByRole("button", { name: "Continue" }).click();

    // Wait for password field and fill it
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.getByLabel("Password").fill(testPassword);
    await page.getByRole("button", { name: "Continue" }).click();

    // Wait for successful login and navigation back to home
    await page.waitForLoadState("networkidle");
    await expect(page.getByText("Show Jumping Analyzer")).toBeVisible();

    console.log("Authentication successful");
  } else {
    console.log("User already authenticated or auth not required");
  }
}

/**
 * Alternative authentication method for pages that redirect to sign-in
 */
export async function authenticateUserWithRedirect(page: Page): Promise<void> {
  const testEmail = process.env.TEST_USER_EMAIL;
  const testPassword = process.env.TEST_USER_PASSWORD;

  if (!testEmail || !testPassword) {
    throw new Error(
      "TEST_USER_EMAIL and TEST_USER_PASSWORD environment variables must be set for E2E tests. " +
        "Please check your .env.local file and ensure test credentials are configured.",
    );
  }

  // Check if we need to sign in
  const signInButton = page.getByText("Sign In").first();
  if (await signInButton.isVisible()) {
    console.log("Performing authentication...");

    // Click sign in
    await signInButton.click();

    // Wait for sign in page to load
    await page.waitForURL("**/sign-in**");

    // Fill in email
    const emailInput = page.locator('input[type="email"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill(testEmail);

      // Fill in password
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill(testPassword);

        // Click submit button
        const submitButton = page
          .getByRole("button", { name: "Sign in" })
          .or(page.getByRole("button", { name: "Continue" }))
          .first();
        if (await submitButton.isVisible()) {
          await submitButton.click();

          // Wait for redirect back to main page
          await page.waitForURL("/");
          console.log("Authentication successful");
        }
      }
    }
  } else {
    console.log("User already authenticated or auth not required");
  }
}

/**
 * Helper function to wait for authentication state in E2E tests
 */
export async function waitForAuthenticationState(
  page: Page,
  timeout = 10000
): Promise<boolean> {
  try {
    // Wait for either sign-in prompt or authenticated content
    await Promise.race([
      page.waitForSelector('[data-testid="sign-in-prompt"]', { timeout }),
      page.waitForSelector('[data-testid="authenticated-content"]', { timeout }),
    ]);

    // Check which state we're in
    const isSignedIn = await page.locator('[data-testid="authenticated-content"]').isVisible();
    return isSignedIn;
  } catch {
    // If neither selector is found, assume not authenticated
    return false;
  }
}

// Mock user data for unit tests
export const mockTestUser = {
  id: "test-user-id",
  firstName: "Test",
  lastName: "User",
  emailAddresses: [{ emailAddress: "test@example.com" }],
  fullName: "Test User",
};

export const mockClerkState = {
  isSignedIn: true,
  isLoaded: true,
  user: mockTestUser,
  sessionId: "test-session-id",
  userId: "test-user-id",
};

/**
 * Mock helper for unit tests to simulate different auth states
 */
export function createMockAuthState(overrides: Partial<typeof mockClerkState> = {}) {
  return {
    ...mockClerkState,
    ...overrides,
  };
}

/**
 * Helper to reset authentication state in tests
 */
export function resetAuthState() {
  mockClerkState.isSignedIn = true;
  mockClerkState.isLoaded = true;
  mockClerkState.user = mockTestUser;
}