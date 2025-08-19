import { test, expect } from '@playwright/test';
import { supabase } from '../src/integrations/supabase/client';

test.describe('Promotion Flow', () => {
  test('should promote student with ₹20k paid, ₹2k balance and maintain source year integrity', async ({ page }) => {
    // Go to the application
    await page.goto('/');

    // Wait for authentication (if needed)
    await page.waitForLoadState('networkidle');

    // Seed test data
    const testData = await setupTestData();
    const { studentId, sourceYearId, targetYearId } = testData;

    try {
      // Navigate to Academic Year Management
      await page.click('text=Academic Year Management');
      await page.waitForSelector('[data-testid="promotion-dialog-trigger"]');

      // Open promotion dialog
      await page.click('[data-testid="promotion-dialog-trigger"]');
      await page.waitForSelector('[data-testid="promotion-dialog"]');

      // Execute promotion
      const promotionData = [
        {
          student_id: studentId,
          from_academic_year_id: sourceYearId,
          from_class_id: testData.classId,
          to_class_id: testData.nextClassId,
          promotion_type: 'promoted',
          reason: 'Annual promotion',
          notes: 'Test promotion'
        }
      ];

      // Call promotion API directly for testing
      const { data: promotionResult, error } = await supabase.functions.invoke('promotions-execute', {
        body: {
          promotion_data: promotionData,
          target_academic_year_id: targetYearId,
          promoted_by_user: 'Test User',
          idempotency_key: `test-${Date.now()}`
        }
      });

      expect(error).toBeNull();
      expect(promotionResult).toBeTruthy();
      expect(promotionResult.promoted_students).toBe(1);
      expect(promotionResult.fee_rows_created).toBeGreaterThan(0);
      expect(promotionResult.pyd_rows_created).toBe(1);

      // Verify source year integrity (2025-2026)
      const { data: sourceYearFees } = await supabase
        .from('student_fee_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('academic_year_id', sourceYearId);

      // Should have ₹20,000 paid and ₹2,000 balance (unchanged)
      const sourceTotal = sourceYearFees?.reduce((sum, fee) => sum + (fee.balance_fee || 0), 0) || 0;
      expect(Math.abs(sourceTotal - 2000)).toBeLessThan(1); // ₹2,000 balance

      // Verify target year structure (2026-2027)
      const { data: targetYearFees } = await supabase
        .from('student_fee_records')
        .select('*')
        .eq('student_id', studentId)
        .eq('academic_year_id', targetYearId);

      // Should have class fee rows + PYD row
      const classFees = targetYearFees?.filter(f => f.fee_type !== 'Previous Year Dues') || [];
      const pydFees = targetYearFees?.filter(f => f.fee_type === 'Previous Year Dues') || [];

      expect(classFees.length).toBeGreaterThan(0);
      expect(pydFees.length).toBe(1);
      expect(pydFees[0].actual_fee).toBeCloseTo(2000, 0); // ₹2,000 PYD

      // Check UI cards show finite numbers (no NaN)
      await page.reload();
      await page.waitForLoadState('networkidle');

      // Check fee management cards
      await page.click('text=Fee Management');
      await page.waitForSelector('.text-2xl');

      const cardValues = await page.$$eval('.text-2xl', elements => 
        elements.map(el => el.textContent?.replace(/[₹,]/g, '') || '0')
      );

      // Ensure no NaN values in UI
      cardValues.forEach(value => {
        expect(value).not.toBe('NaN');
        expect(value).not.toBe('Infinity');
        expect(isNaN(parseFloat(value))).toBe(false);
      });

    } finally {
      // Cleanup test data
      await cleanupTestData(testData);
    }
  });
});

async function setupTestData() {
  // Create academic years
  const { data: sourceYear } = await supabase
    .from('academic_years')
    .insert({
      year_name: '2025-2026',
      start_date: '2025-04-01',
      end_date: '2026-03-31',
      is_current: true
    })
    .select()
    .single();

  const { data: targetYear } = await supabase
    .from('academic_years')
    .insert({
      year_name: '2026-2027', 
      start_date: '2026-04-01',
      end_date: '2027-03-31',
      is_current: false
    })
    .select()
    .single();

  // Create classes
  const { data: class5 } = await supabase
    .from('classes')
    .insert({ name: '5', section: 'A' })
    .select()
    .single();

  const { data: class6 } = await supabase
    .from('classes')
    .insert({ name: '6', section: 'A' })
    .select()
    .single();

  // Create student
  const { data: student } = await supabase
    .from('students')
    .insert({
      first_name: 'Test',
      last_name: 'Student',
      admission_number: `TEST${Date.now()}`,
      class_id: class5.id,
      date_of_birth: '2010-01-01',
      gender: 'Male'
    })
    .select()
    .single();

  // Create fee structures for both years
  const feeTypes = ['Tuition Fee', 'Library Fee', 'Activity Fee'];
  
  for (const feeType of feeTypes) {
    // Source year fee structure
    await supabase.from('fee_structures').insert({
      class_id: class5.id,
      academic_year_id: sourceYear.id,
      fee_type: feeType,
      amount: feeType === 'Tuition Fee' ? 15000 : 2500,
      frequency: 'Annual'
    });

    // Target year fee structure 
    await supabase.from('fee_structures').insert({
      class_id: class6.id,
      academic_year_id: targetYear.id,
      fee_type: feeType,
      amount: feeType === 'Tuition Fee' ? 16000 : 3000,
      frequency: 'Annual'
    });
  }

  // Create fee records with ₹20k paid, ₹2k balance
  await supabase.from('student_fee_records').insert([
    {
      student_id: student.id,
      class_id: class5.id,
      academic_year_id: sourceYear.id,
      fee_type: 'Tuition Fee',
      actual_fee: 15000,
      paid_amount: 13000, // ₹13k paid
      discount_amount: 0,
      status: 'Partial'
    },
    {
      student_id: student.id,
      class_id: class5.id, 
      academic_year_id: sourceYear.id,
      fee_type: 'Library Fee',
      actual_fee: 2500,
      paid_amount: 2500, // ₹2.5k paid (full)
      discount_amount: 0,
      status: 'Paid'
    },
    {
      student_id: student.id,
      class_id: class5.id,
      academic_year_id: sourceYear.id,
      fee_type: 'Activity Fee', 
      actual_fee: 2500,
      paid_amount: 2500, // ₹2.5k paid (full)
      discount_amount: 0,
      status: 'Paid'
    },
    {
      student_id: student.id,
      class_id: class5.id,
      academic_year_id: sourceYear.id,
      fee_type: 'Transport Fee',
      actual_fee: 2000,
      paid_amount: 0, // ₹2k pending (balance)
      discount_amount: 0,
      status: 'Pending'
    }
  ]);

  return {
    sourceYearId: sourceYear.id,
    targetYearId: targetYear.id,
    studentId: student.id,
    classId: class5.id,
    nextClassId: class6.id,
    sourceYear,
    targetYear,
    student,
    class5,
    class6
  };
}

async function cleanupTestData(testData: any) {
  // Delete in reverse order of dependencies
  await supabase.from('student_fee_records').delete().eq('student_id', testData.studentId);
  await supabase.from('student_promotions').delete().eq('student_id', testData.studentId);
  await supabase.from('fee_structures').delete().in('academic_year_id', [testData.sourceYearId, testData.targetYearId]);
  await supabase.from('students').delete().eq('id', testData.studentId);
  await supabase.from('classes').delete().in('id', [testData.classId, testData.nextClassId]);
  await supabase.from('academic_years').delete().in('id', [testData.sourceYearId, testData.targetYearId]);
}
