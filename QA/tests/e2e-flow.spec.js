const { test, expect } = require('@playwright/test');
const mockAddressData = require('./fixtures/address-fixtures.json');
require('dotenv').config({ path: '.env.local' });

let useMock = true;

// Pre-Flight Connectivity Check
test.beforeAll(async () => {
  // Read API keys from the environment variables configured in our .env.local
  const clientId = process.env.NZ_POST_CLIENT_ID || process.env.NEXT_PUBLIC_NZ_POST_API_KEY;
  const clientSecret = process.env.NZ_POST_CLIENT_SECRET;

  if (!clientId || clientId.includes('PASTE_YOUR_')) {
    useMock = true;
    console.log('⚠️ NZ Post API keys missing or using placeholders. Engaging Playwright Mock Layer...');
    return;
  }

  try {
    // Attempt a quick fetch to the NZ Post endpoint using the key
    const response = await fetch(`https://api.nzpost.co.nz/addresschecker/v2/autocomplete?query=test&max=1`, {
      method: 'GET',
      headers: {
        'client_id': clientId,
        ...(clientSecret && { 'Authorization': `Bearer ${clientSecret}` }),
        'Accept': 'application/json',
      }
    });

    if (response.ok) {
      useMock = false;
      console.log('✅ Connected successfully to Live NZ Post API production servers.');
    } else {
      useMock = true;
      console.log(`⚠️ NZ Post API returned ${response.status}. Engaging Playwright Mock Layer...`);
    }
  } catch (error) {
    useMock = true;
    console.log('⚠️ Network error connecting to NZ Post API. Engaging Playwright Mock Layer...');
  }
});

test.describe('Aioi App - End-to-End User Flow', () => {
  
  test('Complete login and address search flow with conditional mock/live API', async ({ page }) => {
    // 1. Navigate to the login page
    await page.goto('/login');

    // Verify novalidate is present on the form to suppress native browser bubbles
    const loginForm = page.locator('form');
    await expect(loginForm).toHaveAttribute('novalidate', '');

    // 2. Inject credentials and login
    await page.locator('input#email').fill('admin@test.com');
    await page.locator('input#password').fill('Admin123');
    await page.locator('button[type="submit"]').click();

    // 3. Wait for redirect to Dashboard/Address Checker page
    await expect(page).toHaveURL('/');
    await expect(page.locator('h1')).toContainText('NZ Address Checker');

    // 4. Dynamic Playwright Routing
    if (useMock) {
      console.log('⚠️ NZ Post API unavailable or unauthenticated. Engaging Playwright Mock Layer...');
      
      // We intercept the local Next.js API route call since that's what the frontend requests
      await page.route('**/api/address?q=*', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockAddressData),
        });
      });
    } else {
      console.log('✅ Connected successfully to Live NZ Post API production servers.');
      // Do not intercept - allow Playwright to talk directly to the internet/backend
    }

    // 5. Fill out Personal Details
    await page.locator('input#firstName').fill('Test');
    await page.locator('input#lastName').fill('Automation');

    // 6. Search for an address
    const searchInput = page.locator('input#searchAddress');
    await searchInput.fill(useMock ? '100 Automation' : 'Queen Street');
    
    // 7. Select the result using a resilient generic selector
    // We use a generic 'button' inside the dropdown container that matches the layout classes
    // rather than looking for a strict text match, since live API strings can be unpredictable.
    const suggestionButton = page.locator('button.w-full.text-left').first();
    await suggestionButton.waitFor({ state: 'visible' });
    await suggestionButton.click();

    // 8. Assert fields are auto-populated
    // We cannot reliably assert exact string values if it's live data, so we check they are non-empty
    await expect(page.locator('input#streetAddress')).not.toBeEmpty();
    await expect(page.locator('input#suburb')).not.toBeEmpty();
    await expect(page.locator('input#city')).not.toBeEmpty();
    
    // Assert the 4-digit postcode layout rule
    const postcodeInput = page.locator('input#postcode');
    const postcodeValue = await postcodeInput.inputValue();
    expect(postcodeValue).toMatch(/^\d{4}$/);

    // 9. Trigger the final "Submit" click
    // Listen for the dialog/alert to verify successful submission
    page.once('dialog', dialog => {
      expect(dialog.message()).toBe('Form submitted successfully!');
      dialog.accept();
    });

    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait a moment to ensure no error blocks appear after submission
    await expect(page.locator('text="Please fix the errors above"')).not.toBeVisible();
  });
  
});
