-- Fix the promote_students_with_fees function to work with the new consolidated fee system
CREATE OR REPLACE FUNCTION public.promote_students_with_fees(
  promotion_data JSONB,
  target_academic_year_id UUID,
  promoted_by_user TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
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