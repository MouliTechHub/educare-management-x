
import { supabase } from "@/integrations/supabase/client";

export const createDefaultFeeRecords = async (studentId: string, classId: string) => {
  try {
    console.log('🔄 Auto-creating fee records for new student:', studentId);

    // Get current academic year
    const { data: currentYear, error: yearError } = await supabase
      .from("academic_years")
      .select("id")
      .eq("is_current", true)
      .single();

    if (yearError || !currentYear) {
      console.log('No current academic year found, skipping fee creation');
      return;
    }

    // Get fee structures for the student's class
    const { data: feeStructures, error: structuresError } = await supabase
      .from("fee_structures")
      .select("*")
      .eq("class_id", classId)
      .eq("academic_year_id", currentYear.id)
      .eq("is_active", true);

    if (structuresError) throw structuresError;

    if (!feeStructures || feeStructures.length === 0) {
      console.log('No fee structures found for class:', classId);
      return;
    }

    // Create fee records for each fee structure
    const feeRecords = feeStructures.map(structure => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Due in 30 days

      return {
        student_id: studentId,
        class_id: classId,
        academic_year_id: currentYear.id,
        actual_fee: structure.amount,
        discount_amount: 0,
        paid_amount: 0,
        fee_type: structure.fee_type,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'Pending'
      };
    });

    const { error: insertError } = await supabase
      .from("student_fee_records")
      .insert(feeRecords);

    if (insertError) throw insertError;

    console.log('✅ Created', feeRecords.length, 'fee records for new student');
  } catch (error) {
    console.error('❌ Error creating fee records for new student:', error);
    // Don't throw error to avoid blocking student creation
  }
};
