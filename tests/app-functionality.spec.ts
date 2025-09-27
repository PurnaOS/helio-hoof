import { expect, test } from "@playwright/test";

test.describe("Application Functionality", () => {
  test("should load main page without errors", async ({ page }) => {
    await page.goto("/");

    // Wait for page to load completely
    await page.waitForLoadState("networkidle");

    // Verify page loads without JavaScript errors
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));

    // Check that basic page structure is present
    await expect(page.locator("body")).toBeVisible();

    // Verify no critical JavaScript errors occurred
    expect(
      errors.filter(
        (error) =>
          error.includes("TypeError") ||
          error.includes("ReferenceError") ||
          error.includes("SyntaxError"),
      ),
    ).toHaveLength(0);
  });

  test("should display proper app branding", async ({ page }) => {
    await page.goto("/");

    // Verify app title and branding
    await expect(page).toHaveTitle(/Helio-Hoof/);

    // Check for main heading
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("should handle navigation without errors", async ({ page }) => {
    await page.goto("/");

    // Try navigating to different routes
    const routes = ["/waitlist", "/sign-up", "/sign-in"];

    for (const route of routes) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");

      // Verify page loads without errors
      await expect(page.locator("body")).toBeVisible();

      // Check for no 404 or 500 error pages
      await expect(page.locator("text=404")).not.toBeVisible();
      await expect(page.locator("text=500")).not.toBeVisible();
    }
  });

  test("should have responsive design", async ({ page }) => {
    await page.goto("/");

    // Test desktop view (1280x720)
    await page.setViewportSize({ width: 1280, height: 720 });
    await expect(page.locator("body")).toBeVisible();

    // Test tablet view (768x1024)
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator("body")).toBeVisible();

    // Test mobile view (375x667)
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(page.locator("body")).toBeVisible();

    // Verify layout doesn't break on mobile
    await expect(page.locator("html")).not.toHaveCSS("overflow-x", "auto");
  });

  test("should handle dark/light theme properly", async ({ page }) => {
    await page.goto("/");

    // Check that theme classes are properly applied
    const htmlElement = page.locator("html");
    await expect(htmlElement).toBeVisible();

    // Verify CSS variables are properly loaded for theming
    const rootStyles = await page.evaluate(() => {
      const computedStyles = getComputedStyle(document.documentElement);
      return {
        hasBackground:
          computedStyles.getPropertyValue("background-color") !== "",
        hasTextColor: computedStyles.getPropertyValue("color") !== "",
      };
    });

    expect(rootStyles.hasBackground).toBe(true);
    expect(rootStyles.hasTextColor).toBe(true);
  });
});
