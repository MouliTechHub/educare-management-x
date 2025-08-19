import { test, expect } from '@playwright/test';

test.describe('Previous Year Dues Display Fix', () => {
  test('PYD should only appear in target year grid after promotion', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');

    // Step 1: Setup test data - Create academic years
    await page.evaluate(async () => {
      const { supabase } = await import('/src/integrations/supabase/client.ts');
      
      // Create 2025-2026 academic year
      await supabase.from('academic_years').upsert({
        id: '2025-2026-test-id',
        year_name: '2025-2026',
        start_date: '2025-04-01',
        end_date: '2026-03-31',
        is_current: false
      });

      // Create 2026-2027 academic year  
      await supabase.from('academic_years').upsert({
        id: '2026-2027-test-id',
        year_name: '2026-2027', 
        start_date: '2026-04-01',
        end_date: '2027-03-31',
        is_current: true
      });

      // Create test class
      await supabase.from('classes').upsert({
        id: 'test-class-id',
        name: 'Class 1',
        section: 'A'
      });

      // Create test student
      await supabase.from('students').upsert({
        id: 'test-student-id',
        first_name: 'Test',
        last_name: 'Student',
        admission_number: 'TEST001',
        class_id: 'test-class-id',
        status: 'Active'
      });

      // Create fee structure for 2025-2026
      await supabase.from('fee_structures').upsert({
        id: 'test-fee-structure-id',
        academic_year_id: '2025-2026-test-id',
        class_id: 'test-class-id',
        fee_type: 'Tuition Fee',
        amount: 22000,
        is_active: true
      });
    });

    // Step 2: Seed 2025-2026 with ₹22k fee, ₹15k paid (₹7k balance)
    await page.evaluate(async () => {
      const { supabase } = await import('/src/integrations/supabase/client.ts');

      // Create fee record for 2025-2026
      await supabase.from('student_fee_records').upsert({
        id: 'test-fee-record-id',
        student_id: 'test-student-id',
        class_id: 'test-class-id',
        academic_year_id: '2025-2026-test-id',
        fee_type: 'Tuition Fee',
        actual_fee: 22000,
        discount_amount: 0,
        paid_amount: 15000,
        due_date: '2026-03-31',
        status: 'Partial'
      });
    });

    // Step 3: Promote student (this should create PYD record in 2026-2027)
    await page.evaluate(async () => {
      const { supabase } = await import('/src/integrations/supabase/client.ts');

      // Call promotion RPC
      await supabase.rpc('promote_students_with_fees_by_name', {
        source_year_name: '2025-2026',
        target_year_name: '2026-2027',
        promoted_by_user: 'Test Admin'
      });
    });

    // Wait for promotion to complete
    await page.waitForTimeout(2000);

    // Step 4: Navigate to Fee Management
    await page.getByRole('link', { name: 'Fee Management' }).click();
    
    // Step 5: Test 2026-2027 view - should show ₹7k PYD
    await page.getByRole('button', { name: '2026-2027' }).click();
    await page.waitForTimeout(1000);

    // Check that Previous Year Dues is visible in 2026-2027
    await expect(page.locator('text=Previous Year Dues')).toBeVisible();
    await expect(page.locator('text=₹7,000')).toBeVisible();

    // Verify the fee table shows PYD record
    const pydRow = page.locator('tbody tr').filter({ hasText: 'Previous Year Dues' });
    await expect(pydRow).toBeVisible();
    await expect(pydRow.locator('td').filter({ hasText: '₹7,000' })).toBeVisible();

    // Step 6: Test 2025-2026 view - should show 0 PYD
    await page.getByRole('button', { name: '2025-2026' }).click();
    await page.waitForTimeout(1000);

    // Check that NO Previous Year Dues records appear in 2025-2026
    const pydRowsIn2025 = page.locator('tbody tr').filter({ hasText: 'Previous Year Dues' });
    await expect(pydRowsIn2025).toHaveCount(0);

    // Verify the original fee record still shows ₹22k/₹15k but no PYD
    const originalFeeRow = page.locator('tbody tr').filter({ hasText: 'Tuition Fee' });
    await expect(originalFeeRow).toBeVisible();
    await expect(originalFeeRow.locator('td').filter({ hasText: '₹22,000' })).toBeVisible();
    await expect(originalFeeRow.locator('td').filter({ hasText: '₹15,000' })).toBeVisible();

    // Step 7: Verify summary cards show correct values
    // In 2026-2027: should include PYD in calculations
    await page.getByRole('button', { name: '2026-2027' }).click();
    await page.waitForTimeout(1000);
    
    // Check summary cards don't show NaN or invalid values
    const summaryCards = page.locator('[data-testid="fee-summary-cards"]');
    await expect(summaryCards.locator('text=NaN')).toHaveCount(0);
    await expect(summaryCards.locator('text=Infinity')).toHaveCount(0);

    // In 2025-2026: should not include PYD (as it belongs to 2026-2027)
    await page.getByRole('button', { name: '2025-2026' }).click();
    await page.waitForTimeout(1000);
    
    const summaryCards2025 = page.locator('[data-testid="fee-summary-cards"]');
    await expect(summaryCards2025.locator('text=NaN')).toHaveCount(0);
    await expect(summaryCards2025.locator('text=Infinity')).toHaveCount(0);

    // Cleanup test data
    await page.evaluate(async () => {
      const { supabase } = await import('/src/integrations/supabase/client.ts');
      
      await supabase.from('student_fee_records').delete().eq('student_id', 'test-student-id');
      await supabase.from('fee_structures').delete().eq('id', 'test-fee-structure-id');
      await supabase.from('student_promotions').delete().eq('student_id', 'test-student-id');
      await supabase.from('students').delete().eq('id', 'test-student-id');
      await supabase.from('classes').delete().eq('id', 'test-class-id');
      await supabase.from('academic_years').delete().in('id', ['2025-2026-test-id', '2026-2027-test-id']);
    });
  });

  test('Fee summary cards should never display NaN values', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Fee Management' }).click();
    
    // Wait for data to load
    await page.waitForTimeout(2000);
    
    // Check all summary cards for NaN, Infinity, or undefined values
    const summaryCards = page.locator('[data-testid="fee-summary-cards"], .grid .text-center');
    
    // Verify no NaN values
    await expect(summaryCards.locator('text=NaN')).toHaveCount(0);
    await expect(summaryCards.locator('text=Infinity')).toHaveCount(0);
    await expect(summaryCards.locator('text=undefined')).toHaveCount(0);
    
    // Verify all numeric displays are finite numbers or zero
    const numericElements = summaryCards.locator('.text-2xl, .text-xl').filter({ hasText: /₹|%|\d/ });
    const count = await numericElements.count();
    
    for (let i = 0; i < count; i++) {
      const text = await numericElements.nth(i).textContent();
      if (text && text.match(/[\d.]/)) {
        // Extract numeric value from text like "₹1,234.00" or "85%"
        const numericPart = text.replace(/[₹,%\s,]/g, '');
        const numValue = parseFloat(numericPart);
        expect(Number.isFinite(numValue)).toBeTruthy();
      }
    }
  });
});