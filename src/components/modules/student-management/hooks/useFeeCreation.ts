
import { supabase } from "@/integrations/supabase/client";

export function useFeeCreation() {
  const createDefaultFeeRecords = async (studentId: string) => {
    try {
      console.log('Creating default fee records for student:', studentId);
      
      // Get the current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (yearError) {
        console.error('Error fetching current academic year:', yearError);
        return;
      }

      if (!currentYear) {
        console.log('No current academic year found, skipping fee creation');
        return;
      }

      // Get student's class
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('class_id')
        .eq('id', studentId)
        .single();

      if (studentError || !student) {
        console.error('Error fetching student class:', studentError);
        return;
      }

      // Create default fee records with valid fee types that match the database constraint
      const defaultFees = [
        {
          student_id: studentId,
          class_id: student.class_id,
          academic_year_id: currentYear.id,
          fee_type: 'Tuition Fee',
          actual_fee: 5000,
          discount_amount: 0,
          paid_amount: 0,
          due_date: new Date(new Date().getFullYear(), 3, 30).toISOString().split('T')[0],
          status: 'Pending'
        },
        {
          student_id: studentId,
          class_id: student.class_id,
          academic_year_id: currentYear.id,
          fee_type: 'Development Fee',
          actual_fee: 1000,
          discount_amount: 0,
          paid_amount: 0,
          due_date: new Date(new Date().getFullYear(), 3, 30).toISOString().split('T')[0],
          status: 'Pending'
        }
      ];

      const { error: feeError } = await supabase
        .from('student_fee_records')
        .insert(defaultFees);

      if (feeError) {
        console.error('Error creating default fee records:', feeError);
        throw feeError;
      }

      console.log('Default fee records created successfully');
    } catch (error) {
      console.error('Error creating default fee records:', error);
      throw error;
    }
  };

  return { createDefaultFeeRecords };
}
