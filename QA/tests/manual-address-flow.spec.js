const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// Aioi Address Checker — Manual Address Entry Fallback Flow
//
// Purpose:
//   Validates the complete fallback path a user follows when address search
//   returns no results and they must enter their address manually.
//
// DOM facts (from page.tsx):
//   • Search is debounced 300 ms — we use page.route() to guarantee a
//     zero-result response regardless of whether live NZ Post credentials
//     are active or route.ts's mock fallback is running.
//   • "No matching address found" renders inside a <p class="text-red-600 ...">
//   • Manual link: <p onClick={handleManualEntry}>Can't find your address? Enter manually</p>
//   • Manual fields (#streetAddress, #suburb, #city, #postcode) are
//     conditionally rendered — only appear when showManualFields === true.
//   • #postcode strips non-numeric chars via handlePostcodeChange.
//   • Success: inline <div id="successBanner" role="alert"> — NOT a dialog.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Aioi App — Manual Address Entry Fallback Flow', () => {

  // ── Test: Full manual entry path ──────────────────────────────────────────
  test(
    'Search fails → click manual link → fill fields → submit → success banner',
    async ({ page }) => {

      // ── Step 1: Login ──────────────────────────────────────────────────────
      await page.goto('/login');
      await page.locator('input#email').fill('admin@test.com');
      await page.locator('input#password').fill('Admin123');
      // Login page: <button type="submit">Login</button>
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toContainText('NZ Address Checker');

      // ── Step 2: Fill name fields ───────────────────────────────────────────
      await page.locator('input#firstName').fill('Manual');
      await page.locator('input#lastName').fill('Tester');

      // ── Step 3: Intercept the API to guarantee zero results ────────────────
      // We use page.route() here deliberately — this test is specifically about
      // the *failure* path, so we must guarantee empty results regardless of
      // whether live NZ Post credentials are active or mock data is in use.
      await page.route('**/api/address?q=*', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ addresses: [], success: true }),
        })
      );

      // ── Step 4: Type a search query to trigger the no-results state ────────
      const searchInput = page.locator('input#searchAddress');
      await searchInput.fill('This Address Does Not Exist 9999');

      // ── Step 5: Assert the inline error message appears ────────────────────
      // page.tsx renders: <p class="text-red-600 ...">No matching address found</p>
      await expect(
        page.locator('text=No matching address found')
      ).toBeVisible({ timeout: 10_000 });

      // ── Step 6: Click "Can't find your address? Enter manually" ───────────
      // page.tsx: <p onClick={handleManualEntry}>Can't find your address? Enter manually</p>
      await page.locator('text="Can\'t find your address? Enter manually"').click();

      // ── Step 7: Assert manual fields are now visible in the DOM ───────────
      // showManualFields flips to true — the fields are now conditionally rendered.
      await expect(page.locator('input#streetAddress')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('input#suburb')).toBeVisible();
      await expect(page.locator('input#city')).toBeVisible();
      await expect(page.locator('input#postcode')).toBeVisible();

      // ── Step 8: Fill manual address fields with realistic dummy data ───────
      await page.locator('input#streetAddress').fill('123 Automation Way');
      await page.locator('input#suburb').fill('Te Aro');
      await page.locator('input#city').fill('Wellington');

      // Postcode: handlePostcodeChange strips non-numeric chars.
      // Use fill() with a numeric string — valid 4-digit NZ postcode.
      await page.locator('input#postcode').fill('6011');

      // ── Step 9: Submit the form ────────────────────────────────────────────
      // Only one <button type="submit"> exists on the dashboard page (Submit).
      await page.locator('button[type="submit"]').click();

      // ── Step 10: Assert the inline success banner is visible ───────────────
      // page.tsx renders: <div id="successBanner" role="alert"> after setFormSuccess(true).
      // This is a static inline element — NOT a modal/dialog/overlay.
      await expect(
        page.locator('#successBanner')
      ).toBeVisible({ timeout: 5_000 });

      await expect(page.locator('#successBanner')).toContainText(
        'Form submitted successfully!'
      );
      await expect(page.locator('#successBanner')).toContainText(
        'Your address details have been recorded.'
      );

      // ── Step 11: Confirm no modal overlay / Close button appeared ──────────
      // If a browser alert() fired it would block Playwright — we assert no
      // dialog-style "Close" button exists anywhere in the DOM.
      await expect(page.locator('button:has-text("Close")')).not.toBeVisible();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();
    }
  );

});
