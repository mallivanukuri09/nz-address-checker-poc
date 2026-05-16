const { test, expect } = require('@playwright/test');

// ─────────────────────────────────────────────────────────────────────────────
// Aioi Address Checker — Granular Validation & Field Correction Flow
//
// Purpose:
//   Verifies that the form dynamically surfaces and clears inline validation
//   errors as fields are progressively corrected, then confirms a clean
//   submission and secure session logout.
//
// DOM facts (from page.tsx / handleSubmit):
//   • Clicking Submit on an empty form calls setTouchedFields() for every
//     required field. Only fields that are currently rendered show their error.
//   • On initial load showManualFields===false, so only firstName/lastName
//     errors + the bottom formError banner are visible after a blank submit.
//   • Error message per field: "This field is required"
//   • Bottom banner: "Please fix the errors above before submitting."
//   • Typing into a field calls handleFieldChange → removes it from
//     touchedFields → its error disappears immediately.
//   • Manual fields (#streetAddress #suburb #city #postcode) only render
//     when showManualFields===true (after clicking the manual link).
//   • page.route() is used to guarantee zero search results so the
//     "No matching address found" state is deterministic.
//   • Success: <div id="successBanner"> — static inline element, no dialog.
// ─────────────────────────────────────────────────────────────────────────────

test.describe('Aioi App — Granular Validation & Field Correction Flow', () => {

  test(
    'Blank submit → fix names → manual entry → isolate city error → complete & logout',
    async ({ page }) => {

      // ── Step 1: Login ────────────────────────────────────────────────────
      await page.goto('/login');
      await page.locator('input#email').fill('admin@test.com');
      await page.locator('input#password').fill('Admin123');
      await page.locator('button[type="submit"]').click();

      await expect(page).toHaveURL('/');
      await expect(page.locator('h1')).toContainText('NZ Address Checker');

      // ── Step 2: Blank submit — trigger initial validation errors ─────────
      // handleSubmit adds firstName, lastName (and hidden manual fields) to
      // touchedFields. Only firstName/lastName errors are currently in the DOM.
      await page.locator('button[type="submit"]').click();

      // First Name and Last Name must show inline "This field is required"
      await expect(
        page.locator('input#firstName ~ p, input#firstName + p')
          .or(page.locator('#firstName').locator('..').locator('p.text-red-600'))
      ).toBeVisible({ timeout: 5_000 });

      await expect(
        page.locator('input#lastName ~ p, input#lastName + p')
          .or(page.locator('#lastName').locator('..').locator('p.text-red-600'))
      ).toBeVisible();

      // Bottom form-level error banner must also appear
      await expect(
        page.locator('text="Please fix the errors above before submitting."')
      ).toBeVisible();

      // ── Step 3: Fix First Name and Last Name ─────────────────────────────
      // handleFieldChange removes each field from touchedFields → error clears.
      await page.locator('input#firstName').fill('Validation');
      await page.locator('input#lastName').fill('Tester');

      // First Name / Last Name errors should now be gone
      await expect(
        page.locator('text="Please fix the errors above before submitting."')
      ).not.toBeVisible();

      // ── Step 4: Trigger "No matching address found" ──────────────────────
      // Intercept to guarantee zero results regardless of API credentials.
      await page.route('**/api/address?q=*', route =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ addresses: [], success: true }),
        })
      );

      await page.locator('input#searchAddress').fill('Invalid Address 123');
      await expect(
        page.locator('text=No matching address found')
      ).toBeVisible({ timeout: 10_000 });

      // ── Step 5: Open manual entry fields ────────────────────────────────
      await page.locator('text="Can\'t find your address? Enter manually"').click();

      // All four manual fields must now be visible
      await expect(page.locator('input#streetAddress')).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('input#suburb')).toBeVisible();
      await expect(page.locator('input#city')).toBeVisible();
      await expect(page.locator('input#postcode')).toBeVisible();

      // ── Step 6: Fill Street, Suburb, Postcode — leave City blank ────────
      await page.locator('input#streetAddress').fill('123 Automation Way');
      await page.locator('input#suburb').fill('Te Aro');
      // City intentionally left empty
      await page.locator('input#postcode').fill('6011');

      // ── Step 7: Submit with City still blank ────────────────────────────
      await page.locator('button[type="submit"]').click();

      // City must show its error; firstName/lastName errors must be absent
      await expect(page.locator('input#city')).toBeVisible();
      const cityError = page
        .locator('input#city')
        .locator('..')
        .locator('p.text-red-600');
      await expect(cityError).toBeVisible({ timeout: 5_000 });
      await expect(cityError).toContainText('This field is required');

      // Bottom error banner reappears because city is still invalid
      await expect(
        page.locator('text="Please fix the errors above before submitting."')
      ).toBeVisible();

      // firstName / lastName errors are gone (those fields are correctly filled)
      await expect(
        page.locator('input#firstName').locator('..').locator('p.text-red-600')
      ).not.toBeVisible();
      await expect(
        page.locator('input#lastName').locator('..').locator('p.text-red-600')
      ).not.toBeVisible();

      // ── Step 8: Fill City — complete all required fields ─────────────────
      await page.locator('input#city').fill('Wellington');

      // City error clears immediately on input (handleFieldChange)
      await expect(cityError).not.toBeVisible();

      // ── Step 9: Final submit — all fields valid ──────────────────────────
      await page.locator('button[type="submit"]').click();

      // Inline success banner must appear — NOT a browser alert/dialog
      await expect(
        page.locator('#successBanner')
      ).toBeVisible({ timeout: 5_000 });
      await expect(page.locator('#successBanner')).toContainText(
        'Form submitted successfully!'
      );
      await expect(page.locator('#successBanner')).toContainText(
        'Your address details have been recorded.'
      );

      // No modal or Close button should be present
      await expect(page.locator('button:has-text("Close")')).not.toBeVisible();
      await expect(page.locator('[role="dialog"]')).not.toBeVisible();

      // ── Step 10: Logout and assert session ends ──────────────────────────
      // Header: <button onClick={handleLogout}>Logout</button>
      await page.locator('button:has-text("Logout")').click();
      await expect(page).toHaveURL('/login');
    }
  );

});
