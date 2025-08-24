# Performance Optimization Plan

## Current Performance Issues

### Database Query Analysis
- **Fee Grid Loading**: Multiple joins without proper indexing (~800ms)
- **Payment History**: N+1 query pattern for student data (~1.2s)
- **Promotion Operations**: Sequential processing causing timeouts (~45s for 500 students)
- **Report Generation**: Full table scans on large datasets (~15s)

### Frontend Performance  
- **Large Data Rendering**: Fee grid with 1000+ rows causes UI freezing
- **Real-time Updates**: Manual cache invalidation leads to over-fetching
- **Bundle Size**: Unused dependencies and code splitting issues

## Optimization Strategy

### Phase 1: Database Performance (Weeks 1-2)

#### 1.1 Index Optimization
```sql
-- Composite indexes for common query patterns
CREATE INDEX CONCURRENTLY idx_fee_records_student_year 
ON student_fee_records (tenant_id, student_id, academic_year_id);

CREATE INDEX CONCURRENTLY idx_fee_records_year_status 
ON student_fee_records (tenant_id, academic_year_id, status) 
INCLUDE (student_id, balance_fee);

CREATE INDEX CONCURRENTLY idx_payments_student_date
ON fee_payment_records (tenant_id, student_id, payment_date DESC);

CREATE INDEX CONCURRENTLY idx_enrollments_year_class
ON student_enrollments (tenant_id, academic_year_id, class_id);

-- Partial indexes for common filters
CREATE INDEX CONCURRENTLY idx_fee_records_outstanding
ON student_fee_records (tenant_id, student_id, academic_year_id)
WHERE balance_fee > 0;

CREATE INDEX CONCURRENTLY idx_students_active
ON students (tenant_id, class_id, status) 
WHERE status = 'Active';
```

#### 1.2 Query Optimization
```sql
-- Optimized fee grid view with materialized option
CREATE MATERIALIZED VIEW public.mv_fee_grid_summary AS
SELECT 
  tenant_id,
  academic_year_id,
  student_id,
  class_id,
  SUM(actual_fee) as total_actual_fee,
  SUM(discount_amount) as total_discount,
  SUM(paid_amount) as total_paid,
  SUM(balance_fee) as total_balance,
  array_agg(DISTINCT fee_type) as fee_types,
  COUNT(*) as record_count,
  MAX(updated_at) as last_updated
FROM student_fee_records
GROUP BY tenant_id, academic_year_id, student_id, class_id;

-- Refresh schedule
CREATE OR REPLACE FUNCTION refresh_fee_grid_summary()
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fee_grid_summary;
END;
$$;

-- Schedule refresh every 15 minutes
SELECT cron.schedule('refresh-fee-grid', '*/15 * * * *', 'SELECT refresh_fee_grid_summary();');
```

#### 1.3 Canonical Views Enhancement
```sql
-- High-performance student summary view
CREATE VIEW v_student_dashboard AS
WITH student_fees AS (
  SELECT 
    sfr.tenant_id,
    sfr.student_id,
    sfr.academic_year_id,
    SUM(sfr.balance_fee) FILTER (WHERE sfr.fee_type = 'Tuition Fee') as tuition_balance,
    SUM(sfr.balance_fee) FILTER (WHERE sfr.fee_type = 'Previous Year Dues') as pyd_balance,
    SUM(sfr.balance_fee) as total_balance,
    COUNT(*) FILTER (WHERE sfr.status = 'Overdue') as overdue_count
  FROM student_fee_records sfr
  WHERE sfr.balance_fee > 0
  GROUP BY sfr.tenant_id, sfr.student_id, sfr.academic_year_id
),
recent_payments AS (
  SELECT 
    fpr.tenant_id,
    fpr.student_id,
    fpr.target_academic_year_id,
    SUM(fpr.amount_paid) as recent_payments,
    MAX(fpr.payment_date) as last_payment_date
  FROM fee_payment_records fpr
  WHERE fpr.payment_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY fpr.tenant_id, fpr.student_id, fpr.target_academic_year_id
)
SELECT 
  s.id as student_id,
  s.tenant_id,
  s.first_name || ' ' || s.last_name as full_name,
  s.admission_number,
  c.name as class_name,
  c.section,
  sf.tuition_balance,
  sf.pyd_balance, 
  sf.total_balance,
  sf.overdue_count,
  rp.recent_payments,
  rp.last_payment_date,
  s.status as student_status
FROM students s
JOIN classes c ON s.class_id = c.id
LEFT JOIN student_fees sf ON sf.student_id = s.id
LEFT JOIN recent_payments rp ON rp.student_id = s.id
WHERE s.status = 'Active';
```

### Phase 2: Application Performance (Weeks 3-4)

#### 2.1 React Query Optimization
```typescript
// Optimized query keys with hierarchical invalidation
export const queryKeys = {
  students: {
    all: (tenantId: string) => ['students', tenantId] as const,
    byYear: (tenantId: string, yearId: string) => 
      [...queryKeys.students.all(tenantId), 'year', yearId] as const,
    byClass: (tenantId: string, yearId: string, classId: string) => 
      [...queryKeys.students.byYear(tenantId, yearId), 'class', classId] as const,
    detail: (tenantId: string, studentId: string) => 
      [...queryKeys.students.all(tenantId), 'detail', studentId] as const,
  },
  fees: {
    all: (tenantId: string) => ['fees', tenantId] as const,
    grid: (tenantId: string, yearId: string) => 
      [...queryKeys.fees.all(tenantId), 'grid', yearId] as const,
    student: (tenantId: string, studentId: string, yearId: string) => 
      [...queryKeys.fees.all(tenantId), 'student', studentId, yearId] as const,
  }
};

// Selective cache invalidation
export const useInvalidateQueries = () => {
  const queryClient = useQueryClient();
  
  const invalidateStudentData = (studentId: string, yearId?: string) => {
    queryClient.invalidateQueries({
      queryKey: queryKeys.students.detail(getTenantId(), studentId)
    });
    
    if (yearId) {
      queryClient.invalidateQueries({
        queryKey: queryKeys.fees.student(getTenantId(), studentId, yearId)
      });
    }
  };
  
  return { invalidateStudentData };
};
```

#### 2.2 Virtual Scrolling for Large Lists
```typescript
// Fee grid with virtual scrolling
import { useVirtual } from 'react-virtual';

export const OptimizedFeeGrid = ({ fees }: { fees: Fee[] }) => {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtual({
    size: fees.length,
    parentRef,
    estimateSize: useCallback(() => 60, []), // Row height
    overscan: 10, // Render extra rows for smooth scrolling
  });

  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: rowVirtualizer.totalSize }}>
        {rowVirtualizer.virtualItems.map(virtualRow => {
          const fee = fees[virtualRow.index];
          return (
            <div
              key={fee.id}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: virtualRow.size,
                transform: `translateY(${virtualRow.start}px)`,
              }}
            >
              <FeeTableRow fee={fee} />
            </div>
          );
        })}
      </div>
    </div>
  );
};
```

#### 2.3 Optimistic Updates
```typescript
// Optimistic payment recording
export const useRecordPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: recordPayment,
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await queryClient.cancelQueries({
        queryKey: queryKeys.fees.student(getTenantId(), variables.studentId, variables.yearId)
      });
      
      // Snapshot current state
      const previousFees = queryClient.getQueryData(
        queryKeys.fees.student(getTenantId(), variables.studentId, variables.yearId)
      );
      
      // Optimistically update
      queryClient.setQueryData(
        queryKeys.fees.student(getTenantId(), variables.studentId, variables.yearId),
        (old: Fee[]) => 
          old?.map(fee => ({
            ...fee,
            paid_amount: fee.paid_amount + variables.amount,
            balance_fee: Math.max(0, fee.balance_fee - variables.amount),
            status: fee.balance_fee <= variables.amount ? 'Paid' : 'Partial'
          }))
      );
      
      return { previousFees };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousFees) {
        queryClient.setQueryData(
          queryKeys.fees.student(getTenantId(), variables.studentId, variables.yearId),
          context.previousFees
        );
      }
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure consistency
      queryClient.invalidateQueries({
        queryKey: queryKeys.fees.student(getTenantId(), variables.studentId, variables.yearId)
      });
    }
  });
};
```

### Phase 3: Real-time Performance (Weeks 5-6)

#### 3.1 Intelligent Cache Invalidation
```typescript
// Realtime subscription with selective updates
export const useRealtimeSubscription = () => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel('fee-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_fee_records',
          filter: `tenant_id=eq.${getTenantId()}`
        },
        (payload) => {
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          // Update specific queries based on change
          if (eventType === 'UPDATE' && newRecord) {
            // Update fee grid for this student/year
            queryClient.setQueryData(
              queryKeys.fees.grid(getTenantId(), newRecord.academic_year_id),
              (old: Fee[]) => 
                old?.map(fee => 
                  fee.id === newRecord.id 
                    ? { ...fee, ...newRecord }
                    : fee
                )
            );
            
            // Update student detail
            queryClient.invalidateQueries({
              queryKey: queryKeys.students.detail(getTenantId(), newRecord.student_id)
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
};
```

#### 3.2 Debounced Updates
```typescript
// Debounced search with caching
export const useDebouncedSearch = (searchTerm: string, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(searchTerm);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(searchTerm);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [searchTerm, delay]);
  
  return debouncedValue;
};

// Cached search results
export const useStudentSearch = (searchTerm: string) => {
  const debouncedSearch = useDebouncedSearch(searchTerm);
  
  return useQuery({
    queryKey: ['student-search', getTenantId(), debouncedSearch],
    queryFn: () => searchStudents(debouncedSearch),
    enabled: debouncedSearch.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};
```

### Phase 4: Background Processing (Week 7-8)

#### 4.1 Async Fee Calculations
```sql
-- Background job for fee calculations
CREATE OR REPLACE FUNCTION public.process_fee_calculations_async()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  batch_size int := 100;
  processed_count int := 0;
  student_batch uuid[];
BEGIN
  -- Process in batches to avoid long locks
  FOR student_batch IN 
    SELECT array_agg(id) 
    FROM (
      SELECT s.id
      FROM students s
      JOIN student_fee_records sfr ON sfr.student_id = s.id
      WHERE sfr.needs_recalculation = true
      ORDER BY sfr.updated_at
      LIMIT batch_size
    ) batch_students
  LOOP
    -- Update fee calculations for batch
    UPDATE student_fee_records
    SET 
      final_fee = actual_fee - discount_amount,
      balance_fee = greatest(actual_fee - discount_amount - paid_amount, 0),
      status = CASE 
        WHEN actual_fee - discount_amount - paid_amount <= 0 THEN 'Paid'
        WHEN paid_amount > 0 THEN 'Partial'
        WHEN due_date < CURRENT_DATE THEN 'Overdue'
        ELSE 'Pending'
      END,
      needs_recalculation = false,
      updated_at = now()
    WHERE student_id = ANY(student_batch)
    AND needs_recalculation = true;
    
    processed_count := processed_count + array_length(student_batch, 1);
    
    -- Log progress
    RAISE NOTICE 'Processed % fee records', processed_count;
    
    -- Commit batch to avoid long transactions
    COMMIT;
  END LOOP;
  
  -- Log completion
  PERFORM public.log_audit_event(
    'fee_calculations_completed',
    jsonb_build_object('processed_count', processed_count),
    ARRAY[]::uuid[]
  );
END;
$$;
```

#### 4.2 Materialized View Refresh Jobs
```sql
-- Smart refresh based on data changes
CREATE OR REPLACE FUNCTION public.smart_refresh_materialized_views()
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
  last_refresh timestamp;
  changes_count int;
BEGIN
  -- Check if refresh is needed
  SELECT last_refreshed INTO last_refresh
  FROM public.materialized_view_status 
  WHERE view_name = 'mv_fee_grid_summary';
  
  -- Count changes since last refresh
  SELECT COUNT(*) INTO changes_count
  FROM student_fee_records
  WHERE updated_at > COALESCE(last_refresh, '1900-01-01'::timestamp);
  
  -- Refresh if significant changes
  IF changes_count > 50 OR last_refresh < (now() - INTERVAL '1 hour') THEN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_fee_grid_summary;
    
    INSERT INTO public.materialized_view_status (view_name, last_refreshed, records_affected)
    VALUES ('mv_fee_grid_summary', now(), changes_count)
    ON CONFLICT (view_name) DO UPDATE SET
      last_refreshed = EXCLUDED.last_refreshed,
      records_affected = EXCLUDED.records_affected;
      
    RAISE NOTICE 'Refreshed mv_fee_grid_summary with % changes', changes_count;
  END IF;
END;
$$;
```

## Performance Monitoring

### Key Metrics
```sql
-- Query performance monitoring view
CREATE VIEW v_query_performance AS
SELECT 
  query_id,
  query_text,
  calls,
  total_exec_time,
  mean_exec_time,
  max_exec_time,
  rows_processed / calls as avg_rows_per_call
FROM pg_stat_statements
WHERE query_text LIKE '%student_fee_records%'
   OR query_text LIKE '%fee_payment_records%'
ORDER BY total_exec_time DESC;

-- Index usage monitoring
CREATE VIEW v_index_usage AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan as index_scans,
  idx_tup_read as tuples_read,
  idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Performance Alerts
- Query execution time > 5 seconds
- Index scan ratio < 95%
- Cache hit ratio < 98%
- Connection pool exhaustion
- Lock wait time > 1 second

## Success Criteria

### Performance Targets
- **Page Load Time**: P95 < 2.5 seconds
- **API Response Time**: P95 < 500ms  
- **Fee Grid Loading**: < 800ms for 1000 records
- **Payment Recording**: < 200ms end-to-end
- **Report Generation**: < 5 seconds for monthly reports
- **Real-time Updates**: < 2 seconds latency

### Scalability Targets
- Support 10,000 concurrent students
- Handle 1,000 simultaneous payments
- Process 500-student promotions in < 30 seconds
- Generate reports for 50,000+ records in < 30 seconds

### Resource Efficiency
- Database connections < 100 active
- Memory usage < 2GB per application instance
- CPU usage < 70% under normal load
- Network bandwidth < 100MB/hour per user