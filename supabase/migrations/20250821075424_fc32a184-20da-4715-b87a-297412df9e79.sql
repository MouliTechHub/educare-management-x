-- Add foreign key constraints for PostgREST relationship detection
DO $$
BEGIN
    -- Add constraints to student_fee_records if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sfr_student' AND table_name = 'student_fee_records') THEN
        ALTER TABLE public.student_fee_records ADD CONSTRAINT fk_sfr_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sfr_year' AND table_name = 'student_fee_records') THEN
        ALTER TABLE public.student_fee_records ADD CONSTRAINT fk_sfr_year FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_sfr_class' AND table_name = 'student_fee_records') THEN
        ALTER TABLE public.student_fee_records ADD CONSTRAINT fk_sfr_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;
    
    -- Add constraints to student_enrollments if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_se_student' AND table_name = 'student_enrollments') THEN
        ALTER TABLE public.student_enrollments ADD CONSTRAINT fk_se_student FOREIGN KEY (student_id) REFERENCES public.students(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_se_year' AND table_name = 'student_enrollments') THEN
        ALTER TABLE public.student_enrollments ADD CONSTRAINT fk_se_year FOREIGN KEY (academic_year_id) REFERENCES public.academic_years(id) ON DELETE CASCADE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_se_class' AND table_name = 'student_enrollments') THEN
        ALTER TABLE public.student_enrollments ADD CONSTRAINT fk_se_class FOREIGN KEY (class_id) REFERENCES public.classes(id) ON DELETE CASCADE;
    END IF;
    
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'uq_se_student_year' AND table_name = 'student_enrollments') THEN
        ALTER TABLE public.student_enrollments ADD CONSTRAINT uq_se_student_year UNIQUE (student_id, academic_year_id);
    END IF;
END $$;

-- Create view that joins fee records with enrollments by academic year
CREATE OR REPLACE VIEW public.v_fee_records_with_enrollment AS
SELECT
  fr.*,
  se.class_id as enrolled_class_id,
  se.academic_year_id as enrolled_year_id,
  c.name as enrolled_class_name,
  c.section as enrolled_class_section
FROM public.student_fee_records fr
JOIN public.student_enrollments se
  ON se.student_id = fr.student_id
 AND se.academic_year_id = fr.academic_year_id
JOIN public.classes c
  ON c.id = se.class_id;