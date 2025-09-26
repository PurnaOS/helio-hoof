import { test, expect } from '@playwright/test';

test.describe('Name and Description Storage Validation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');

    // Sign in with provided credentials - click the first Sign In button in header
    await page.getByRole('banner').getByRole('button', { name: 'Sign In' }).click();
    await page.waitForLoadState('networkidle');

    // Fill in credentials
    await page.getByLabel('Email address').fill('srinivasarajui@gmail.com');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Wait for password field and fill it
    await page.waitForSelector('input[name="password"]', { timeout: 10000 });
    await page.getByLabel('Password').fill('Srithejas+Saurya=1');
    await page.getByRole('button', { name: 'Continue' }).click();

    // Wait for successful login and navigation back to home
    await page.waitForLoadState('networkidle');
    await expect(page.getByText('Show Jumping Analyzer')).toBeVisible();
  });

  test('should store and display name and description for new analysis', async ({ page }) => {
    // Fill in name and description
    const analysisName = 'Test Analysis ' + Date.now();
    const analysisDescription = 'This is a test analysis to validate name and description storage';

    await page.getByLabel('Analysis Name').fill(analysisName);
    await page.getByLabel('Description (Optional)').fill(analysisDescription);

    // Create a simple test image file
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: imageBuffer,
    });

    // Wait for image to be processed
    await expect(page.getByText('test-image.png')).toBeVisible();

    // Click analyze button
    await page.getByRole('button', { name: 'Analyze Images' }).click();

    // Wait for analysis to complete (mock analysis should be fast)
    await expect(page.getByTestId('analysis-report')).toBeVisible({ timeout: 15000 });

    // Check if name and description are displayed in the results
    await expect(page.getByText(analysisName)).toBeVisible();
    await expect(page.getByText(analysisDescription)).toBeVisible();

    // Navigate to history to verify it was saved
    await page.getByRole('button', { name: 'View History' }).click();
    await page.waitForLoadState('networkidle');

    // Check if the analysis appears in history with correct name and description
    await expect(page.getByText(analysisName)).toBeVisible();
    await expect(page.getByText(analysisDescription)).toBeVisible();

    // Click on the analysis to view details
    await page.getByText(analysisName).click();
    await page.waitForLoadState('networkidle');

    // Verify name and description are shown in the detailed view
    await expect(page.getByText(analysisName)).toBeVisible();
    await expect(page.getByText(analysisDescription)).toBeVisible();
  });

  test('should handle empty name and description gracefully', async ({ page }) => {
    // Leave name and description empty

    // Create a simple test image file
    const imageBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-image-2.png',
      mimeType: 'image/png',
      buffer: imageBuffer,
    });

    // Wait for image to be processed
    await expect(page.getByText('test-image-2.png')).toBeVisible();

    // Click analyze button
    await page.getByRole('button', { name: 'Analyze Images' }).click();

    // Wait for analysis to complete
    await expect(page.getByTestId('analysis-report')).toBeVisible({ timeout: 15000 });

    // Navigate to history to verify it was saved with default name
    await page.getByRole('button', { name: 'View History' }).click();
    await page.waitForLoadState('networkidle');

    // Check if the analysis appears with a default name containing current date
    const currentDate = new Date().toLocaleDateString();
    await expect(page.getByText(`Single Image Analysis - ${currentDate}`)).toBeVisible();
  });

  test('should validate multi-image analysis name/description storage', async ({ page }) => {
    // Fill in name and description for multi-image analysis
    const analysisName = 'Multi Image Test ' + Date.now();
    const analysisDescription = 'Testing multi-image analysis with name and description';

    await page.getByLabel('Analysis Name').fill(analysisName);
    await page.getByLabel('Description (Optional)').fill(analysisDescription);

    // Create multiple test image files
    const imageBuffer1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      'base64'
    );
    const imageBuffer2 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAEklEQVR42mNkYGBgYGBgYGAAABQAAREAAf+b1AAAAABJRU5ErkJggg==',
      'base64'
    );

    // Upload first image
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-multi-1.png',
      mimeType: 'image/png',
      buffer: imageBuffer1,
    });

    // Wait for first image
    await expect(page.getByText('test-multi-1.png')).toBeVisible();

    // Upload second image
    await fileInput.setInputFiles({
      name: 'test-multi-2.png',
      mimeType: 'image/png',
      buffer: imageBuffer2,
    });

    // Wait for second image
    await expect(page.getByText('test-multi-2.png')).toBeVisible();

    // Click analyze button
    await page.getByRole('button', { name: 'Analyze Images' }).click();

    // Wait for analysis to complete
    await expect(page.getByTestId('analysis-report')).toBeVisible({ timeout: 15000 });

    // Check if name and description are displayed in the results
    await expect(page.getByText(analysisName)).toBeVisible();
    await expect(page.getByText(analysisDescription)).toBeVisible();

    // Navigate to history to verify it was saved
    await page.getByRole('button', { name: 'View History' }).click();
    await page.waitForLoadState('networkidle');

    // Check if the analysis appears in history with correct name and Multi badge
    await expect(page.getByText(analysisName)).toBeVisible();
    await expect(page.getByText('Multi Image')).toBeVisible();
  });
});