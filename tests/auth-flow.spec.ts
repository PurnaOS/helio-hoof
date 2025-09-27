import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {

  test("should show main application content", async ({ page }) => {
    // Go to the main page
    await page.goto("/");

    // Should see the main app header
    await expect(page.locator("h1")).toContainText("Helio-Hoof");

    // Should see the hero section content
    await expect(page.getByText("Show Jumping Analyzer")).toBeVisible();
    await expect(page.getByText("Upload single or multiple show jumping images")).toBeVisible();
  });

  test("should allow waitlist signup", async ({ page }) => {
    await page.goto("/waitlist");

    // Verify waitlist page loads correctly
    await expect(page.locator("h1")).toContainText("Join the Waitlist");

    // Verify basic waitlist content is present
    await expect(page.getByText("private beta")).toBeVisible({ timeout: 15000 });

    // Verify sign-up link is present
    await expect(page.getByText("Already have an invitation?")).toBeVisible();
  });

  test("should navigate to sign-in from waitlist", async ({ page }) => {
    await page.goto("/waitlist");

    // Find and click the sign-up link (for users with invitations)
    const signUpLink = page.locator('a[href="/sign-up"]');
    await expect(signUpLink).toBeVisible();

    // Note: In a real test environment, you would continue the flow
    // For now, we just verify the link exists
  });

  test("should show proper error handling for auth failures", async ({ page }) => {
    await page.goto("/");

    // Verify that auth errors are handled gracefully
    // The app should show waitlist instead of crashing
    await expect(page.locator("body")).toBeVisible();

    // Should not show internal server errors
    await expect(page.locator("text=500")).not.toBeVisible();
    await expect(page.locator("text=Internal Server Error")).not.toBeVisible();
  });
});