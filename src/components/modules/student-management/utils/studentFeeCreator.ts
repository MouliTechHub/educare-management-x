
import { supabase } from "@/integrations/supabase/client";

// Valid fee types that match the database constraint
const VALID_FEE_TYPES = {
  TUITION: 'Tuition',
  DEVELOPMENT: 'Development',
  LIBRARY: 'Library',
  LAB: 'Lab',
  SPORTS: 'Sports',
  TRANSPORT: 'Transport',
  EXAM: 'Exam',
  OTHER: 'Other'
} as const;

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

    // Create default fee records with valid fee types
    const defaultFees = [
      {
        student_id: studentId,
        fee_type: VALID_FEE_TYPES.TUITION,
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
        fee_type: VALID_FEE_TYPES.DEVELOPMENT,
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
      
      // Check if it's a constraint violation error and provide user-friendly message
      if (feeError.message.includes('fees_fee_type_check')) {
        throw new Error('Invalid fee type detected. Please contact the administrator.');
      }
      
      throw feeError;
    }

    console.log('Default fee records created successfully');
  } catch (error) {
    console.error('Error creating default fee records:', error);
    throw error;
  }
};
