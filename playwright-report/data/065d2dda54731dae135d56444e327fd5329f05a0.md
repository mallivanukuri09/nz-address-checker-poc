# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e-flow.spec.js >> Aioi App — Master E2E Flow >> Login → Search "12 Customhouse Quay" → Select → Submit
- Location: QA/tests/e2e-flow.spec.js:102:3

# Error details

```
Error: page.goto: Target page, context or browser has been closed
```

# Test source

```ts
  1   | const { test, expect } = require('@playwright/test');
  2   | 
  3   | // ─────────────────────────────────────────────────────────────────────────────
  4   | // Aioi Address Checker — Master E2E Flow
  5   | //
  6   | // Architecture:
  7   | //   NO page.route() interceptors in the happy-path test.
  8   | //   All /api/address traffic flows to route.ts which selects live NZ Post API
  9   | //   or falls back to its embedded mockAddresses dataset automatically.
  10  | //
  11  | // DOM facts (from page.tsx):
  12  | //   • Dropdown items are plain <button type="button" class="w-full text-left ...">
  13  | //     — there is no role="listbox"/role="option" or ul/li structure.
  14  | //   • Suggestion text format: "address_line_1, suburb, city postcode"
  15  | //     Mock entry #1 → "101 Queen Street, Auckland CBD, Auckland 1010"
  16  | //   • Manual fields (#streetAddress, #suburb, #city, #postcode) are
  17  | //     conditionally RENDERED only when showManualFields===true.
  18  | //     After autocomplete selection they do not exist in the DOM → not.toBeVisible().
  19  | //   • The search input fires a debounced fetch (300 ms). After fill() we
  20  | //     wait for the dropdown to appear before clicking.
  21  | //   • Submit button is the only <button type="submit"> on the form.
  22  | // ─────────────────────────────────────────────────────────────────────────────
  23  | 
  24  | test.describe('Aioi App — Master E2E Flow', () => {
  25  | 
  26  |   // ── Shared login helper ──────────────────────────────────────────────────
  27  |   async function loginAs(page, email, password) {
> 28  |     await page.goto('/login');
      |                ^ Error: page.goto: Target page, context or browser has been closed
  29  |     await page.locator('input#email').fill(email);
  30  |     await page.locator('input#password').fill(password);
  31  |     // Login page: <button type="submit">Login</button>
  32  |     await page.locator('button[type="submit"]').click();
  33  |     await expect(page).toHaveURL('/');
  34  |   }
  35  | 
  36  |   // ── Test 1: Complete happy-path flow ─────────────────────────────────────
  37  |   test('Login → Name → Search → Select → Assert hidden → Submit', async ({ page }) => {
  38  | 
  39  |     // Step 1 — Login
  40  |     await loginAs(page, 'admin@test.com', 'Admin123');
  41  |     await expect(page.locator('h1')).toContainText('NZ Address Checker');
  42  | 
  43  |     // Step 2 — Populate name fields
  44  |     await page.locator('input#firstName').fill('Test');
  45  |     await page.locator('input#lastName').fill('Automation');
  46  | 
  47  |     // Step 3 — Type into the address search field
  48  |     // "101 Queen" matches route.ts mockAddresses[0]:
  49  |     //   { address_line_1: '101 Queen Street', suburb: 'Auckland CBD',
  50  |     //     city: 'Auckland', postcode: '1010' }
  51  |     // The rendered suggestion string will be:
  52  |     //   "101 Queen Street, Auckland CBD, Auckland 1010"
  53  |     // The search uses a 300 ms debounce — fill() dispatches an input event,
  54  |     // then we wait for the dropdown button to appear (up to 10 s).
  55  |     const searchInput = page.locator('input#searchAddress');
  56  |     await searchInput.fill('101 Queen');
  57  | 
  58  |     // Step 4 — Wait for dropdown and click the first suggestion
  59  |     // Selector is grounded directly in the DOM structure from page.tsx:
  60  |     //   <div class="border border-gray-200 rounded-lg bg-gray-50 ...">
  61  |     //     <button type="button" class="w-full text-left px-4 py-3 ...">
  62  |     //       101 Queen Street, Auckland CBD, Auckland 1010
  63  |     //     </button>
  64  |     //   </div>
  65  |     const firstSuggestion = page.locator('button.w-full.text-left').first();
  66  |     await firstSuggestion.waitFor({ state: 'visible', timeout: 10_000 });
  67  |     await firstSuggestion.click();
  68  | 
  69  |     // Step 5 — Assert manual entry fields are NOT visible
  70  |     // These elements are conditionally rendered (showManualFields===false after
  71  |     // autocomplete selection), so they will not be in the DOM at all.
  72  |     // not.toBeVisible() covers both "hidden" and "not in DOM" cases.
  73  |     await expect(page.locator('input#streetAddress')).not.toBeVisible();
  74  |     await expect(page.locator('input#suburb')).not.toBeVisible();
  75  |     await expect(page.locator('input#city')).not.toBeVisible();
  76  |     await expect(page.locator('input#postcode')).not.toBeVisible();
  77  | 
  78  |     // Confirm the dropdown itself has closed after selection
  79  |     await expect(page.locator('button.w-full.text-left').first()).not.toBeVisible();
  80  | 
  81  |     // Step 6 — Submit with autocomplete-selected address
  82  |     // handleSubmit validates streetAddress/suburb/city/postcode in state even
  83  |     // when the manual fields are hidden — populated by handleSelectAddress().
  84  |     page.once('dialog', dialog => {
  85  |       expect(dialog.message()).toBe('Form submitted successfully!');
  86  |       dialog.accept();
  87  |     });
  88  | 
  89  |     // Only one <button type="submit"> on the page (the blue Submit button)
  90  |     await page.locator('button[type="submit"]').click();
  91  | 
  92  |     // Confirm no validation error banner appears
  93  |     await expect(page.locator('text="Please fix the errors above"')).not.toBeVisible();
  94  |   });
  95  | 
  96  |   // ── Test 2: Second address from route.ts mock data ───────────────────────
  97  |   // Uses "12 Customhouse Quay" — mockAddresses[1] in route.ts:
  98  |   //   { address_line_1: '12 Customhouse Quay', suburb: 'Wellington Central',
  99  |   //     city: 'Wellington', postcode: '6011' }
  100 |   // Rendered suggestion: "12 Customhouse Quay, Wellington Central, Wellington 6011"
  101 |   // NO page.route() interceptor — backend handles live/mock branching naturally.
  102 |   test('Login → Search "12 Customhouse Quay" → Select → Submit', async ({ page }) => {
  103 | 
  104 |     // Step 1 — Login
  105 |     await loginAs(page, 'admin@test.com', 'Admin123');
  106 |     await expect(page.locator('h1')).toContainText('NZ Address Checker');
  107 | 
  108 |     // Step 2 — Populate name fields
  109 |     await page.locator('input#firstName').fill('Jane');
  110 |     await page.locator('input#lastName').fill('Tester');
  111 | 
  112 |     // Step 3 — Search for second mock address
  113 |     const searchInput = page.locator('input#searchAddress');
  114 |     await searchInput.fill('12 Customhouse');
  115 | 
  116 |     // Step 4 — Wait for dropdown and click first suggestion
  117 |     const firstSuggestion = page.locator('button.w-full.text-left').first();
  118 |     await firstSuggestion.waitFor({ state: 'visible', timeout: 10_000 });
  119 |     await firstSuggestion.click();
  120 | 
  121 |     // Step 5 — Manual fields must stay hidden after autocomplete selection
  122 |     await expect(page.locator('input#streetAddress')).not.toBeVisible();
  123 |     await expect(page.locator('input#suburb')).not.toBeVisible();
  124 |     await expect(page.locator('input#city')).not.toBeVisible();
  125 |     await expect(page.locator('input#postcode')).not.toBeVisible();
  126 | 
  127 |     // Step 6 — Submit and assert the in-page success banner appears
  128 |     await page.locator('button[type="submit"]').click();
```