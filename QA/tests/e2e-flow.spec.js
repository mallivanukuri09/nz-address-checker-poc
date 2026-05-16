const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// Aioi Address Checker — Master E2E Flow
//
// Architecture:
//   NO page.route() interceptors in the happy-path test.
//   All /api/address traffic flows to route.ts which selects live NZ Post API
//   or falls back to its embedded mockAddresses dataset automatically.
//
// DOM facts (from page.tsx):
//   • Dropdown items are plain <button type="button" class="w-full text-left ...">
//     — there is no role="listbox"/role="option" or ul/li structure.
//   • Suggestion text format: "address_line_1, suburb, city postcode"
//     Mock entry #1 → "101 Queen Street, Auckland CBD, Auckland 1010"
//   • Manual fields (#streetAddress, #suburb, #city, #postcode) are
//     conditionally RENDERED only when showManualFields===true.
//     After autocomplete selection they do not exist in the DOM → not.toBeVisible().
//   • The search input fires a debounced fetch (300 ms). After fill() we
//     wait for the dropdown to appear before clicking.
//   • Submit button is the only <button type="submit"> on the form.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Aioi App — Master E2E Flow', () => {

  // ── Shared login helper ──────────────────────────────────────────────────
  async function loginAs(page, email, password) {
    await page.goto('/login');
    await page.locator('input#email').fill(email);
    await page.locator('input#password').fill(password);
    // Login page: <button type="submit">Login</button>
    await page.locator('button[type="submit"]').click();
    await expect(page).toHaveURL('/');
  }

  // ── Test 1: Complete happy-path flow ─────────────────────────────────────
  test('Login → Name → Search → Select → Assert hidden → Submit', async ({ page }) => {

    // Step 1 — Login
    await loginAs(page, 'admin@test.com', 'Admin123');
    await expect(page.locator('h1')).toContainText('NZ Address Checker');

    // Step 2 — Populate name fields
    await page.locator('input#firstName').fill('Test');
    await page.locator('input#lastName').fill('Automation');

    // Step 3 — Type into the address search field
    // "101 Queen" matches route.ts mockAddresses[0]:
    //   { address_line_1: '101 Queen Street', suburb: 'Auckland CBD',
    //     city: 'Auckland', postcode: '1010' }
    // The rendered suggestion string will be:
    //   "101 Queen Street, Auckland CBD, Auckland 1010"
    // The search uses a 300 ms debounce — fill() dispatches an input event,
    // then we wait for the dropdown button to appear (up to 10 s).
    const searchInput = page.locator('input#searchAddress');
    await searchInput.fill('101 Queen');

    // Step 4 — Wait for dropdown and click the first suggestion
    // Selector is grounded directly in the DOM structure from page.tsx:
    //   <div class="border border-gray-200 rounded-lg bg-gray-50 ...">
    //     <button type="button" class="w-full text-left px-4 py-3 ...">
    //       101 Queen Street, Auckland CBD, Auckland 1010
    //     </button>
    //   </div>
    const firstSuggestion = page.locator('button.w-full.text-left').first();
    await firstSuggestion.waitFor({ state: 'visible', timeout: 10_000 });
    await firstSuggestion.click();

    // Step 5 — Assert manual entry fields are NOT visible
    // These elements are conditionally rendered (showManualFields===false after
    // autocomplete selection), so they will not be in the DOM at all.
    // not.toBeVisible() covers both "hidden" and "not in DOM" cases.
    await expect(page.locator('input#streetAddress')).not.toBeVisible();
    await expect(page.locator('input#suburb')).not.toBeVisible();
    await expect(page.locator('input#city')).not.toBeVisible();
    await expect(page.locator('input#postcode')).not.toBeVisible();

    // Confirm the dropdown itself has closed after selection
    await expect(page.locator('button.w-full.text-left').first()).not.toBeVisible();

    // Step 6 — Submit with autocomplete-selected address
    // handleSubmit validates streetAddress/suburb/city/postcode in state even
    // when the manual fields are hidden — populated by handleSelectAddress().
    page.once('dialog', dialog => {
      expect(dialog.message()).toBe('Form submitted successfully!');
      dialog.accept();
    });

    // Only one <button type="submit"> on the page (the blue Submit button)
    await page.locator('button[type="submit"]').click();

    // Confirm no validation error banner appears
    await expect(page.locator('text="Please fix the errors above"')).not.toBeVisible();
  });

  // ── Test 2: Second address from route.ts mock data ───────────────────────
  // Uses "12 Customhouse Quay" — mockAddresses[1] in route.ts:
  //   { address_line_1: '12 Customhouse Quay', suburb: 'Wellington Central',
  //     city: 'Wellington', postcode: '6011' }
  // Rendered suggestion: "12 Customhouse Quay, Wellington Central, Wellington 6011"
  // NO page.route() interceptor — backend handles live/mock branching naturally.
  test('Login → Search "12 Customhouse Quay" → Select → Submit', async ({ page }) => {

    // Step 1 — Login
    await loginAs(page, 'admin@test.com', 'Admin123');
    await expect(page.locator('h1')).toContainText('NZ Address Checker');

    // Step 2 — Populate name fields
    await page.locator('input#firstName').fill('Jane');
    await page.locator('input#lastName').fill('Tester');

    // Step 3 — Search for second mock address
    const searchInput = page.locator('input#searchAddress');
    await searchInput.fill('12 Customhouse');

    // Step 4 — Wait for dropdown and click first suggestion
    const firstSuggestion = page.locator('button.w-full.text-left').first();
    await firstSuggestion.waitFor({ state: 'visible', timeout: 10_000 });
    await firstSuggestion.click();

    // Step 5 — Manual fields must stay hidden after autocomplete selection
    await expect(page.locator('input#streetAddress')).not.toBeVisible();
    await expect(page.locator('input#suburb')).not.toBeVisible();
    await expect(page.locator('input#city')).not.toBeVisible();
    await expect(page.locator('input#postcode')).not.toBeVisible();

    // Step 6 — Submit and assert the in-page success banner appears
    await page.locator('button[type="submit"]').click();

    // The green success banner (#successBanner) must be visible after submission
    await expect(page.locator('#successBanner')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#successBanner')).toContainText('Form submitted successfully!');
  });

});
