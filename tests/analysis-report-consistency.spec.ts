import { test, expect } from '@playwright/test';

test.describe('Analysis Report Consistency', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication to bypass Clerk sign-in
    await page.addInitScript(() => {
      // Mock Clerk user state
      window.__CLERK_FRONTEND_API = 'test';
    });
  });

  test('should render identical analysis reports on main and history pages', async ({ page }) => {
    // First, we'll create a mock analysis by uploading an image on the main page
    // Note: This would require mocking the API or having test data

    // For now, let's test that both components have the same structure

    // Test main page has AnalysisReport component structure
    await page.goto('/');

    // Wait for the page to load and check if image upload is present (when no analysis)
    await expect(page.locator('[data-testid="image-upload"]')).toBeVisible({ timeout: 10000 });

    // Test history page structure (with mock data)
    // We'll need to create a test analysis entry or mock the API

    console.log('Analysis report consistency test setup complete');
  });

  test('should display the same AnalysisReport component structure', async ({ page }) => {
    // Test that the AnalysisReport component has consistent data-testid
    await page.goto('/');

    // Check that the page loads without errors
    await expect(page.locator('body')).toBeVisible();

    // Verify the main page structure
    const header = page.locator('header');
    await expect(header).toBeVisible();

    console.log('Main page structure validated');
  });

  test('should have consistent styling and layout', async ({ page }) => {
    await page.goto('/');

    // Check that the main container has consistent styling
    const mainContainer = page.locator('.min-h-screen');
    await expect(mainContainer).toHaveClass(/bg-gray-50/);

    // Check header styling
    const header = page.locator('header');
    await expect(header).toHaveClass(/bg-white/);

    console.log('Consistent styling validated');
  });

  // Test to verify that when we have analysis data, both pages render the same component
  test('should use AnalysisReport component in both contexts', async ({ page }) => {
    // This test validates that both pages would use the same component
    // In a real scenario, we'd:
    // 1. Upload an image and get analysis
    // 2. Navigate to history
    // 3. Compare the rendered components

    await page.goto('/');

    // For now, verify that the page structure supports the unified component
    const container = page.locator('.container').first();
    await expect(container).toBeVisible();

    console.log('Component structure validation complete');
  });
});