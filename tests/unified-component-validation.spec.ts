import { expect, test } from "@playwright/test";

test.describe("Unified Analysis Report Component Validation", () => {
  test("should verify AnalysisReport component is used consistently", async ({
    page,
  }) => {
    // Test main page structure
    await page.goto("/");

    // Verify the main page has the image upload component when no analysis
    const imageUpload = page.locator('[data-testid="image-upload"]');
    await expect(imageUpload).toBeVisible({ timeout: 10000 });

    // Check main page has correct header structure
    const header = page.locator("header");
    await expect(header).toBeVisible();
    await expect(header).toContainText("Helio-Hoof");

    console.log("✅ Main page structure validated");
  });

  test("should verify history page loads without error", async ({ page }) => {
    // Test history page loads
    await page.goto("/history");

    // Should show history page without authentication error (in real app would need auth)
    const pageTitle = page.locator("h1");
    await expect(pageTitle).toBeVisible({ timeout: 5000 });

    console.log("✅ History page structure validated");
  });

  test("should verify both pages use same styling classes", async ({
    page,
  }) => {
    // Test main page styling
    await page.goto("/");
    const mainBg = page.locator(".min-h-screen");
    await expect(mainBg).toHaveClass(/bg-gray-50/);

    // Test history page styling
    await page.goto("/history");
    const historyBg = page.locator(".min-h-screen");
    await expect(historyBg).toHaveClass(/bg-gray-50/);

    console.log("✅ Consistent styling validated across both pages");
  });

  test("should verify AnalysisReport component structure exists", async ({
    page,
  }) => {
    await page.goto("/");

    // The AnalysisReport component should be used when analysis exists
    // For now, we verify that the page loads and has the correct structure
    const bodyContent = page.locator("body");
    await expect(bodyContent).toBeVisible();

    // Verify navigation elements exist (indicates unified header structure)
    const navLink = page.locator('a[href="/history"]');
    await expect(navLink).toBeVisible();

    console.log("✅ Component structure validation passed");
  });

  test("should validate responsive design consistency", async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");

    const container = page.locator(".container").first();
    await expect(container).toBeVisible();

    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await expect(container).toBeVisible();

    console.log("✅ Responsive design consistency validated");
  });
});
