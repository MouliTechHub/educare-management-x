-- Create student promotion tracking table
CREATE TABLE public.student_promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  from_academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  to_academic_year_id UUID NOT NULL REFERENCES public.academic_years(id),
  from_class_id UUID NOT NULL REFERENCES public.classes(id),
  to_class_id UUID REFERENCES public.classes(id), -- Nullable for dropouts
  promotion_type TEXT NOT NULL DEFAULT 'promoted' CHECK (promotion_type IN ('promoted', 'repeated', 'dropout')),
  promotion_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reason TEXT,
  notes TEXT,
  promoted_by TEXT NOT NULL DEFAULT 'System',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for efficient querying
CREATE INDEX idx_student_promotions_student_id ON public.student_promotions(student_id);
CREATE INDEX idx_student_promotions_academic_years ON public.student_promotions(from_academic_year_id, to_academic_year_id);
CREATE INDEX idx_student_promotions_promotion_date ON public.student_promotions(promotion_date);

-- Enable RLS
ALTER TABLE public.student_promotions ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all for authenticated users" 
ON public.student_promotions 
FOR ALL 
USING (true);

-- Add trigger for updated_at
CREATE TRIGGER update_student_promotions_updated_at
  BEFORE UPDATE ON public.student_promotions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to check if fee structure exists for promotion
CREATE OR REPLACE FUNCTION public.check_fee_structure_exists(target_academic_year_id UUID, target_class_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.fee_structures 
    WHERE academic_year_id = target_academic_year_id 
    AND class_id = target_class_id 
    AND is_active = true
  );
END;
$$;

-- Create function to promote students and auto-create fee records
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
  student_record JSONB;
  promotion_id UUID;
  fee_structures RECORD;
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

      -- Update student's class if promoted (not for dropouts)
      IF promotion_record->>'promotion_type' = 'promoted' THEN
        UPDATE public.students 
        SET class_id = (promotion_record->>'to_class_id')::UUID,
            updated_at = now()
        WHERE id = (promotion_record->>'student_id')::UUID;

        -- Create fee records for promoted students if fee structure exists
        FOR fee_structures IN 
          SELECT * FROM public.fee_structures 
          WHERE academic_year_id = target_academic_year_id 
          AND class_id = (promotion_record->>'to_class_id')::UUID
          AND is_active = true
        LOOP
          INSERT INTO public.fees (
            student_id,
            fee_type,
            amount,
            actual_amount,
            due_date,
            academic_year_id,
            status
          )
          VALUES (
            (promotion_record->>'student_id')::UUID,
            fee_structures.fee_type,
            fee_structures.amount,
            fee_structures.amount,
            CURRENT_DATE + INTERVAL '30 days',
            target_academic_year_id,
            'Pending'
          );
        END LOOP;

        result := jsonb_set(result, '{promoted}', ((result->>'promoted')::INT + 1)::TEXT::JSONB);
      
      ELSIF promotion_record->>'promotion_type' = 'repeated' THEN
        -- For repeated students, create fee records for current class
        FOR fee_structures IN 
          SELECT * FROM public.fee_structures 
          WHERE academic_year_id = target_academic_year_id 
          AND class_id = (promotion_record->>'from_class_id')::UUID
          AND is_active = true
        LOOP
          INSERT INTO public.fees (
            student_id,
            fee_type,
            amount,
            actual_amount,
            due_date,
            academic_year_id,
            status
          )
          VALUES (
            (promotion_record->>'student_id')::UUID,
            fee_structures.fee_type,
            fee_structures.amount,
            fee_structures.amount,
            CURRENT_DATE + INTERVAL '30 days',
            target_academic_year_id,
            'Pending'
          );
        END LOOP;

        result := jsonb_set(result, '{repeated}', ((result->>'repeated')::INT + 1)::TEXT::JSONB);
      
      ELSE -- dropout
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