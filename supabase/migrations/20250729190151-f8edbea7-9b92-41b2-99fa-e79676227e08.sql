-- Fix remaining functions with search_path

CREATE OR REPLACE FUNCTION public.log_fee_audit(p_student_id uuid, p_fee_record_id uuid, p_action_type text, p_academic_year_id uuid, p_performed_by text, p_old_values jsonb DEFAULT NULL::jsonb, p_new_values jsonb DEFAULT NULL::jsonb, p_amount_affected numeric DEFAULT 0, p_notes text DEFAULT NULL::text, p_reference_number text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.fee_audit_log (
    student_id, fee_record_id, action_type, old_values, new_values,
    amount_affected, academic_year_id, performed_by, notes, reference_number
  )
  VALUES (
    p_student_id, p_fee_record_id, p_action_type, p_old_values, p_new_values,
    p_amount_affected, p_academic_year_id, p_performed_by, p_notes, p_reference_number
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.log_discount_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    source_table_name TEXT;
BEGIN
    -- Only log if discount_amount actually changed
    IF TG_OP = 'UPDATE' AND (
        ABS(COALESCE(OLD.discount_amount, 0) - COALESCE(NEW.discount_amount, 0)) > 0.01
    ) THEN
        
        -- Determine which table we're working with
        source_table_name := TG_TABLE_NAME;
        
        -- Check for recent duplicates more precisely
        IF NOT EXISTS (
            SELECT 1 FROM public.discount_history 
            WHERE source_fee_id = NEW.id
            AND source_table = source_table_name
            AND ABS(discount_amount - (NEW.discount_amount - COALESCE(OLD.discount_amount, 0))) < 0.01
            AND applied_at > (now() - INTERVAL '5 seconds')
            AND applied_by = COALESCE(NEW.discount_updated_by, 'Admin')
        ) THEN
            INSERT INTO public.discount_history (
                fee_id,
                source_fee_id,
                source_table,
                student_id,
                discount_amount,
                discount_type,
                reason,
                notes,
                applied_by
            ) VALUES (
                NEW.id,       -- Use the student_fee_record id as both fee_id and source_fee_id
                NEW.id,       -- Always store the actual record ID
                source_table_name,
                NEW.student_id,
                NEW.discount_amount - COALESCE(OLD.discount_amount, 0),
                'Fixed Amount',
                CASE 
                    WHEN NEW.discount_notes IS NOT NULL AND NEW.discount_notes != '' THEN NEW.discount_notes
                    WHEN COALESCE(NEW.discount_updated_by, 'Admin') != 'Admin' THEN 'Discount applied by ' || COALESCE(NEW.discount_updated_by, 'Admin')
                    ELSE 'Discount applied'
                END,
                NEW.discount_notes,
                COALESCE(NEW.discount_updated_by, 'Admin')
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.carry_forward_student_fees(p_student_id uuid, p_from_academic_year_id uuid, p_to_academic_year_id uuid, p_carry_forward_type text DEFAULT 'automatic'::text, p_created_by text DEFAULT 'System'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  outstanding_amount NUMERIC := 0;
  carry_forward_id UUID;
  new_fee_record_id UUID;
  student_class_id UUID;
  result JSONB;
BEGIN
  -- Get student's current class
  SELECT class_id INTO student_class_id 
  FROM public.students 
  WHERE id = p_student_id;
  
  -- Calculate total outstanding amount
  SELECT COALESCE(SUM(balance_fee), 0) INTO outstanding_amount
  FROM public.student_fee_records
  WHERE student_id = p_student_id
    AND academic_year_id = p_from_academic_year_id
    AND balance_fee > 0
    AND status != 'Paid';
  
  -- Only proceed if there are outstanding amounts
  IF outstanding_amount > 0 THEN
    -- Create carry forward record
    INSERT INTO public.fee_carry_forward (
      student_id,
      from_academic_year_id,
      to_academic_year_id,
      original_amount,
      carried_amount,
      carry_forward_type,
      created_by
    )
    VALUES (
      p_student_id,
      p_from_academic_year_id,
      p_to_academic_year_id,
      outstanding_amount,
      outstanding_amount,
      p_carry_forward_type,
      p_created_by
    )
    RETURNING id INTO carry_forward_id;
    
    -- Create new fee record in target academic year
    INSERT INTO public.student_fee_records (
      student_id,
      class_id,
      academic_year_id,
      fee_type,
      actual_fee,
      discount_amount,
      paid_amount,
      due_date,
      status,
      is_carry_forward,
      carry_forward_source_id,
      priority_order
    )
    VALUES (
      p_student_id,
      student_class_id,
      p_to_academic_year_id,
      'Previous Year Dues',
      outstanding_amount,
      0,
      0,
      CURRENT_DATE + INTERVAL '15 days',
      'Pending',
      true,
      carry_forward_id,
      1 -- Highest priority
    )
    RETURNING id INTO new_fee_record_id;
    
    -- Log the carry forward action
    PERFORM public.log_fee_audit(
      p_student_id,
      new_fee_record_id,
      'carry_forward',
      p_to_academic_year_id,
      p_created_by,
      jsonb_build_object('previous_year_outstanding', outstanding_amount),
      jsonb_build_object('carried_forward_amount', outstanding_amount),
      outstanding_amount,
      'Automatic carry forward of outstanding fees',
      carry_forward_id::TEXT
    );
    
    result := jsonb_build_object(
      'success', true,
      'carry_forward_id', carry_forward_id,
      'new_fee_record_id', new_fee_record_id,
      'outstanding_amount', outstanding_amount,
      'message', 'Outstanding fees carried forward successfully'
    );
  ELSE
    result := jsonb_build_object(
      'success', false,
      'message', 'No outstanding fees to carry forward'
    );
  END IF;
  
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_fee_priorities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.student_fee_records 
  SET priority_order = CASE 
    WHEN fee_type = 'Previous Year Dues' THEN 1
    WHEN due_date < CURRENT_DATE THEN 2 -- Overdue
    ELSE 3 -- Current/Future
  END
  WHERE priority_order IS NULL OR priority_order != CASE 
    WHEN fee_type = 'Previous Year Dues' THEN 1
    WHEN due_date < CURRENT_DATE THEN 2
    ELSE 3
  END;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_update_fee_priority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.priority_order := CASE 
    WHEN NEW.fee_type = 'Previous Year Dues' THEN 1
    WHEN NEW.due_date < CURRENT_DATE THEN 2
    ELSE 3
  END;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.allocate_payment_fifo(p_student_id uuid, p_payment_amount numeric, p_payment_record_id uuid, p_academic_year_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  remaining_amount NUMERIC := p_payment_amount;
  allocation_record RECORD;
  allocation_order INTEGER := 1;
  total_allocated NUMERIC := 0;
  allocations JSONB := '[]'::JSONB;
  allocated_amount NUMERIC;
BEGIN
  -- Check if allocations already exist for this payment record
  IF EXISTS (SELECT 1 FROM public.payment_allocations WHERE payment_record_id = p_payment_record_id) THEN
    -- Return existing allocation data with proper column aliasing
    SELECT jsonb_build_object(
      'total_allocated', COALESCE(SUM(pa.allocated_amount), 0),
      'remaining_amount', p_payment_amount - COALESCE(SUM(pa.allocated_amount), 0),
      'allocations', jsonb_agg(
        jsonb_build_object(
          'fee_record_id', pa.fee_record_id,
          'allocated_amount', pa.allocated_amount
        )
      )
    ) INTO allocations
    FROM public.payment_allocations pa
    WHERE pa.payment_record_id = p_payment_record_id;
    
    RETURN allocations;
  END IF;

  -- Get all outstanding fee records for the student, ordered by NEW priority logic
  FOR allocation_record IN
    SELECT 
      sfr.id,
      sfr.fee_type,
      sfr.academic_year_id,
      sfr.balance_fee,
      sfr.due_date,
      ay.year_name,
      CASE 
        WHEN sfr.academic_year_id = p_academic_year_id THEN 1  -- PRIORITY 1: All fees from target academic year
        WHEN sfr.fee_type = 'Previous Year Dues' AND sfr.academic_year_id != p_academic_year_id THEN 2  -- PRIORITY 2: Previous Year Dues from other years
        ELSE 3  -- PRIORITY 3: Other fees from other years
      END as priority_group
    FROM public.student_fee_records sfr
    JOIN public.academic_years ay ON sfr.academic_year_id = ay.id
    WHERE sfr.student_id = p_student_id
      AND sfr.balance_fee > 0
      AND sfr.status != 'Paid'
      AND NOT COALESCE(sfr.payment_blocked, false)
    ORDER BY 
      priority_group ASC,
      CASE 
        WHEN sfr.academic_year_id = p_academic_year_id AND sfr.fee_type = 'Previous Year Dues' THEN 1
        WHEN sfr.academic_year_id = p_academic_year_id THEN 2
        ELSE 3
      END ASC,
      sfr.due_date ASC NULLS LAST,
      sfr.created_at ASC
  LOOP
    -- Exit if no remaining amount
    IF remaining_amount <= 0 THEN
      EXIT;
    END IF;
    
    -- Calculate allocation amount (either full balance or remaining payment)
    allocated_amount := LEAST(remaining_amount, allocation_record.balance_fee);
    
    -- Record the allocation with ON CONFLICT handling
    INSERT INTO public.payment_allocations (
      payment_record_id,
      fee_record_id,
      allocated_amount,
      allocation_order
    )
    VALUES (
      p_payment_record_id,
      allocation_record.id,
      allocated_amount,
      allocation_order
    )
    ON CONFLICT (payment_record_id, fee_record_id) 
    DO UPDATE SET 
      allocated_amount = EXCLUDED.allocated_amount,
      allocation_order = EXCLUDED.allocation_order;
    
    -- Update the fee record - only update paid_amount, balance_fee will be calculated automatically
    UPDATE public.student_fee_records
    SET 
      paid_amount = paid_amount + allocated_amount,
      status = CASE 
        WHEN (actual_fee - discount_amount) <= (paid_amount + allocated_amount) THEN 'Paid'
        WHEN (paid_amount + allocated_amount) > 0 THEN 'Partial'
        ELSE status
      END,
      updated_at = now()
    WHERE id = allocation_record.id;
    
    -- Add to allocations result
    allocations := allocations || jsonb_build_object(
      'fee_record_id', allocation_record.id,
      'fee_type', allocation_record.fee_type,
      'academic_year', allocation_record.year_name,
      'allocated_amount', allocated_amount,
      'remaining_balance', allocation_record.balance_fee - allocated_amount
    );
    
    -- Update counters
    remaining_amount := remaining_amount - allocated_amount;
    total_allocated := total_allocated + allocated_amount;
    allocation_order := allocation_order + 1;
  END LOOP;
  
  RETURN jsonb_build_object(
    'total_allocated', total_allocated,
    'remaining_amount', remaining_amount,
    'allocations', allocations
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.enhanced_payment_allocation_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  allocation_result JSONB;
  target_academic_year_id UUID;
BEGIN
  -- Use the target academic year if provided, otherwise use current academic year
  target_academic_year_id := NEW.target_academic_year_id;
  
  -- If no target academic year specified, use current academic year as fallback
  IF target_academic_year_id IS NULL THEN
    SELECT id INTO target_academic_year_id
    FROM public.academic_years 
    WHERE is_current = true 
    LIMIT 1;
  END IF;
  
  -- Allocate payment using FIFO logic with the target academic year
  SELECT public.allocate_payment_fifo(
    NEW.student_id,
    NEW.amount_paid,
    NEW.id,
    target_academic_year_id
  ) INTO allocation_result;
  
  -- Log the payment action
  PERFORM public.log_fee_audit(
    NEW.student_id,
    NEW.fee_record_id,
    'payment',
    target_academic_year_id,
    NEW.created_by,
    NULL,
    jsonb_build_object(
      'amount_paid', NEW.amount_paid,
      'payment_method', NEW.payment_method,
      'allocation_result', allocation_result,
      'target_academic_year', target_academic_year_id
    ),
    NEW.amount_paid,
    NEW.notes,
    NEW.receipt_number
  );
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_assign_tuition_fee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year_id UUID;
  fee_structure_record RECORD;
  due_date_calculated DATE;
BEGIN
  -- Get current academic year
  SELECT id INTO current_year_id 
  FROM public.academic_years 
  WHERE is_current = true 
  LIMIT 1;
  
  IF current_year_id IS NULL THEN
    RAISE NOTICE 'No current academic year found';
    RETURN NEW;
  END IF;
  
  -- Calculate due date (30 days from now)
  due_date_calculated := CURRENT_DATE + INTERVAL '30 days';
  
  -- Get all fee structures for the student's class and current academic year
  FOR fee_structure_record IN 
    SELECT *
    FROM public.fee_structures
    WHERE class_id = NEW.class_id 
      AND academic_year_id = current_year_id
      AND is_active = true
  LOOP
    -- Insert fee record for each fee structure
    INSERT INTO public.student_fee_records (
      student_id,
      class_id,
      academic_year_id,
      fee_type,
      actual_fee,
      due_date,
      status
    )
    VALUES (
      NEW.id,
      NEW.class_id,
      current_year_id,
      fee_structure_record.fee_type,
      fee_structure_record.amount,
      due_date_calculated,
      'Pending'
    )
    ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.promote_students_with_fees(promotion_data jsonb, target_academic_year_id uuid, promoted_by_user text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  promotion_record JSONB;
  promotion_id UUID;
  fee_structures RECORD;
  outstanding_balance NUMERIC;
  result JSONB := '{"promoted": 0, "repeated": 0, "dropouts": 0, "errors": []}'::JSONB;
  error_msg TEXT;
BEGIN
  -- Loop through each promotion record
  FOR promotion_record IN SELECT * FROM jsonb_array_elements(promotion_data)
  LOOP
    BEGIN
      -- Insert promotion record
      INSERT INTO public.student_promotions (
        student_id,
        from_academic_year_id,
        to_academic_year_id,
        from_class_id,
        to_class_id,
        promotion_type,
        reason,
        notes,
        promoted_by
      )
      VALUES (
        (promotion_record->>'student_id')::UUID,
        (promotion_record->>'from_academic_year_id')::UUID,
        target_academic_year_id,
        (promotion_record->>'from_class_id')::UUID,
        CASE 
          WHEN promotion_record->>'promotion_type' = 'dropout' THEN NULL 
          ELSE (promotion_record->>'to_class_id')::UUID 
        END,
        promotion_record->>'promotion_type',
        promotion_record->>'reason',
        promotion_record->>'notes',
        promoted_by_user
      )
      RETURNING id INTO promotion_id;

      -- Check for outstanding balance from previous year
      SELECT COALESCE(SUM(GREATEST(final_fee - paid_amount, 0)), 0) 
      INTO outstanding_balance
      FROM public.student_fee_records
      WHERE student_id = (promotion_record->>'student_id')::UUID
        AND academic_year_id = (promotion_record->>'from_academic_year_id')::UUID
        AND status != 'Paid';

      -- Handle different promotion types
      IF promotion_record->>'promotion_type' = 'promoted' THEN
        -- Update student's class if promoted
        UPDATE public.students 
        SET class_id = (promotion_record->>'to_class_id')::UUID,
            updated_at = now()
        WHERE id = (promotion_record->>'student_id')::UUID;

        -- Create "Previous Year Dues" record if student has outstanding balance
        IF outstanding_balance > 0 THEN
          INSERT INTO public.student_fee_records (
            student_id,
            class_id,
            academic_year_id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            due_date,
            status
          )
          VALUES (
            (promotion_record->>'student_id')::UUID,
            (promotion_record->>'to_class_id')::UUID,
            target_academic_year_id,
            'Previous Year Dues',
            outstanding_balance,
            0,
            0,
            CURRENT_DATE + INTERVAL '15 days', -- Shorter due date for previous year dues
            'Pending'
          );
        END IF;

        -- Create new fee records for the promoted student's new class
        FOR fee_structures IN 
          SELECT * FROM public.fee_structures 
          WHERE academic_year_id = target_academic_year_id 
          AND class_id = (promotion_record->>'to_class_id')::UUID
          AND is_active = true
        LOOP
          INSERT INTO public.student_fee_records (
            student_id,
            class_id,
            academic_year_id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            due_date,
            status
          )
          VALUES (
            (promotion_record->>'student_id')::UUID,
            (promotion_record->>'to_class_id')::UUID,
            target_academic_year_id,
            fee_structures.fee_type,
            fee_structures.amount,
            0,
            0,
            CURRENT_DATE + INTERVAL '30 days',
            'Pending'
          )
          ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        END LOOP;

        result := jsonb_set(result, '{promoted}', ((result->>'promoted')::INT + 1)::TEXT::JSONB);
      
      ELSIF promotion_record->>'promotion_type' = 'repeated' THEN
        -- Create "Previous Year Dues" record if student has outstanding balance
        IF outstanding_balance > 0 THEN
          INSERT INTO public.student_fee_records (
            student_id,
            class_id,
            academic_year_id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            due_date,
            status
          )
          VALUES (
            (promotion_record->>'student_id')::UUID,
            (promotion_record->>'from_class_id')::UUID,
            target_academic_year_id,
            'Previous Year Dues',
            outstanding_balance,
            0,
            0,
            CURRENT_DATE + INTERVAL '15 days',
            'Pending'
          );
        END IF;

        -- For repeated students, create fee records for same class
        FOR fee_structures IN 
          SELECT * FROM public.fee_structures 
          WHERE academic_year_id = target_academic_year_id 
          AND class_id = (promotion_record->>'from_class_id')::UUID
          AND is_active = true
        LOOP
          INSERT INTO public.student_fee_records (
            student_id,
            class_id,
            academic_year_id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            due_date,
            status
          )
          VALUES (
            (promotion_record->>'student_id')::UUID,
            (promotion_record->>'from_class_id')::UUID,
            target_academic_year_id,
            fee_structures.fee_type,
            fee_structures.amount,
            0,
            0,
            CURRENT_DATE + INTERVAL '30 days',
            'Pending'
          )
          ON CONFLICT (student_id, class_id, academic_year_id, fee_type) DO NOTHING;
        END LOOP;

        result := jsonb_set(result, '{repeated}', ((result->>'repeated')::INT + 1)::TEXT::JSONB);
      
      ELSE -- dropout
        -- Create "Previous Year Dues" record if student has outstanding balance (still need to collect)
        IF outstanding_balance > 0 THEN
          INSERT INTO public.student_fee_records (
            student_id,
            class_id,
            academic_year_id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            due_date,
            status
          )
          VALUES (
            (promotion_record->>'student_id')::UUID,
            (promotion_record->>'from_class_id')::UUID,
            target_academic_year_id,
            'Previous Year Dues',
            outstanding_balance,
            0,
            0,
            CURRENT_DATE + INTERVAL '15 days',
            'Pending'
          );
        END IF;

        -- Update student status to inactive
        UPDATE public.students 
        SET status = 'Inactive',
            updated_at = now()
        WHERE id = (promotion_record->>'student_id')::UUID;

        result := jsonb_set(result, '{dropouts}', ((result->>'dropouts')::INT + 1)::TEXT::JSONB);
      END IF;

    EXCEPTION WHEN OTHERS THEN
      error_msg := SQLERRM;
      result := jsonb_set(
        result, 
        '{errors}', 
        (result->'errors') || jsonb_build_array(
          'Student ID: ' || (promotion_record->>'student_id') || ' - ' || error_msg
        )
      );
    END;
  END LOOP;

  RETURN result;
END;
$$;