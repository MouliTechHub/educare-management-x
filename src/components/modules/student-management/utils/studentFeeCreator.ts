
import { supabase } from "@/integrations/supabase/client";

export const createDefaultFeeRecords = async (studentId: string) => {
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

    // Create default fee records with valid fee types based on the database constraint
    const defaultFees = [
      {
        student_id: studentId,
        fee_type: 'Tuition', // Using simple fee type names that match the constraint
        amount: 5000,
        actual_amount: 5000,
        discount_amount: 0,
        total_paid: 0,
        due_date: new Date(new Date().getFullYear(), 3, 30).toISOString().split('T')[0], // April 30
        status: 'Pending',
        academic_year_id: currentYear.id
      },
      {
        student_id: studentId,
        fee_type: 'Development', // Using simple fee type names that match the constraint
        amount: 1000,
        actual_amount: 1000,
        discount_amount: 0,
        total_paid: 0,
        due_date: new Date(new Date().getFullYear(), 3, 30).toISOString().split('T')[0], // April 30
        status: 'Pending',
        academic_year_id: currentYear.id
      }
    ];

    const { error: feeError } = await supabase
      .from('fees')
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
