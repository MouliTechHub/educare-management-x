import { test, expect } from '@playwright/test';

test.describe('PYD Golden Scenarios - Rock-solid Previous Year Dues', () => {
  
  test('Scenario 1: Promotion with dues - Correct year scoping and PYD creation', async ({ page }) => {
    // Test: AY 2025-2026 fee ₹22k, discount ₹5k, payment ₹10k → outstanding ₹7k → promote to 2026-2027
    
    await page.goto('/');
    
    // Set up initial year (2025-2026)
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2025-2026');
    
    // Create student with fee structure
    await page.click('[data-testid="student-management"]');
    await page.click('[data-testid="add-student"]');
    
    await page.fill('[data-testid="first-name"]', 'Test');
    await page.fill('[data-testid="last-name"]', 'Student');
    await page.fill('[data-testid="admission-number"]', 'PYD001');
    await page.selectOption('[data-testid="class-select"]', '1st Grade');
    await page.selectOption('[data-testid="gender"]', 'Male');
    await page.fill('[data-testid="date-of-birth"]', '2015-01-01');
    
    await page.click('[data-testid="save-student"]');
    await expect(page.locator('text=Student created successfully')).toBeVisible();
    
    // Navigate to Fee Management to verify fee creation
    await page.click('[data-testid="fee-management"]');
    await expect(page.locator('text=₹22,000')).toBeVisible(); // Original tuition fee
    
    // Apply discount of ₹5,000
    await page.click('[data-testid="fee-row-actions"]');
    await page.click('text=Apply Discount');
    
    await page.selectOption('[data-testid="discount-type"]', 'Fixed Amount');
    await page.fill('[data-testid="discount-amount"]', '5000');
    await page.fill('[data-testid="discount-reason"]', 'Test discount');
    await page.click('[data-testid="apply-discount"]');
    
    await expect(page.locator('text=Discount applied successfully')).toBeVisible();
    await expect(page.locator('text=₹5,000')).toBeVisible(); // Discount amount
    
    // Make payment of ₹10,000
    await page.click('[data-testid="record-payment"]');
    await page.fill('[data-testid="payment-amount"]', '10000');
    await page.selectOption('[data-testid="payment-method"]', 'Cash');
    await page.fill('[data-testid="receipt-number"]', 'RCP001');
    await page.click('[data-testid="save-payment"]');
    
    await expect(page.locator('text=Payment recorded successfully')).toBeVisible();
    
    // Verify outstanding balance = ₹7,000 (22,000 - 5,000 - 10,000)
    await expect(page.locator('[data-testid="outstanding-balance"]')).toContainText('₹7,000');
    
    // Now promote to 2026-2027
    await page.click('[data-testid="academic-year-management"]');
    await page.click('[data-testid="student-promotion"]');
    
    await page.selectOption('[data-testid="source-year"]', '2025-2026');
    await page.selectOption('[data-testid="target-year"]', '2026-2027');
    await page.click('[data-testid="execute-promotion"]');
    
    await expect(page.locator('text=Promotion completed successfully')).toBeVisible();
    
    // Switch to 2026-2027 and verify PYD
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2026-2027');
    
    await page.click('[data-testid="fee-management"]');
    
    // Verify 2026-2027 has PYD of ₹7k + new tuition ₹25k
    await expect(page.locator('[data-testid="pyd-badge"]')).toContainText('₹7,000');
    await expect(page.locator('text=Previous Year Dues')).toBeVisible();
    await expect(page.locator('text=₹25,000')).toBeVisible(); // New tuition fee
    
    // Verify PYD summary totals
    await expect(page.locator('[data-testid="pyd-summary-total"]')).toContainText('₹7,000');
    
    // Check that 2025-2026 remains unchanged
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2025-2026');
    
    await expect(page.locator('[data-testid="pyd-badge"]')).not.toBeVisible(); // No PYD in source year
    
    // Check future years (2027-2028, 2028-2029) have PYD totals = 0
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2027-2028');
    await expect(page.locator('[data-testid="pyd-summary-total"]')).toContainText('₹0');
    
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2028-2029');
    await expect(page.locator('[data-testid="pyd-summary-total"]')).toContainText('₹0');
  });

  test('Scenario 2: Idempotency - Running promotion twice should be safe', async ({ page }) => {
    await page.goto('/');
    
    // Set up promotion scenario
    await page.click('[data-testid="academic-year-management"]');
    await page.click('[data-testid="student-promotion"]');
    
    await page.selectOption('[data-testid="source-year"]', '2025-2026');
    await page.selectOption('[data-testid="target-year"]', '2026-2027');
    
    // First promotion execution
    await page.click('[data-testid="execute-promotion"]');
    await expect(page.locator('text=Promotion completed successfully')).toBeVisible();
    
    // Capture initial counts
    const firstResponse = await page.locator('[data-testid="promotion-result"]').textContent();
    const firstPydRows = firstResponse?.match(/pyd_rows: (\d+)/)?.[1];
    
    // Second promotion execution (should be idempotent)
    await page.click('[data-testid="execute-promotion"]');
    await expect(page.locator('text=Promotion completed successfully')).toBeVisible();
    
    // Verify second call returns pyd_rows=0 (no new PYD records created)
    const secondResponse = await page.locator('[data-testid="promotion-result"]').textContent();
    expect(secondResponse).toContain('pyd_rows: 0');
    
    // Verify no duplicate PYD records exist
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2026-2027');
    await page.click('[data-testid="fee-management"]');
    
    // Should only have one PYD record per student
    const pydRecords = await page.locator('[data-testid="fee-type"]:has-text("Previous Year Dues")').count();
    expect(pydRecords).toBe(1); // Only one PYD record per student
  });

  test('Scenario 3: Payment separation - Current vs PYD payments', async ({ page }) => {
    await page.goto('/');
    
    // Navigate to 2026-2027 (has both current and PYD fees)
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2026-2027');
    await page.click('[data-testid="fee-management"]');
    
    // Record payment on current year tuition
    await page.click('[data-testid="tuition-fee-actions"]');
    await page.click('text=Record Payment');
    await page.fill('[data-testid="payment-amount"]', '5000');
    await page.selectOption('[data-testid="payment-method"]', 'Cash');
    await page.fill('[data-testid="receipt-number"]', 'TUI001');
    await page.click('[data-testid="save-payment"]');
    
    // Record payment on PYD
    await page.click('[data-testid="pyd-fee-actions"]');
    await page.click('text=Record Payment');
    await page.fill('[data-testid="payment-amount"]', '2000');
    await page.selectOption('[data-testid="payment-method"]', 'Online');
    await page.fill('[data-testid="receipt-number"]', 'PYD001');
    await page.click('[data-testid="save-payment"]');
    
    // Open "Previous Dues" tab
    await page.click('[data-testid="previous-dues-tab"]');
    
    // Verify only PYD payment appears (RCP: PYD001)
    await expect(page.locator('text=PYD001')).toBeVisible();
    await expect(page.locator('text=₹2,000')).toBeVisible();
    
    // Verify current year payment does NOT appear in Previous Dues tab
    await expect(page.locator('text=TUI001')).not.toBeVisible();
    
    // Switch to "Current Year" tab
    await page.click('[data-testid="current-year-tab"]');
    
    // Verify current year payment appears (RCP: TUI001)
    await expect(page.locator('text=TUI001')).toBeVisible();
    await expect(page.locator('text=₹5,000')).toBeVisible();
    
    // Verify PYD payment does NOT appear in Current Year tab
    await expect(page.locator('text=PYD001')).not.toBeVisible();
  });

  test('Scenario 4: Discount tagging for PYD', async ({ page }) => {
    await page.goto('/');
    
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2026-2027');
    await page.click('[data-testid="fee-management"]');
    
    // Apply tagged discount to PYD
    await page.click('[data-testid="pyd-fee-actions"]');
    await page.click('text=Apply Discount');
    
    // Verify PYD-specific discount dialog
    await expect(page.locator('[data-testid="pyd-badge"]')).toBeVisible();
    await expect(page.locator('text=Apply Previous Year Dues Discount')).toBeVisible();
    
    // Fill discount form with tagging
    await page.selectOption('[data-testid="discount-type"]', 'Fixed Amount');
    await page.fill('[data-testid="discount-amount"]', '1000');
    await page.selectOption('[data-testid="discount-tag"]', 'Parent Request');
    await page.fill('[data-testid="discount-reason"]', 'Financial hardship');
    await page.fill('[data-testid="discount-notes"]', 'Approved by principal');
    
    await page.click('[data-testid="apply-discount"]');
    await expect(page.locator('text=PYD Discount applied successfully')).toBeVisible();
    
    // Verify discount history shows chips: PYD + Parent Request
    await page.click('[data-testid="view-discount-history"]');
    
    await expect(page.locator('[data-testid="discount-chip-pyd"]')).toBeVisible();
    await expect(page.locator('[data-testid="discount-chip-parent-request"]')).toBeVisible();
    
    // Verify total outstanding decreased by ₹1,000
    const newOutstanding = await page.locator('[data-testid="pyd-outstanding"]').textContent();
    expect(newOutstanding).toContain('₹6,000'); // 7,000 - 1,000
    
    // Verify PYD summary reflects updated total
    await expect(page.locator('[data-testid="pyd-summary-total"]')).toContainText('₹6,000');
  });

  test('Scenario 5: Year-scoped caching validation', async ({ page }) => {
    await page.goto('/');
    
    // Make changes in 2026-2027
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2026-2027');
    await page.click('[data-testid="fee-management"]');
    
    // Record a payment
    await page.click('[data-testid="pyd-fee-actions"]');
    await page.click('text=Record Payment');
    await page.fill('[data-testid="payment-amount"]', '1000');
    await page.selectOption('[data-testid="payment-method"]', 'Cash');
    await page.fill('[data-testid="receipt-number"]', 'CACHE001');
    await page.click('[data-testid="save-payment"]');
    
    // Switch to different year and verify no cross-contamination
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2025-2026');
    
    // Verify 2025-2026 data unchanged
    await expect(page.locator('text=CACHE001')).not.toBeVisible();
    await expect(page.locator('[data-testid="pyd-summary-total"]')).toContainText('₹0');
    
    // Switch back to 2026-2027 and verify changes are still there
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2026-2027');
    
    await expect(page.locator('text=CACHE001')).toBeVisible();
    await expect(page.locator('[data-testid="pyd-summary-total"]')).not.toContainText('₹0');
  });

  test('Scenario 6: Enrollment year-scoped class display', async ({ page }) => {
    await page.goto('/');
    
    // Create a student and promote them through multiple classes
    await page.click('[data-testid="student-management"]');
    await page.click('[data-testid="add-student"]');
    
    await page.fill('[data-testid="first-name"]', 'Year');
    await page.fill('[data-testid="last-name"]', 'Scope');
    await page.fill('[data-testid="admission-number"]', 'YRS001');
    await page.selectOption('[data-testid="class-select"]', '1st Grade');
    await page.selectOption('[data-testid="gender"]', 'Female');
    await page.fill('[data-testid="date-of-birth"]', '2016-01-01');
    
    await page.click('[data-testid="save-student"]');
    
    // Verify in 2025-2026 shows as 1st Grade
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2025-2026');
    await page.click('[data-testid="fee-management"]');
    
    await expect(page.locator('[data-testid="student-class"]')).toContainText('1st Grade');
    
    // Promote to 2026-2027 (should advance to 2nd Grade)
    await page.click('[data-testid="academic-year-management"]');
    await page.click('[data-testid="student-promotion"]');
    await page.selectOption('[data-testid="source-year"]', '2025-2026');
    await page.selectOption('[data-testid="target-year"]', '2026-2027');
    await page.click('[data-testid="execute-promotion"]');
    
    // Verify in 2026-2027 shows as 2nd Grade
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2026-2027');
    await page.click('[data-testid="fee-management"]');
    
    await expect(page.locator('[data-testid="student-class"]')).toContainText('2nd Grade');
    
    // Verify 2025-2026 still shows as 1st Grade (not students.class_id)
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2025-2026');
    await page.click('[data-testid="fee-management"]');
    
    await expect(page.locator('[data-testid="student-class"]')).toContainText('1st Grade');
  });
});

test.describe('PYD Data Integrity Tests', () => {
  
  test('Canonical outstanding formula consistency', async ({ page }) => {
    // Test that outstanding = GREATEST(actual_fee - paid_amount - discount_amount, 0)
    // across all UI displays and calculations
    
    await page.goto('/');
    await page.click('[data-testid="fee-management"]');
    
    // Find a fee record and verify calculation
    const actualFee = await page.locator('[data-testid="actual-fee"]').first().textContent();
    const paidAmount = await page.locator('[data-testid="paid-amount"]').first().textContent();
    const discountAmount = await page.locator('[data-testid="discount-amount"]').first().textContent();
    const displayedOutstanding = await page.locator('[data-testid="outstanding-amount"]').first().textContent();
    
    const actual = parseFloat(actualFee?.replace(/[₹,]/g, '') || '0');
    const paid = parseFloat(paidAmount?.replace(/[₹,]/g, '') || '0');
    const discount = parseFloat(discountAmount?.replace(/[₹,]/g, '') || '0');
    const displayed = parseFloat(displayedOutstanding?.replace(/[₹,]/g, '') || '0');
    
    const calculated = Math.max(0, actual - paid - discount);
    
    expect(displayed).toBe(calculated);
  });

  test('PYD uniqueness constraint enforcement', async ({ page }) => {
    // Verify that only one PYD record exists per student per academic year
    
    await page.goto('/api-testing'); // Assume we have an API testing interface
    
    // Attempt to create duplicate PYD record
    const response = await page.evaluate(async () => {
      const response = await fetch('/api/student-fee-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: 'test-student-id',
          academic_year_id: 'test-year-id',
          fee_type: 'Previous Year Dues',
          actual_fee: 5000
        })
      });
      return response.status;
    });
    
    // Should fail due to unique constraint
    expect(response).toBe(409); // Conflict
  });

  test('Source year immutability during promotion', async ({ page }) => {
    // Test that source year data remains unchanged during promotion
    
    await page.goto('/');
    
    // Capture source year totals before promotion
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2025-2026');
    await page.click('[data-testid="fee-management"]');
    
    const beforeTotal = await page.locator('[data-testid="total-fees"]').textContent();
    const beforePaid = await page.locator('[data-testid="total-paid"]').textContent();
    
    // Execute promotion
    await page.click('[data-testid="academic-year-management"]');
    await page.click('[data-testid="student-promotion"]');
    await page.selectOption('[data-testid="source-year"]', '2025-2026');
    await page.selectOption('[data-testid="target-year"]', '2026-2027');
    await page.click('[data-testid="execute-promotion"]');
    
    // Verify source year totals unchanged
    await page.click('[data-testid="academic-year-selector"]');
    await page.click('text=2025-2026');
    await page.click('[data-testid="fee-management"]');
    
    const afterTotal = await page.locator('[data-testid="total-fees"]').textContent();
    const afterPaid = await page.locator('[data-testid="total-paid"]').textContent();
    
    expect(afterTotal).toBe(beforeTotal);
    expect(afterPaid).toBe(beforePaid);
  });
});
