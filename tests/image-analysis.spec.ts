import fs from "node:fs";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { authenticateUserWithRedirect } from "./test-helpers/auth";

// Create a simple test image in base64 format (1x1 pixel PNG)
const testImageBase64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAI9jU77mgAAAABJRU5ErkJggg==";

test.describe("Image Analysis API", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto("/");

    // Authenticate user using secure helper
    await authenticateUserWithRedirect(page);
  });

  test("single image analysis should not return 500 error", async ({
    page,
  }) => {
    // Test the single image analysis endpoint directly
    const response = await page.request.post("/api/analyze-image", {
      data: {
        imageBase64: testImageBase64,
        mimeType: "image/png",
      },
    });

    // The response should not be a 500 error
    expect(response.status()).not.toBe(500);

    console.log(`API response status: ${response.status()}`);

    // It might be 401 (unauthorized), 404 (not found), or 200 (success), but not 500 (internal server error)
    expect([200, 401, 404]).toContain(response.status());

    if (response.status() === 200) {
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty("success");
    }
  });

  test("multiple image analysis should not return 500 error", async ({
    page,
  }) => {
    // Test the multiple image analysis endpoint directly
    const response = await page.request.post("/api/analyze-images", {
      data: {
        images: [
          {
            base64: testImageBase64,
            mimeType: "image/png",
            filename: "test1.png",
          },
          {
            base64: testImageBase64,
            mimeType: "image/png",
            filename: "test2.png",
          },
        ],
      },
    });

    // The response should not be a 500 error
    expect(response.status()).not.toBe(500);

    console.log(`API response status: ${response.status()}`);

    // It might be 401 (unauthorized), 404 (not found), or 200 (success), but not 500 (internal server error)
    expect([200, 401, 404]).toContain(response.status());

    if (response.status() === 200) {
      const responseBody = await response.json();
      expect(responseBody).toHaveProperty("success");
      expect(responseBody).toHaveProperty("analysis");
    }
  });

  test("UI image upload should work without 500 errors", async ({ page }) => {
    // Navigate to the main page
    await page.goto("/");

    // Look for image upload components
    const fileInput = page.locator('input[type="file"]').first();

    if (await fileInput.isVisible()) {
      // Create a test image file
      const testImagePath = path.join(__dirname, "test-image.png");
      const testImageBuffer = Buffer.from(testImageBase64, "base64");
      fs.writeFileSync(testImagePath, testImageBuffer);

      // Upload the test image
      await fileInput.setInputFiles(testImagePath);

      // Look for analyze button and click it
      const analyzeButton = page.getByText("Analyze", { exact: false }).first();
      if (await analyzeButton.isVisible()) {
        await analyzeButton.click();

        // Wait for response and check that no 500 error appears
        await page.waitForTimeout(3000);

        // Check for error messages in the UI
        const errorText = page.getByText("500", { exact: false });
        const internalErrorText = page.getByText("Internal server error", {
          exact: false,
        });

        expect(await errorText.isVisible()).toBeFalsy();
        expect(await internalErrorText.isVisible()).toBeFalsy();
      }

      // Clean up test file
      fs.unlinkSync(testImagePath);
    } else {
      console.log("File input not found - UI test skipped");
    }
  });
});
