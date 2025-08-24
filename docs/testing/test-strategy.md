# Comprehensive Testing Strategy

## Testing Pyramid Overview

```
    E2E Tests (10%)
     │ Critical user journeys
     │ Cross-browser compatibility
     │ Performance benchmarks
    
   Integration Tests (20%)
    │ API contracts
    │ Database operations  
    │ RPC functions
    │ Real-time events
    
  Unit Tests (70%)
   │ Business logic
   │ Utility functions
   │ Component behavior
   │ Edge cases
```

## Unit Testing Strategy

### 1. Financial Calculations Testing
```typescript
// tests/utils/fee-calculations.test.ts
import { calculateFinalFee, calculateBalance, allocatePayment } from '@/utils/fee-calculations';

describe('Fee Calculations', () => {
  describe('calculateFinalFee', () => {
    test('calculates final fee correctly with discount', () => {
      const result = calculateFinalFee(1000, 100);
      expect(result).toBe(900);
    });
    
    test('handles zero discount', () => {
      const result = calculateFinalFee(1000, 0);
      expect(result).toBe(1000);
    });
    
    test('handles discount equal to fee', () => {
      const result = calculateFinalFee(1000, 1000);
      expect(result).toBe(0);
    });
    
    test('throws error for negative amounts', () => {
      expect(() => calculateFinalFee(-100, 50)).toThrow('Invalid fee amount');
      expect(() => calculateFinalFee(1000, -50)).toThrow('Invalid discount amount');
    });
    
    test('throws error for discount exceeding fee', () => {
      expect(() => calculateFinalFee(1000, 1500)).toThrow('Discount cannot exceed fee');
    });
  });

  describe('allocatePayment', () => {
    const feeRecords = [
      { id: '1', balance: 500, priority: 1, type: 'Previous Year Dues' },
      { id: '2', balance: 800, priority: 2, type: 'Tuition Fee' },
      { id: '3', balance: 300, priority: 3, type: 'Transport Fee' }
    ];
    
    test('allocates to highest priority first', () => {
      const allocation = allocatePayment(1000, feeRecords);
      
      expect(allocation).toEqual([
        { feeId: '1', amount: 500 }, // Full PYD
        { feeId: '2', amount: 500 }  // Partial tuition
      ]);
    });
    
    test('handles exact payment amount', () => {
      const allocation = allocatePayment(500, feeRecords);
      
      expect(allocation).toEqual([
        { feeId: '1', amount: 500 }
      ]);
    });
    
    test('handles payment exceeding all balances', () => {
      const allocation = allocatePayment(2000, feeRecords);
      
      expect(allocation).toEqual([
        { feeId: '1', amount: 500 },
        { feeId: '2', amount: 800 },
        { feeId: '3', amount: 300 }
      ]);
    });
  });
});
```

### 2. React Component Testing
```typescript
// tests/components/FeeTableRow.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { FeeTableRow } from '@/components/modules/fee-management/FeeTableRow';

const mockFee = {
  id: 'fee-1',
  student: {
    id: 'student-1',
    first_name: 'John',
    last_name: 'Doe',
    admission_number: '2023001',
    class_name: 'Class 10',
  },
  actual_fee: 1000,
  discount_amount: 100,
  paid_amount: 400,
  balance_fee: 500,
  status: 'Partial' as const,
};

describe('FeeTableRow', () => {
  const mockHandlers = {
    onPaymentClick: jest.fn(),
    onDiscountClick: jest.fn(),
    onHistoryClick: jest.fn(),
    onStudentClick: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders fee information correctly', () => {
    render(<FeeTableRow fee={mockFee} {...mockHandlers} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('2023001')).toBeInTheDocument();
    expect(screen.getByText('Class 10')).toBeInTheDocument();
    expect(screen.getByText('₹1,000')).toBeInTheDocument();
    expect(screen.getByText('₹100')).toBeInTheDocument();
    expect(screen.getByText('₹400')).toBeInTheDocument();
    expect(screen.getByText('₹500')).toBeInTheDocument();
  });

  test('shows correct status badge', () => {
    render(<FeeTableRow fee={mockFee} {...mockHandlers} />);
    
    const statusBadge = screen.getByText('Partial');
    expect(statusBadge).toHaveClass('bg-yellow-100', 'text-yellow-800');
  });

  test('calls payment handler when payment button clicked', () => {
    render(<FeeTableRow fee={mockFee} {...mockHandlers} />);
    
    const paymentButton = screen.getByText('Record Payment');
    fireEvent.click(paymentButton);
    
    expect(mockHandlers.onPaymentClick).toHaveBeenCalledWith(mockFee);
  });

  test('disables payment button for paid fees', () => {
    const paidFee = { ...mockFee, status: 'Paid' as const, balance_fee: 0 };
    
    render(<FeeTableRow fee={paidFee} {...mockHandlers} />);
    
    const paymentButton = screen.getByText('Record Payment');
    expect(paymentButton).toBeDisabled();
  });
});
```

## Integration Testing

### 1. Database RPC Testing
```sql
-- tests/sql/test_student_management.sql
BEGIN;

-- Test create_student_v1 function
DO $$
DECLARE
  test_result jsonb;
  student_id uuid;
BEGIN
  -- Test successful student creation
  SELECT public.create_student_v1(
    '{"first_name": "Test", "last_name": "Student", "admission_number": "TEST001", "date_of_birth": "2010-01-01", "gender": "Male", "class_id": "' || gen_random_uuid() || '"}',
    '{"first_name": "Test", "last_name": "Parent", "relation": "Father", "phone_number": "9876543210", "email": "test@example.com"}',
    gen_random_uuid(),
    gen_random_uuid()
  ) INTO test_result;
  
  -- Verify success response
  ASSERT test_result->>'success' = 'true', 'Student creation should succeed';
  
  student_id := (test_result->>'student_id')::uuid;
  
  -- Verify student record created
  ASSERT EXISTS (
    SELECT 1 FROM students WHERE id = student_id
  ), 'Student record should exist';
  
  -- Verify guardian link created
  ASSERT EXISTS (
    SELECT 1 FROM student_parent_links WHERE student_id = student_id
  ), 'Parent link should exist';
  
  RAISE NOTICE 'Student creation test passed';
END;
$$;

-- Test payment recording and allocation
DO $$
DECLARE
  student_id uuid := gen_random_uuid();
  year_id uuid := gen_random_uuid();
  payment_result jsonb;
BEGIN
  -- Setup test data
  INSERT INTO students (id, first_name, last_name, admission_number, date_of_birth, gender, class_id)
  VALUES (student_id, 'Test', 'Student', 'TEST002', '2010-01-01', 'Male', gen_random_uuid());
  
  INSERT INTO student_fee_records (student_id, academic_year_id, class_id, fee_type, actual_fee, balance_fee, status)
  VALUES 
    (student_id, year_id, gen_random_uuid(), 'Previous Year Dues', 500, 500, 'Pending'),
    (student_id, year_id, gen_random_uuid(), 'Tuition Fee', 1000, 1000, 'Pending');
  
  -- Record payment
  SELECT public.record_payment_v1(
    student_id, 800, 'Cash', year_id, 'Test payment'
  ) INTO payment_result;
  
  -- Verify payment allocation (PYD first)
  ASSERT (
    SELECT balance_fee FROM student_fee_records 
    WHERE student_id = student_id AND fee_type = 'Previous Year Dues'
  ) = 0, 'PYD should be fully paid';
  
  ASSERT (
    SELECT balance_fee FROM student_fee_records 
    WHERE student_id = student_id AND fee_type = 'Tuition Fee'
  ) = 700, 'Tuition should have remaining balance';
  
  RAISE NOTICE 'Payment allocation test passed';
END;
$$;

ROLLBACK;
```

### 2. API Integration Testing
```typescript
// tests/integration/fee-management.test.ts
import { supabase } from '@/integrations/supabase/client';
import { createTestStudent, createTestFeeRecords, cleanup } from './test-helpers';

describe('Fee Management Integration', () => {
  let testStudentId: string;
  let testYearId: string;

  beforeEach(async () => {
    // Setup test data
    testStudentId = await createTestStudent();
    testYearId = await createTestAcademicYear();
    await createTestFeeRecords(testStudentId, testYearId);
  });

  afterEach(async () => {
    await cleanup();
  });

  describe('Payment Recording', () => {
    test('should record payment and allocate correctly', async () => {
      // Record payment
      const { data: paymentResult, error } = await supabase.rpc('record_payment_v1', {
        p_student_id: testStudentId,
        p_payment_amount: 800,
        p_payment_method: 'Cash',
        p_academic_year_id: testYearId,
        p_notes: 'Integration test payment'
      });

      expect(error).toBeNull();
      expect(paymentResult.success).toBe(true);

      // Verify fee records updated
      const { data: feeRecords } = await supabase
        .from('student_fee_records')
        .select('*')
        .eq('student_id', testStudentId)
        .eq('academic_year_id', testYearId);

      const pydRecord = feeRecords?.find(r => r.fee_type === 'Previous Year Dues');
      const tuitionRecord = feeRecords?.find(r => r.fee_type === 'Tuition Fee');

      expect(pydRecord?.balance_fee).toBe(0);
      expect(tuitionRecord?.balance_fee).toBe(700);
    });

    test('should handle insufficient payment gracefully', async () => {
      const { data: paymentResult } = await supabase.rpc('record_payment_v1', {
        p_student_id: testStudentId,
        p_payment_amount: 300,
        p_payment_method: 'Cash',
        p_academic_year_id: testYearId
      });

      // Verify partial payment allocation
      const { data: feeRecords } = await supabase
        .from('student_fee_records')
        .select('*')
        .eq('student_id', testStudentId)
        .eq('academic_year_id', testYearId);

      const pydRecord = feeRecords?.find(r => r.fee_type === 'Previous Year Dues');
      
      expect(pydRecord?.balance_fee).toBe(200); // 500 - 300
      expect(pydRecord?.status).toBe('Partial');
    });
  });

  describe('Discount Application', () => {
    test('should apply discount and recalculate fees', async () => {
      const { data: discountResult } = await supabase.rpc('apply_student_discount', {
        p_fee_record_id: await getFeeRecordId(testStudentId, 'Tuition Fee'),
        p_type: 'Percentage',
        p_amount: 10,
        p_reason: 'Merit scholarship'
      });

      expect(discountResult.success).toBe(true);

      const { data: feeRecord } = await supabase
        .from('student_fee_records')
        .select('*')
        .eq('student_id', testStudentId)
        .eq('fee_type', 'Tuition Fee')
        .single();

      expect(feeRecord.discount_amount).toBe(100); // 10% of 1000
      expect(feeRecord.final_fee).toBe(900);
    });
  });
});
```

## End-to-End Testing

### 1. Critical User Journey Tests
```typescript
// tests/e2e/fee-management.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Fee Management Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Login' }).click();
    // Login flow...
  });

  test('complete payment workflow', async ({ page }) => {
    // Navigate to fee management
    await page.getByRole('link', { name: 'Fee Management' }).click();
    await expect(page.getByText('Fee Records')).toBeVisible();

    // Select academic year
    await page.getByRole('combobox', { name: 'Academic Year' }).click();
    await page.getByRole('option', { name: '2023-24' }).click();

    // Wait for fee grid to load
    await expect(page.getByTestId('fee-grid')).toBeVisible();
    
    // Find student with outstanding balance
    const studentRow = page.locator('[data-testid="fee-row"]').first();
    await expect(studentRow).toBeVisible();

    // Click record payment
    await studentRow.getByRole('button', { name: 'Record Payment' }).click();

    // Fill payment form
    const paymentDialog = page.getByRole('dialog', { name: 'Record Payment' });
    await expect(paymentDialog).toBeVisible();

    await paymentDialog.getByRole('textbox', { name: 'Amount' }).fill('1000');
    await paymentDialog.getByRole('combobox', { name: 'Payment Method' }).click();
    await paymentDialog.getByRole('option', { name: 'Cash' }).click();
    await paymentDialog.getByRole('textbox', { name: 'Notes' }).fill('E2E test payment');

    // Submit payment
    await paymentDialog.getByRole('button', { name: 'Record Payment' }).click();

    // Verify success message
    await expect(page.getByText('Payment recorded successfully')).toBeVisible();

    // Verify fee grid updated
    await expect(studentRow.getByText('₹1,000')).toBeVisible(); // Updated paid amount
  });

  test('bulk discount application', async ({ page }) => {
    await page.goto('/fee-management');

    // Select multiple students
    await page.getByRole('checkbox', { name: 'Select all' }).check();
    
    // Open bulk actions
    await page.getByRole('button', { name: 'Bulk Actions' }).click();
    await page.getByRole('menuitem', { name: 'Apply Discount' }).click();

    // Fill bulk discount form
    const discountDialog = page.getByRole('dialog', { name: 'Bulk Discount' });
    await discountDialog.getByRole('combobox', { name: 'Discount Type' }).click();
    await discountDialog.getByRole('option', { name: 'Percentage' }).click();
    
    await discountDialog.getByRole('textbox', { name: 'Amount' }).fill('5');
    await discountDialog.getByRole('textbox', { name: 'Reason' }).fill('Term-end discount');

    await discountDialog.getByRole('button', { name: 'Apply Discount' }).click();

    // Verify bulk operation success
    await expect(page.getByText('Discount applied to 10 students')).toBeVisible();
  });

  test('real-time updates', async ({ page, context }) => {
    // Open fee management in two tabs
    const page2 = await context.newPage();
    
    await page.goto('/fee-management');
    await page2.goto('/fee-management');

    // Record payment in first tab
    const studentRow = page.locator('[data-testid="fee-row"]').first();
    await studentRow.getByRole('button', { name: 'Record Payment' }).click();

    const paymentDialog = page.getByRole('dialog');
    await paymentDialog.getByRole('textbox', { name: 'Amount' }).fill('500');
    await paymentDialog.getByRole('combobox', { name: 'Payment Method' }).selectOption('Cash');
    await paymentDialog.getByRole('button', { name: 'Record Payment' }).click();

    // Verify update appears in second tab (real-time)
    await expect(page2.locator('[data-testid="fee-row"]').first().getByText('₹500')).toBeVisible();
  });
});
```

### 2. Performance Testing
```typescript
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('fee grid loads within performance budget', async ({ page }) => {
    await page.goto('/fee-management');

    // Measure page load time
    const navigationTiming = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstContentfulPaint: performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint')?.startTime
      };
    });

    expect(navigationTiming.loadTime).toBeLessThan(2500); // 2.5s budget
    expect(navigationTiming.domContentLoaded).toBeLessThan(1500);
    expect(navigationTiming.firstContentfulPaint).toBeLessThan(1000);
  });

  test('handles large data sets efficiently', async ({ page }) => {
    // Load page with 1000+ records
    await page.goto('/fee-management?year=2023-24&limit=1000');

    // Measure render time
    const startTime = Date.now();
    await expect(page.getByTestId('fee-grid')).toBeVisible();
    const renderTime = Date.now() - startTime;

    expect(renderTime).toBeLessThan(3000); // 3s budget for large data

    // Test scrolling performance
    await page.mouse.wheel(0, 5000);
    await page.waitForTimeout(100); // Allow for scroll processing
    
    // Grid should remain responsive
    await expect(page.getByTestId('fee-grid')).toBeVisible();
  });

  test('concurrent user simulation', async ({ browser }) => {
    const contexts = await Promise.all(
      Array(10).fill(null).map(() => browser.newContext())
    );

    const pages = await Promise.all(
      contexts.map(context => context.newPage())
    );

    // Simulate 10 concurrent users
    const startTime = Date.now();
    
    await Promise.all(
      pages.map(async (page, index) => {
        await page.goto('/fee-management');
        await page.getByRole('button', { name: 'Record Payment' }).first().click();
        
        // Stagger payments to avoid conflicts
        await page.waitForTimeout(index * 100);
        
        const dialog = page.getByRole('dialog');
        await dialog.getByRole('textbox', { name: 'Amount' }).fill('100');
        await dialog.getByRole('button', { name: 'Record Payment' }).click();
        
        await expect(page.getByText('Payment recorded successfully')).toBeVisible();
      })
    );

    const totalTime = Date.now() - startTime;
    expect(totalTime).toBeLessThan(10000); // 10s for all concurrent operations

    // Cleanup
    await Promise.all(contexts.map(context => context.close()));
  });
});
```

## Test Data Management

### 1. Test Fixtures
```typescript
// tests/fixtures/fee-data.ts
export const createFeeTestData = {
  academicYear: {
    id: '2023-24-uuid',
    year_name: '2023-24',
    start_date: '2023-04-01',
    end_date: '2024-03-31',
    is_current: true
  },
  
  students: [
    {
      id: 'student-1-uuid',
      first_name: 'John',
      last_name: 'Doe',
      admission_number: 'TEST001',
      date_of_birth: '2010-01-01',
      gender: 'Male',
      class_id: 'class-1-uuid'
    },
    {
      id: 'student-2-uuid', 
      first_name: 'Jane',
      last_name: 'Smith',
      admission_number: 'TEST002',
      date_of_birth: '2010-02-01',
      gender: 'Female',
      class_id: 'class-1-uuid'
    }
  ],
  
  feeStructures: [
    {
      class_id: 'class-1-uuid',
      academic_year_id: '2023-24-uuid',
      fee_type: 'Tuition Fee',
      amount: 1000,
      frequency: 'Monthly'
    },
    {
      class_id: 'class-1-uuid', 
      academic_year_id: '2023-24-uuid',
      fee_type: 'Transport Fee',
      amount: 300,
      frequency: 'Monthly'
    }
  ]
};
```

### 2. Database Seeding
```sql
-- tests/sql/seed_test_data.sql
-- Clean slate for testing
TRUNCATE TABLE student_fee_records, fee_payment_records, students, academic_years CASCADE;

-- Insert test academic year
INSERT INTO academic_years (id, year_name, start_date, end_date, is_current)
VALUES ('550e8400-e29b-41d4-a716-446655440001', '2023-24', '2023-04-01', '2024-03-31', true);

-- Insert test classes
INSERT INTO classes (id, name, section)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', 'Class 10', 'A'),
  ('550e8400-e29b-41d4-a716-446655440003', 'Class 10', 'B');

-- Insert test students
INSERT INTO students (id, first_name, last_name, admission_number, date_of_birth, gender, class_id)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440004', 'Test', 'Student1', 'TEST001', '2010-01-01', 'Male', '550e8400-e29b-41d4-a716-446655440002'),
  ('550e8400-e29b-41d4-a716-446655440005', 'Test', 'Student2', 'TEST002', '2010-02-01', 'Female', '550e8400-e29b-41d4-a716-446655440002');

-- Insert fee structures
INSERT INTO fee_structures (class_id, academic_year_id, fee_type, amount, frequency, is_active)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Tuition Fee', 1000, 'Monthly', true),
  ('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Transport Fee', 300, 'Monthly', true);

-- Insert fee records
INSERT INTO student_fee_records (student_id, class_id, academic_year_id, fee_type, actual_fee, discount_amount, paid_amount, balance_fee, due_date, status)
SELECT 
  s.id, s.class_id, '550e8400-e29b-41d4-a716-446655440001', fs.fee_type, fs.amount, 0, 0, fs.amount, CURRENT_DATE + INTERVAL '30 days', 'Pending'
FROM students s
CROSS JOIN fee_structures fs
WHERE s.class_id = fs.class_id;
```

## Continuous Integration

### 1. GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run db:setup
      - run: npm run test:integration
      
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 2. Quality Gates
```json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      },
      "./src/utils/": {
        "branches": 90,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    }
  }
}
```

## Test Reporting and Metrics

### Success Criteria
- **Unit Test Coverage**: ≥ 80% overall, ≥ 90% for critical utilities
- **Integration Test Coverage**: All RPC functions and API endpoints
- **E2E Test Coverage**: All critical user journeys
- **Performance Tests**: All pages meet performance budgets
- **Test Execution Time**: Full suite completes in < 15 minutes
- **Flaky Test Rate**: < 2% of test runs

### Monitoring and Alerting
- Daily test execution reports
- Coverage trend analysis
- Performance regression detection
- Automated alerts for test failures
- Integration with deployment pipeline