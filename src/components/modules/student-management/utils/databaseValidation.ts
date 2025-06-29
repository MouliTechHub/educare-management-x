
import { supabase } from "@/integrations/supabase/client";

// Helper function to check if admission number already exists
export const checkAdmissionNumberExists = async (admissionNumber: string, excludeStudentId?: string): Promise<boolean> => {
  try {
    console.log('Checking admission number:', admissionNumber, 'excluding student ID:', excludeStudentId);
    
    let query = supabase
      .from("students")
      .select("id")
      .eq("admission_number", admissionNumber.trim());
      
    if (excludeStudentId) {
      query = query.neq("id", excludeStudentId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Error checking admission number:", error);
      throw error;
    }
    
    const exists = data && data.length > 0;
    console.log('Admission number exists:', exists, 'data:', data);
    
    return exists;
  } catch (error) {
    console.error("Error in checkAdmissionNumberExists:", error);
    // Return false to allow the operation to proceed in case of check failure
    return false;
  }
};
