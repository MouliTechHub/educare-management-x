# RPC Specifications and API Design

## Overview
Standardized RPC functions providing stable, versioned APIs for critical business operations with comprehensive validation and error handling.

## Design Principles

### 1. Idempotency
All mutation RPCs must be idempotent using:
- Unique constraint violations handling (ON CONFLICT DO NOTHING)
- Idempotency keys for critical operations
- State checks before mutations

### 2. Input Validation
Server-side validation for all inputs:
- Type validation with COALESCE for nulls
- Business rule validation (amounts >= 0, dates in valid ranges)
- Authorization checks before data access
- Referential integrity verification

### 3. Error Handling
Structured error responses:
```sql
-- Standard error format
RAISE EXCEPTION 'ERROR_CODE: %', detailed_message
  USING HINT = 'User-friendly suggestion',
        ERRCODE = 'P0001'; -- Custom application error
```

### 4. Audit Logging
All RPCs log operations:
```sql
-- Log all mutations
PERFORM public.log_audit_event(
  'rpc_name',
  jsonb_build_object('input', input_params, 'result', result_data),
  affected_entity_ids
);
```

## Core RPC Functions

### 1. Student Management

#### create_student_v1
```sql
CREATE OR REPLACE FUNCTION public.create_student_v1(
  p_student_data jsonb,
  p_guardian_data jsonb DEFAULT NULL,
  p_class_id uuid DEFAULT NULL,
  p_academic_year_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_student_id uuid;
  v_guardian_id uuid;
  v_enrollment_id uuid;
  v_tenant_id uuid;
BEGIN
  -- Validate permissions
  IF NOT (auth.has_tenant_role('admin') OR auth.has_tenant_role('accountant')) THEN
    RAISE EXCEPTION 'INSUFFICIENT_PERMISSIONS: Admin or accountant role required';
  END IF;

  -- Get tenant context
  v_tenant_id := auth.current_tenant_id();
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'INVALID_TENANT: Tenant context required';
  END IF;

  -- Validate required fields
  IF p_student_data->>'first_name' IS NULL OR p_student_data->>'last_name' IS NULL THEN
    RAISE EXCEPTION 'VALIDATION_ERROR: Student name is required';
  END IF;

  -- Validate admission number uniqueness
  IF EXISTS (
    SELECT 1 FROM students 
    WHERE admission_number = p_student_data->>'admission_number' 
    AND tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'DUPLICATE_ADMISSION_NUMBER: Admission number already exists';
  END IF;

  -- Create student record
  INSERT INTO public.students (
    tenant_id, first_name, last_name, admission_number,
    date_of_birth, gender, class_id, created_by
  ) VALUES (
    v_tenant_id,
    p_student_data->>'first_name',
    p_student_data->>'last_name', 
    p_student_data->>'admission_number',
    (p_student_data->>'date_of_birth')::date,
    p_student_data->>'gender',
    COALESCE(p_class_id, (p_student_data->>'class_id')::uuid),
    auth.current_user_name()
  ) RETURNING id INTO v_student_id;

  -- Create guardian if provided
  IF p_guardian_data IS NOT NULL THEN
    INSERT INTO public.parents (
      tenant_id, first_name, last_name, relation,
      phone_number, email, created_by
    ) VALUES (
      v_tenant_id,
      p_guardian_data->>'first_name',
      p_guardian_data->>'last_name',
      p_guardian_data->>'relation', 
      p_guardian_data->>'phone_number',
      p_guardian_data->>'email',
      auth.current_user_name()
    ) RETURNING id INTO v_guardian_id;

    -- Link student and guardian
    INSERT INTO public.student_parent_links (
      tenant_id, student_id, parent_id
    ) VALUES (v_tenant_id, v_student_id, v_guardian_id);
  END IF;

  -- Create enrollment if academic year provided
  IF p_academic_year_id IS NOT NULL THEN
    INSERT INTO public.student_enrollments (
      tenant_id, student_id, academic_year_id, class_id, enrollment_date
    ) VALUES (
      v_tenant_id, v_student_id, p_academic_year_id, 
      COALESCE(p_class_id, (p_student_data->>'class_id')::uuid),
      CURRENT_DATE
    ) RETURNING id INTO v_enrollment_id;
  END IF;

  -- Auto-assign fees if enrollment created
  IF v_enrollment_id IS NOT NULL THEN
    PERFORM public.assign_student_fees_v1(v_student_id, p_academic_year_id);
  END IF;

  -- Log audit event
  PERFORM public.log_audit_event(
    'student_created',
    jsonb_build_object(
      'student_id', v_student_id,
      'guardian_id', v_guardian_id,
      'enrollment_id', v_enrollment_id
    ),
    ARRAY[v_student_id]
  );

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'student_id', v_student_id,
    'guardian_id', v_guardian_id,
    'enrollment_id', v_enrollment_id,
    'message', 'Student created successfully'
  );

EXCEPTION WHEN OTHERS THEN
  -- Log error and re-raise
  PERFORM public.log_error_event(
    'create_student_v1', 
    SQLERRM,
    jsonb_build_object('input', p_student_data)
  );
  RAISE;
END;
$$;
```

#### promote_students_v2  
```sql
CREATE OR REPLACE FUNCTION public.promote_students_v2(
  p_promotion_data jsonb,
  p_target_academic_year_id uuid,
  p_idempotency_key text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql  
SECURITY DEFINER
AS $$
DECLARE
  v_computed_key text;
  v_existing_result jsonb;
  v_tenant_id uuid;
  v_promoted_count int := 0;
  v_fee_rows_created int := 0;
  v_pyd_rows_created int := 0;
  promotion_record jsonb;
BEGIN
  -- Validate permissions
  IF NOT auth.has_tenant_role('admin') THEN
    RAISE EXCEPTION 'INSUFFICIENT_PERMISSIONS: Admin role required for promotions';
  END IF;

  -- Get tenant context
  v_tenant_id := auth.current_tenant_id();
  
  -- Generate idempotency key
  v_computed_key := COALESCE(
    p_idempotency_key,
    md5(p_promotion_data::text || p_target_academic_year_id::text || v_tenant_id::text)
  );

  -- Check for existing request
  SELECT result INTO v_existing_result
  FROM public.promotion_requests 
  WHERE idempotency_key = v_computed_key 
  AND status = 'completed';

  IF v_existing_result IS NOT NULL THEN
    RETURN v_existing_result;
  END IF;

  -- Validate target academic year exists and belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.academic_years 
    WHERE id = p_target_academic_year_id 
    AND tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'INVALID_ACADEMIC_YEAR: Target year not found or access denied';
  END IF;

  -- Create promotion request record
  INSERT INTO public.promotion_requests (
    tenant_id, idempotency_key, request_payload, 
    target_academic_year_id, promoted_by_user, status
  ) VALUES (
    v_tenant_id, v_computed_key, p_promotion_data,
    p_target_academic_year_id, auth.current_user_name(), 'processing'
  );

  -- Process each student promotion
  FOR promotion_record IN SELECT * FROM jsonb_array_elements(p_promotion_data)
  LOOP
    PERFORM public.promote_single_student_v1(
      (promotion_record->>'student_id')::uuid,
      (promotion_record->>'from_academic_year_id')::uuid,
      p_target_academic_year_id,
      promotion_record->>'promotion_type',
      COALESCE(promotion_record->>'to_class_id', ''),
      promotion_record->>'reason'
    );
    
    v_promoted_count := v_promoted_count + 1;
  END LOOP;

  -- Update request status
  UPDATE public.promotion_requests
  SET status = 'completed',
      result = jsonb_build_object(
        'promoted_students', v_promoted_count,
        'message', format('Successfully processed %s student promotions', v_promoted_count)
      ),
      completed_at = now()
  WHERE idempotency_key = v_computed_key;

  -- Return result
  RETURN jsonb_build_object(
    'success', true,
    'promoted_students', v_promoted_count,
    'idempotency_key', v_computed_key
  );

EXCEPTION WHEN OTHERS THEN
  -- Update request as failed
  UPDATE public.promotion_requests 
  SET status = 'failed', error = SQLERRM, completed_at = now()
  WHERE idempotency_key = v_computed_key;
  
  RAISE;
END;
$$;
```

### 2. Financial Management

#### record_payment_v1
```sql
CREATE OR REPLACE FUNCTION public.record_payment_v1(
  p_student_id uuid,
  p_payment_amount numeric,
  p_payment_method text,
  p_academic_year_id uuid,
  p_notes text DEFAULT NULL,
  p_late_fee numeric DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER  
AS $$
DECLARE
  v_tenant_id uuid;
  v_receipt_number text;
  v_payment_id uuid;
  v_allocation_result jsonb;
BEGIN
  -- Validate permissions
  IF NOT (auth.has_tenant_role('admin') OR auth.has_tenant_role('accountant')) THEN
    RAISE EXCEPTION 'INSUFFICIENT_PERMISSIONS: Finance role required';
  END IF;

  -- Validate inputs
  IF p_payment_amount <= 0 THEN
    RAISE EXCEPTION 'INVALID_AMOUNT: Payment amount must be greater than zero';
  END IF;

  IF p_payment_method NOT IN ('Cash', 'Card', 'PhonePe', 'GPay', 'Online', 'Cheque', 'Bank Transfer') THEN
    RAISE EXCEPTION 'INVALID_PAYMENT_METHOD: Unsupported payment method';
  END IF;

  -- Get tenant context  
  v_tenant_id := auth.current_tenant_id();

  -- Validate student exists and belongs to tenant
  IF NOT EXISTS (
    SELECT 1 FROM public.students 
    WHERE id = p_student_id AND tenant_id = v_tenant_id
  ) THEN
    RAISE EXCEPTION 'STUDENT_NOT_FOUND: Student not found or access denied';
  END IF;

  -- Generate receipt number
  v_receipt_number := public.generate_receipt_number(v_tenant_id, p_academic_year_id);

  -- Create payment record
  INSERT INTO public.fee_payment_records (
    tenant_id, student_id, amount_paid, payment_date, 
    payment_method, receipt_number, payment_receiver,
    target_academic_year_id, late_fee, notes, created_by
  ) VALUES (
    v_tenant_id, p_student_id, p_payment_amount, CURRENT_DATE,
    p_payment_method, v_receipt_number, auth.current_user_name(),
    p_academic_year_id, COALESCE(p_late_fee, 0), p_notes, auth.current_user_name()
  ) RETURNING id INTO v_payment_id;

  -- Allocate payment to fee records (FIFO)
  SELECT public.allocate_payment_fifo_v1(
    p_student_id, p_payment_amount, v_payment_id, p_academic_year_id
  ) INTO v_allocation_result;

  -- Log audit event
  PERFORM public.log_audit_event(
    'payment_recorded',
    jsonb_build_object(
      'payment_id', v_payment_id,
      'amount', p_payment_amount,
      'method', p_payment_method,
      'allocation', v_allocation_result
    ),
    ARRAY[p_student_id]
  );

  -- Return success response
  RETURN jsonb_build_object(
    'success', true,
    'payment_id', v_payment_id,
    'receipt_number', v_receipt_number,
    'allocation_result', v_allocation_result,
    'message', 'Payment recorded successfully'
  );

EXCEPTION WHEN OTHERS THEN
  PERFORM public.log_error_event(
    'record_payment_v1',
    SQLERRM, 
    jsonb_build_object(
      'student_id', p_student_id,
      'amount', p_payment_amount
    )
  );
  RAISE;
END;
$$;
```

### 3. Reporting RPCs

#### generate_fee_report_v1
```sql
CREATE OR REPLACE FUNCTION public.generate_fee_report_v1(
  p_academic_year_id uuid,
  p_class_ids uuid[] DEFAULT NULL,
  p_report_type text DEFAULT 'summary',
  p_include_payments boolean DEFAULT true
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tenant_id uuid;
  v_report_data jsonb;
  v_summary jsonb;
BEGIN
  -- Validate permissions
  IF NOT (
    auth.has_tenant_role('admin') OR 
    auth.has_tenant_role('accountant') OR
    auth.has_tenant_role('auditor')
  ) THEN
    RAISE EXCEPTION 'INSUFFICIENT_PERMISSIONS: Finance or audit role required';
  END IF;

  v_tenant_id := auth.current_tenant_id();

  -- Build report based on type
  CASE p_report_type
    WHEN 'summary' THEN
      SELECT jsonb_build_object(
        'total_fees', COALESCE(SUM(actual_fee), 0),
        'total_discounts', COALESCE(SUM(discount_amount), 0),
        'total_collected', COALESCE(SUM(paid_amount), 0),
        'total_outstanding', COALESCE(SUM(balance_fee), 0),
        'student_count', COUNT(DISTINCT student_id),
        'by_status', jsonb_object_agg(status, status_count)
      ) INTO v_report_data
      FROM (
        SELECT status, COUNT(*) as status_count
        FROM public.v_fee_records_with_enrollment
        WHERE academic_year_id = p_academic_year_id
        AND tenant_id = v_tenant_id
        AND (p_class_ids IS NULL OR class_id = ANY(p_class_ids))
        GROUP BY status
      ) status_summary,
      public.v_fee_records_with_enrollment
      WHERE academic_year_id = p_academic_year_id
      AND tenant_id = v_tenant_id
      AND (p_class_ids IS NULL OR class_id = ANY(p_class_ids));

    WHEN 'detailed' THEN
      SELECT jsonb_agg(
        jsonb_build_object(
          'student_id', student_id,
          'student_name', student_name,
          'class_name', class_name,
          'fee_records', fee_records
        )
      ) INTO v_report_data
      FROM public.v_student_fee_summary
      WHERE academic_year_id = p_academic_year_id
      AND tenant_id = v_tenant_id
      AND (p_class_ids IS NULL OR class_id = ANY(p_class_ids));

    ELSE
      RAISE EXCEPTION 'INVALID_REPORT_TYPE: Supported types are summary, detailed';
  END CASE;

  -- Log report generation
  PERFORM public.log_audit_event(
    'report_generated',
    jsonb_build_object(
      'report_type', p_report_type,
      'academic_year_id', p_academic_year_id,
      'class_ids', p_class_ids
    ),
    ARRAY[]::uuid[]
  );

  RETURN jsonb_build_object(
    'success', true,
    'report_type', p_report_type,
    'generated_at', now(),
    'data', v_report_data
  );

END;
$$;
```

## Testing Strategy

### Unit Tests for RPCs
```sql
-- Test create_student_v1 validation
SELECT public.create_student_v1('{"first_name": "", "last_name": "Test"}');
-- Should raise VALIDATION_ERROR

-- Test payment allocation
SELECT public.record_payment_v1(
  'student-uuid', 1000.00, 'Cash', 'year-uuid'
);
-- Should allocate to oldest outstanding fees first

-- Test promotion idempotency  
SELECT public.promote_students_v2('[]', 'year-uuid', 'test-key-1');
SELECT public.promote_students_v2('[]', 'year-uuid', 'test-key-1');
-- Second call should return cached result
```

### Integration Tests
- End-to-end student creation with fee assignment
- Complete payment workflow with allocation verification
- Bulk promotion with dues carry-forward validation
- Report generation with data accuracy checks

## Monitoring & Alerts

### RPC Performance Metrics
- Execution time per RPC (p50, p95, p99)
- Success/failure rates
- Input validation failure rates
- Lock contention and timeout rates

### Business Logic Monitoring
- Fee calculation accuracy alerts
- Payment allocation discrepancies  
- Promotion safety violations
- Data consistency checks

## Version Management

### Breaking Changes Policy
- New RPC versions for breaking changes (v1 → v2)
- Maintain old versions for 6 months minimum
- Clear deprecation warnings and migration guides
- Automated testing for version compatibility

### API Evolution Example
```sql
-- v1: Basic payment recording
CREATE FUNCTION record_payment_v1(student_id, amount, method)

-- v2: Enhanced with allocation control  
CREATE FUNCTION record_payment_v2(student_id, amount, method, allocation_strategy)

-- v3: Multi-currency support
CREATE FUNCTION record_payment_v3(student_id, amount, currency, method, allocation_strategy)
```