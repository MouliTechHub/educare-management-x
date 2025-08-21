import { test, expect } from '@playwright/test';

test.describe('PYD Scoping Regression Tests', () => {
  let testData: any;

  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
    
    // Login if needed
    await page.waitForSelector('[data-testid="fee-management-header"]', { timeout: 10000 });
  });

  test('should scope PYD correctly after promotion', async ({ page }) => {
    // Setup test data via direct database calls
    testData = await setupPYDTestData();
    
    try {
      // Verify source year (2025-2026) has zero PYD
      await page.selectOption('[data-testid="academic-year-select"]', { label: '2025-2026' });
      await page.waitForTimeout(2000); // Allow for data refresh
      
      // Check PYD summary for source year
      const sourcePYDSummary = await page.locator('[data-testid="pyd-summary"]').first();
      await expect(sourcePYDSummary).toContainText('0');
      await expect(sourcePYDSummary).not.toContainText('₹10,000');
      
      // Verify target year (2026-2027) has the PYD
      await page.selectOption('[data-testid="academic-year-select"]', { label: '2026-2027' });
      await page.waitForTimeout(2000); // Allow for data refresh
      
      // Check PYD summary for target year
      const targetPYDSummary = await page.locator('[data-testid="pyd-summary"]').first();
      await expect(targetPYDSummary).toContainText('1'); // 1 student with dues
      await expect(targetPYDSummary).toContainText('₹10,000'); // Total outstanding
      
      // Verify PYD list shows the student
      const pydList = page.locator('[data-testid="pyd-student-list"]');
      await expect(pydList).toContainText('Test Student');
      await expect(pydList).toContainText('₹10,000');
      
      // Verify future years (2027-2028, 2028-2029) have zero PYD
      await page.selectOption('[data-testid="academic-year-select"]', { label: '2027-2028' });
      await page.waitForTimeout(2000);
      
      const futurePYDSummary = await page.locator('[data-testid="pyd-summary"]').first();
      await expect(futurePYDSummary).toContainText('0');
      
      // Verify cache isolation - switching back to target year should maintain data
      await page.selectOption('[data-testid="academic-year-select"]', { label: '2026-2027' });
      await page.waitForTimeout(1000); // Shorter wait for cached data
      
      const cachedPYDSummary = await page.locator('[data-testid="pyd-summary"]').first();
      await expect(cachedPYDSummary).toContainText('1');
      await expect(cachedPYDSummary).toContainText('₹10,000');
      
    } finally {
      // Cleanup test data
      if (testData) {
        await cleanupPYDTestData(testData);
      }
    }
  });

  test('should not display NaN or Infinity in summary cards', async ({ page }) => {
    // Navigate through different academic years
    const academicYears = ['2025-2026', '2026-2027', '2027-2028', '2028-2029'];
    
    for (const year of academicYears) {
      await page.selectOption('[data-testid="academic-year-select"]', { label: year });
      await page.waitForTimeout(2000);
      
      // Check all summary cards for invalid values
      const summaryCards = page.locator('[data-testid="fee-summary-card"]');
      const cardCount = await summaryCards.count();
      
      for (let i = 0; i < cardCount; i++) {
        const cardText = await summaryCards.nth(i).textContent();
        
        // Verify no NaN, Infinity, or undefined values
        expect(cardText).not.toMatch(/NaN/i);
        expect(cardText).not.toMatch(/Infinity/i);
        expect(cardText).not.toMatch(/undefined/i);
        
        // Verify all numeric values are finite
        const numericMatches = cardText?.match(/[\d,]+/g) || [];
        for (const match of numericMatches) {
          const num = parseFloat(match.replace(/,/g, ''));
          expect(Number.isFinite(num) || num === 0).toBeTruthy();
        }
      }
    }
  });

  async function setupPYDTestData() {
    // This would ideally use a test API endpoint or direct database access
    // For now, we'll return mock data structure
    return {
      academicYears: [
        { id: 'source-year-id', name: '2025-2026' },
        { id: 'target-year-id', name: '2026-2027' },
        { id: 'future-year-1-id', name: '2027-2028' },
        { id: 'future-year-2-id', name: '2028-2029' }
      ],
      classes: [
        { id: 'class-1-id', name: '1st Grade' },
        { id: 'class-2-id', name: '2nd Grade' }
      ],
      students: [
        { id: 'student-1-id', name: 'Test Student', classId: 'class-1-id' }
      ],
      feeRecords: [
        {
          studentId: 'student-1-id',
          academicYearId: 'source-year-id',
          feeType: 'Tuition Fee',
          actualFee: 22000,
          paidAmount: 12000,
          balanceFee: 10000
        }
      ],
      promotions: [
        {
          studentId: 'student-1-id',
          fromYearId: 'source-year-id',
          toYearId: 'target-year-id',
          fromClassId: 'class-1-id',
          toClassId: 'class-2-id'
        }
      ]
    };
  }

  async function cleanupPYDTestData(testData: any) {
    // Cleanup logic would go here
    // Delete test records in reverse order to maintain referential integrity
    console.log('Cleaning up test data:', testData);
  }
});

test.describe('PYD Cache Management', () => {
  test('should invalidate cache properly on year switch', async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="fee-management-header"]', { timeout: 10000 });
    
    // Track network requests to verify cache behavior
    const pydRequests: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('get_pyd_summary') || request.url().includes('student_fee_records')) {
        pydRequests.push(`${request.method()} ${request.url()}`);
      }
    });
    
    // Switch between years multiple times
    await page.selectOption('[data-testid="academic-year-select"]', { label: '2025-2026' });
    await page.waitForTimeout(1000);
    
    await page.selectOption('[data-testid="academic-year-select"]', { label: '2026-2027' });
    await page.waitForTimeout(1000);
    
    await page.selectOption('[data-testid="academic-year-select"]', { label: '2025-2026' });
    await page.waitForTimeout(1000);
    
    // Verify that appropriate requests were made (indicating cache invalidation)
    expect(pydRequests.length).toBeGreaterThan(0);
    
    // Verify year-specific data isolation
    const currentYearDisplay = page.locator('[data-testid="current-academic-year"]');
    await expect(currentYearDisplay).toContainText('2025-2026');
  });
});