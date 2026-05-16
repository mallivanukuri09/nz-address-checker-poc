const { test, expect } = require('@playwright/test');
const mockAddressData = require('./fixtures/address-fixtures.json');

test.describe('Aioi App - End-to-End User Flow', () => {
  
  test('Complete login and address search flow with mocked API', async ({ page }) => {
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

    // 4. Intercept the NZ Post / Address autocomplete API call
    await page.route('**/api/address?q=*', async (route) => {
      // Serve the mock address data safely from our fixture
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockAddressData),
      });
    });

    // 5. Fill out Personal Details
    await page.locator('input#firstName').fill('Test');
    await page.locator('input#lastName').fill('Automation');

    // 6. Search for an address
    const searchInput = page.locator('input#searchAddress');
    await searchInput.fill('100 Automation');
    
    // 7. Select the mocked result
    // Wait for the dropdown suggestion to appear and click it
    const suggestionButton = page.locator('button:has-text("100 Automation Way")').first();
    await suggestionButton.waitFor({ state: 'visible' });
    await suggestionButton.click();

    // 8. Assert fields are auto-populated correctly from the mock
    await expect(page.locator('input#streetAddress')).toHaveValue('100 Automation Way');
    await expect(page.locator('input#suburb')).toHaveValue('Testingville');
    await expect(page.locator('input#city')).toHaveValue('Quality City');
    
    // Assert the 4-digit postcode layout rule
    const postcodeInput = page.locator('input#postcode');
    await expect(postcodeInput).toHaveValue('5000');
    
    // Check postcode value length is exactly 4 digits
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
    
    // Optionally wait a moment to ensure no error blocks appear after submission
    await expect(page.locator('text="Please fix the errors above"')).not.toBeVisible();
  });
  
});
