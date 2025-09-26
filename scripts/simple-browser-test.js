const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: false }); // Set to false so we can see what's happening
  const page = await browser.newPage();

  // Enable console logging
  page.on('console', msg => console.log('Browser Console:', msg.text()));

  try {
    // Navigate to the app
    await page.goto('http://localhost:3000');

    console.log('Page loaded, looking for sign in...');

    // Click the sign in button in the header
    await page.click('header button:has-text("Sign In")');
    await page.waitForTimeout(2000);

    // Fill in credentials
    await page.fill('input[name="identifier"]', 'srinivasarajui@gmail.com');
    await page.click('button:has-text("Continue")');
    await page.waitForTimeout(2000);

    // Fill password
    await page.fill('input[name="password"]', 'Srithejas+Saurya=1');
    await page.click('button:has-text("Continue")');

    // Wait for login to complete
    await page.waitForTimeout(5000);

    console.log('Login completed, now testing analysis...');

    // Fill in name and description
    await page.fill('input[id="analysis-name"]', 'Test Analysis from Script');
    await page.fill('textarea[id="analysis-description"]', 'This is a test description from the automated script');

    console.log('Filled in form fields...');

    // We would need to upload a file here, but for now let's just see if we can trigger the debug logs
    // by checking what happens when we try to interact with the form

    console.log('Test completed - you can manually upload an image and click analyze to see debug logs');

    // Keep browser open for manual testing
    await page.waitForTimeout(60000); // Wait 60 seconds

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();