const ExcelJS = require('exceljs');
const path = require('path');

async function generateTestPlan() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'QA Lead';
  workbook.created = new Date(2026, 4, 16);

  const ws = workbook.addWorksheet('Master Test Plan', {
    views: [{ state: 'normal', zoomScale: 90 }],
  });

  // ── Style Constants ──────────────────────────────────────────────────────
  const YELLOW_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC000' } };
  const LIGHT_GRAY_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
  const WHITE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };

  const THIN_BORDER = {
    top: { style: 'thin', color: { argb: 'FF999999' } },
    left: { style: 'thin', color: { argb: 'FF999999' } },
    bottom: { style: 'thin', color: { argb: 'FF999999' } },
    right: { style: 'thin', color: { argb: 'FF999999' } },
  };

  const TITLE_FONT = { name: 'Calibri', size: 16, bold: true, color: { argb: 'FF1A1A1A' } };
  const HEADER_FONT = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1A1A1A' } };
  const BODY_FONT = { name: 'Calibri', size: 10, color: { argb: 'FF333333' } };
  const META_LABEL_FONT = { name: 'Calibri', size: 10, bold: true, color: { argb: 'FF333333' } };
  const META_VALUE_FONT = { name: 'Calibri', size: 10, color: { argb: 'FF333333' } };
  const SECTION_FONT = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FF1A1A1A' } };

  const WRAP_ALIGNMENT = { vertical: 'top', wrapText: true };

  // ── Column Widths ────────────────────────────────────────────────────────
  ws.columns = [
    { key: 'A', width: 28 },  // Test Item
    { key: 'B', width: 36 },  // Test Strategy
    { key: 'C', width: 22 },  // Testing Types
    { key: 'D', width: 42 },  // Features to Be Tested
    { key: 'E', width: 28 },  // Features Not to Be Tested
    { key: 'F', width: 26 },  // Entry Criteria
    { key: 'G', width: 32 },  // Exit Criteria
    { key: 'H', width: 30 },  // Deliverables
    { key: 'I', width: 28 },  // Dependencies
    { key: 'J', width: 14 },  // Start Date
    { key: 'K', width: 14 },  // End Date
    { key: 'L', width: 14 },  // Assignee
    { key: 'M', width: 22 },  // KPIs
    { key: 'N', width: 42 },  // Risk & Mitigation Plan
    { key: 'O', width: 14 },  // Sign-Off
  ];

  // ── Helper: apply style to a cell ────────────────────────────────────────
  function styleCell(cell, { font, fill, alignment, border, numFmt } = {}) {
    if (font) cell.font = font;
    if (fill) cell.fill = fill;
    if (alignment) cell.alignment = alignment;
    if (border) cell.border = border;
    if (numFmt) cell.numFmt = numFmt;
  }

  // ── Helper: merge and style a metadata block ─────────────────────────────
  function mergedBlock(startRow, startCol, endRow, endCol, value, font, fill) {
    ws.mergeCells(startRow, startCol, endRow, endCol);
    const cell = ws.getCell(startRow, startCol);
    cell.value = value;
    styleCell(cell, {
      font: font || BODY_FONT,
      fill: fill || WHITE_FILL,
      alignment: { vertical: 'top', wrapText: true, horizontal: 'left' },
    });
  }

  // ── Helper: set a metadata key-value pair in columns E-F ─────────────────
  function metaProperty(row, label, value, valueFill, valueFont) {
    const labelCell = ws.getCell(row, 5); // Column E
    labelCell.value = label;
    styleCell(labelCell, {
      font: META_LABEL_FONT,
      fill: LIGHT_GRAY_FILL,
      alignment: WRAP_ALIGNMENT,
      border: THIN_BORDER,
    });

    const valueCell = ws.getCell(row, 6); // Column F
    valueCell.value = value;
    styleCell(valueCell, {
      font: valueFont || META_VALUE_FONT,
      fill: valueFill || WHITE_FILL,
      alignment: WRAP_ALIGNMENT,
      border: THIN_BORDER,
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // ROW 1: Title
  // ════════════════════════════════════════════════════════════════════════════
  mergedBlock(1, 1, 1, 4, 'Aioi App Automation & API Test Plan', TITLE_FONT, YELLOW_FILL);
  ws.getRow(1).height = 32;

  // ════════════════════════════════════════════════════════════════════════════
  // ROW 2: Introduction
  // ════════════════════════════════════════════════════════════════════════════
  const introLabel = ws.getCell(2, 1);
  introLabel.value = 'Introduction';
  styleCell(introLabel, { font: SECTION_FONT, fill: YELLOW_FILL, alignment: WRAP_ALIGNMENT, border: THIN_BORDER });

  mergedBlock(2, 2, 2, 4,
    'Validating core user validation matrices, frontend conditional form toggles, and NZ Post API network integration layers within the Aioi ecosystem using custom validation frameworks.',
    BODY_FONT, WHITE_FILL
  );
  // Apply border to the merged intro cell
  styleCell(ws.getCell(2, 2), { border: THIN_BORDER });
  ws.getRow(2).height = 42;

  // ════════════════════════════════════════════════════════════════════════════
  // ROW 3: Blank separator
  // ════════════════════════════════════════════════════════════════════════════
  ws.getRow(3).height = 8;

  // ════════════════════════════════════════════════════════════════════════════
  // ROWS 4-5: Objectives
  // ════════════════════════════════════════════════════════════════════════════
  const objLabel = ws.getCell(4, 1);
  objLabel.value = 'Objectives';
  styleCell(objLabel, { font: SECTION_FONT, fill: YELLOW_FILL, alignment: WRAP_ALIGNMENT, border: THIN_BORDER });

  mergedBlock(4, 2, 5, 4,
    '1. Maintain 100% automated UI/API assertion coverage.\n2. Verify granular, step-by-step missing-field error messaging on form submissions.\n3. Ensure clean visual UI transitions during address-entry mode switches.',
    BODY_FONT, WHITE_FILL
  );
  styleCell(ws.getCell(4, 2), { border: THIN_BORDER });
  ws.getRow(4).height = 28;
  ws.getRow(5).height = 28;

  // ════════════════════════════════════════════════════════════════════════════
  // ROW 6: Blank separator
  // ════════════════════════════════════════════════════════════════════════════
  ws.getRow(6).height = 8;

  // ════════════════════════════════════════════════════════════════════════════
  // ROWS 7-8: Scope
  // ════════════════════════════════════════════════════════════════════════════
  const scopeLabel = ws.getCell(7, 1);
  scopeLabel.value = 'Scope';
  styleCell(scopeLabel, { font: SECTION_FONT, fill: YELLOW_FILL, alignment: WRAP_ALIGNMENT, border: THIN_BORDER });

  mergedBlock(7, 2, 8, 4,
    'In-Scope: Playwright E2E testing, standalone and combination empty-state field tracking, state cleansing rules (removing search errors when entering manual mode), and mock API interception testing.\n\nOut-of-Scope: Standard browser tooltips (HTML5 default behavior) and live key production endpoints during mock phases.',
    BODY_FONT, WHITE_FILL
  );
  styleCell(ws.getCell(7, 2), { border: THIN_BORDER });
  ws.getRow(7).height = 32;
  ws.getRow(8).height = 32;

  // ════════════════════════════════════════════════════════════════════════════
  // ROW 9: Blank separator
  // ════════════════════════════════════════════════════════════════════════════
  ws.getRow(9).height = 8;

  // ════════════════════════════════════════════════════════════════════════════
  // Metadata Context Properties (Columns E & F, Rows 1-8)
  // ════════════════════════════════════════════════════════════════════════════
  metaProperty(1, 'Test Plan ID', 'AIOI-TP-2026.02');
  metaProperty(2, 'Test Plan Author', 'QA Lead');
  metaProperty(3, 'Date', '05/16/2026');
  metaProperty(4, 'Test Management Tool', 'Playwright + GitHub Actions', YELLOW_FILL, { ...META_VALUE_FONT, bold: true });
  metaProperty(5, 'Progress Tracker', '0%', YELLOW_FILL, { ...META_VALUE_FONT, bold: true });

  // ════════════════════════════════════════════════════════════════════════════
  // ROW 10: Blank separator before grid
  // ════════════════════════════════════════════════════════════════════════════
  ws.getRow(10).height = 10;

  // ════════════════════════════════════════════════════════════════════════════
  // ROW 11: Master Grid Column Headers
  // ════════════════════════════════════════════════════════════════════════════
  const headers = [
    'Test Item', 'Test Strategy', 'Testing Types', 'Features to Be Tested',
    'Features Not to Be Tested', 'Entry Criteria', 'Exit Criteria', 'Deliverables',
    'Dependencies', 'Start Date', 'End Date', 'Assignee', 'KPIs',
    'Risk & Mitigation Plan', 'Sign-Off',
  ];

  const headerRow = ws.getRow(11);
  headerRow.height = 28;
  headers.forEach((header, idx) => {
    const cell = ws.getCell(11, idx + 1);
    cell.value = header;
    styleCell(cell, {
      font: HEADER_FONT,
      fill: YELLOW_FILL,
      alignment: { vertical: 'middle', horizontal: 'center', wrapText: true },
      border: THIN_BORDER,
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // DATA ROWS (12+)
  // ════════════════════════════════════════════════════════════════════════════
  const dataRows = [
    // Row 12: Login Authentication - Missing State Validation Waterfall
    {
      'Test Item': 'Login Authentication – Missing State Validation Waterfall',
      'Test Strategy': 'Playwright script-driven boundary/empty entry checks to mimic button clicks.',
      'Testing Types': 'Functional UI, Edge-case validation',
      'Features to Be Tested': 'Submitting with both inputs empty renders separate custom "Please enter email" and "Please enter password" text blocks; entering email only isolates the password error; entering password only isolates the email error; typing inside a flagged input instantly clears its error text and red border.',
      'Features Not to Be Tested': 'Browser native HTML5 tooltip validation bubbles.',
      'Entry Criteria': 'Login page accessible at /login route; noValidate attribute present on <form>.',
      'Exit Criteria': 'Form uses the noValidate parent property so native browser bubbles are suppressed in favor of custom UI rendering.',
      'Deliverables': 'tests/auth-validation.spec.js automated script.',
      'Dependencies': 'Playwright test runner configured; dev server running.',
      'Start Date': '05/16/2026',
      'End Date': '',
      'Assignee': 'QA Lead',
      'KPIs': '100% field-level error coverage',
      'Risk & Mitigation Plan': 'High Risk: Browser native tooltips block UI assertions.\nMitigation: Enforce noValidate checks on the main form context element.',
      'Sign-Off': '',
    },
    // Row 13: Login Authentication - Credentials Matching
    {
      'Test Item': 'Login Authentication – Credentials Matching',
      'Test Strategy': 'Hardcoded credential matching verification.',
      'Testing Types': 'Functional UI, Boundary testing',
      'Features to Be Tested': 'Input string validation against admin@test.com and Admin123; boundary error messaging for incorrect credentials; redirect route matching to the Address Checker interface upon successful login.',
      'Features Not to Be Tested': 'Password strength enforcement; account lockout policies.',
      'Entry Criteria': 'Login page loaded with valid form elements.',
      'Exit Criteria': 'Successful login redirects to "/" dashboard; failed login displays inline error message.',
      'Deliverables': 'tests/auth-credentials.spec.js automated spec file.',
      'Dependencies': 'Hardcoded credentials configured in login handler.',
      'Start Date': '05/16/2026',
      'End Date': '',
      'Assignee': 'QA Lead',
      'KPIs': '100% credential path coverage',
      'Risk & Mitigation Plan': 'Low Risk: Hardcoded credentials may change.\nMitigation: Centralise credential constants for single-point updates.',
      'Sign-Off': '',
    },
    // Row 14: Address Checker - Mode Swapping & State Cleansing
    {
      'Test Item': 'Address Checker – Mode Swapping & State Cleansing',
      'Test Strategy': 'Functional Playwright visibility assertions during link clicks.',
      'Testing Types': 'Interaction, Usability',
      'Features to Be Tested': 'Clicking "enter here manually" exposes the hidden Street, Suburb, City, and Postcode fields; clicking this mode switch instantly purges/nullifies any preexisting "No matching address found" validation message from the screen view.',
      'Features Not to Be Tested': 'Styling/pixel-level CSS validation of form fields.',
      'Entry Criteria': 'User authenticated and on the Address Checker page.',
      'Exit Criteria': 'Verification that the legacy address search error state cannot linger in the viewport once manual mode is active.',
      'Deliverables': 'tests/address-toggle.spec.js automated interaction spec.',
      'Dependencies': 'Authentication flow passing; address search API route available.',
      'Start Date': '05/16/2026',
      'End Date': '',
      'Assignee': 'QA Lead',
      'KPIs': '100% mode-switch state assertions',
      'Risk & Mitigation Plan': 'Medium Risk: Timing issues with state transitions.\nMitigation: Use Playwright auto-waiting and explicit waitFor assertions.',
      'Sign-Off': '',
    },
    // Row 15: NZ Post API Integration & Fallbacks
    {
      'Test Item': 'NZ Post Autocomplete Address API Endpoint',
      'Test Strategy': 'Network interception using Playwright\'s page.route() router to simulate varying server responses.',
      'Testing Types': 'API Integration, Mock Fallback Verification',
      'Features to Be Tested': 'Successful query parameter formatting; data-mapping arrays from a simulated 200 OK block; automatic graceful fallback trigger opening manual address forms instantly when a 500 Internal Server Error is intercepted.',
      'Features Not to Be Tested': 'Live NZ Post production endpoint availability; real API key validation.',
      'Entry Criteria': 'API route /api/address operational; Playwright route interception configured.',
      'Exit Criteria': 'All mock response scenarios (200, 500, empty results) handled gracefully with correct UI state transitions.',
      'Deliverables': 'tests/nz-post-api.spec.js paired with mock fixture assets.',
      'Dependencies': 'Valid locally loaded .env.local variable parsing configuration.',
      'Start Date': '05/16/2026',
      'End Date': '',
      'Assignee': 'QA Lead',
      'KPIs': '100% API response path coverage',
      'Risk & Mitigation Plan': 'High Risk: Real API contract may differ from mock structure.\nMitigation: Maintain a living fixture schema file; run contract tests once real keys are available.',
      'Sign-Off': '',
    },
  ];

  dataRows.forEach((rowData, rowIdx) => {
    const rowNum = 12 + rowIdx;
    const row = ws.getRow(rowNum);
    row.height = 85;

    headers.forEach((header, colIdx) => {
      const cell = ws.getCell(rowNum, colIdx + 1);
      cell.value = rowData[header] || '';
      const isEvenRow = rowIdx % 2 === 1;
      styleCell(cell, {
        font: BODY_FONT,
        fill: isEvenRow ? LIGHT_GRAY_FILL : WHITE_FILL,
        alignment: WRAP_ALIGNMENT,
        border: THIN_BORDER,
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // Print Settings
  // ════════════════════════════════════════════════════════════════════════════
  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    paperSize: 9, // A4
  };

  // ════════════════════════════════════════════════════════════════════════════
  // Write Output
  // ════════════════════════════════════════════════════════════════════════════
  const outputPath = path.join(__dirname, 'Aioi_Automation_Master_Test_Plan.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`✅ Test plan generated successfully: ${outputPath}`);
}

generateTestPlan().catch((err) => {
  console.error('❌ Failed to generate test plan:', err);
  process.exit(1);
});
