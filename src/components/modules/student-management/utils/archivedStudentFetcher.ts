import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface ArchivedStudent {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  gender: string;
  class_id: string;
  status: string;
  deleted_at: string;
  deleted_reason: string;
  created_at: string;
  updated_at: string;
  date_of_birth: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  photo_url?: string;
  class_name?: string;
  class_section?: string;
}

export const useArchivedStudentFetcher = () => {
  const { toast } = useToast();

  const fetchArchivedStudents = async (): Promise<ArchivedStudent[]> => {
    try {
      console.log('Fetching archived students...');
      const { data, error } = await supabase
        .from("v_archived_students")
        .select("*")
        .order("deleted_at", { ascending: false });

      if (error) {
        console.error('Error fetching archived students:', error);
        throw error;
      }
      
      console.log('Fetched archived students:', data);
      return data || [];
    } catch (error: any) {
      console.error('fetchArchivedStudents error:', error);
      toast({
        title: "Error fetching archived students",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const restoreStudent = async (studentId: string, reason: string = 'Manual restore'): Promise<void> => {
    if (!confirm("Are you sure you want to restore this student? They will be moved back to the active student list.")) {
      return;
    }

    try {
      console.log('Restoring student:', studentId, 'with reason:', reason);
      
      const { error } = await supabase.rpc('restore_student', {
        p_student_id: studentId,
        p_reason: reason
      });

      if (error) {
        console.error('Error restoring student:', error);
        throw error;
      }

      toast({ 
        title: "Student restored successfully",
        description: "Student has been moved back to the active student list."
      });
    } catch (error: any) {
      console.error('restoreStudent error:', error);
      toast({
        title: "Error restoring student", 
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { fetchArchivedStudents, restoreStudent };
};