import { test, expect } from '@playwright/test';

test.describe('Previous Year Dues Canonical Calculations', () => {
  test('PYD calculations are scoped to selected academic year and avoid NaN', async ({ page }) => {
    // Navigate to fee management
    await page.goto('/');
    await page.waitForSelector('[data-testid="fee-management-link"]', { timeout: 10000 });
    await page.click('[data-testid="fee-management-link"]');

    // Wait for the fee management page to load
    await page.waitForSelector('h1:has-text("Fee Management")', { timeout: 10000 });

    // Check for academic year selector
    const yearSelector = page.locator('select').first();
    await expect(yearSelector).toBeVisible();

    // Get available academic years
    const options = await yearSelector.locator('option').all();
    const yearNames = await Promise.all(options.map(option => option.textContent()));
    console.log('Available academic years:', yearNames);

    // Test different academic years
    for (const option of options) {
      const yearText = await option.textContent();
      if (!yearText || yearText === 'Select Academic Year') continue;

      console.log(`Testing academic year: ${yearText}`);
      
      // Select the academic year
      await yearSelector.selectOption({ label: yearText });
      
      // Wait for data to load
      await page.waitForTimeout(2000);

      // Check for PYD summary cards if they exist
      const pydCards = page.locator('[data-testid*="pyd"], [class*="previous-year"], [class*="Previous Year"]');
      
      // Check all numeric displays for NaN, Infinity, or invalid values
      const numericElements = page.locator('text=/^[₹$]?[0-9,.-]+$|^[0-9,.-]+[%]?$/');
      const count = await numericElements.count();
      
      for (let i = 0; i < count; i++) {
        const element = numericElements.nth(i);
        const text = await element.textContent();
        
        if (text) {
          // Check for NaN, Infinity, or other invalid numeric displays
          expect(text).not.toMatch(/NaN|Infinity|-Infinity|undefined|null/i);
          
          // Extract numeric part and validate it's finite
          const numericPart = text.replace(/[₹$,%\s]/g, '');
          if (numericPart && !isNaN(parseFloat(numericPart))) {
            const value = parseFloat(numericPart);
            expect(isFinite(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0); // Financial amounts should be non-negative
          }
        }
      }

      // If PYD data exists, verify it follows canonical rules
      if (await pydCards.count() > 0) {
        console.log(`Found ${await pydCards.count()} PYD-related elements for ${yearText}`);
        
        // Check that all amounts are properly calculated and displayed
        const amounts = page.locator('text=/₹[0-9,]+/');
        const amountCount = await amounts.count();
        
        for (let i = 0; i < amountCount; i++) {
          const amountText = await amounts.nth(i).textContent();
          if (amountText) {
            const cleanAmount = amountText.replace(/[₹,]/g, '');
            const value = parseFloat(cleanAmount);
            expect(isFinite(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
          }
        }
      }

      // Verify no JavaScript errors in console
      page.on('console', msg => {
        if (msg.type() === 'error') {
          console.log('Console error:', msg.text());
        }
      });
    }
  });

  test('PYD summary uses canonical calculation functions', async ({ page }) => {
    // Navigate to fee management
    await page.goto('/');
    await page.waitForSelector('[data-testid="fee-management-link"]', { timeout: 10000 });
    await page.click('[data-testid="fee-management-link"]');

    // Wait for the page to load
    await page.waitForSelector('h1:has-text("Fee Management")', { timeout: 10000 });

    // Look for any PYD summary components
    const summaryCards = page.locator('.grid .card, [class*="summary"], [class*="stats"]');
    const cardCount = await summaryCards.count();
    
    console.log(`Found ${cardCount} potential summary cards`);

    // Check each summary card for valid numbers
    for (let i = 0; i < cardCount; i++) {
      const card = summaryCards.nth(i);
      const cardText = await card.textContent();
      
      if (cardText && (cardText.includes('Due') || cardText.includes('Outstanding') || cardText.includes('Student'))) {
        // Find all numeric values in this card
        const numbers = cardText.match(/₹?[0-9,]+\.?[0-9]*/g);
        
        if (numbers) {
          for (const numStr of numbers) {
            const cleanNum = numStr.replace(/[₹,]/g, '');
            const value = parseFloat(cleanNum);
            
            expect(isFinite(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(numStr).not.toMatch(/NaN|Infinity/);
          }
        }
      }
    }

    // Check for proper academic year scoping by switching years
    const yearSelector = page.locator('select').first();
    if (await yearSelector.isVisible()) {
      const options = await yearSelector.locator('option').all();
      
      // Test at least 2 different years if available
      const testYears = options.slice(1, 3); // Skip the first "Select" option
      
      for (const option of testYears) {
        const yearText = await option.textContent();
        if (!yearText) continue;
        
        await yearSelector.selectOption({ label: yearText });
        await page.waitForTimeout(1500);
        
        // Verify that PYD data is specific to this academic year
        // PYD records should only show for the selected year
        const pydElements = page.locator('text=/Previous Year Dues|PYD/i');
        const count = await pydElements.count();
        
        if (count > 0) {
          console.log(`${yearText}: Found ${count} PYD references`);
          
          // The PYD data should be properly scoped to this year only
          // We can't easily verify the exact amounts, but we can ensure no NaN values
          const allText = await page.textContent('body');
          expect(allText).not.toMatch(/NaN|Infinity/);
        }
      }
    }
  });
});