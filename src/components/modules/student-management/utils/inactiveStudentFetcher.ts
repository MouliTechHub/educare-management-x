import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface InactiveStudent {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  gender: string;
  class_id: string;
  status: string;
  exit_reason: string | null;
  exit_feedback: string | null;
  exit_date: string | null;
  inactive_at: string | null;
  reactivated_at: string | null;
  anonymized: boolean;
  created_at: string;
  updated_at: string;
  class_name: string | null;
  section: string | null;
}

export const useInactiveStudentFetcher = () => {
  const { toast } = useToast();

  const fetchInactiveStudents = async (): Promise<InactiveStudent[]> => {
    try {
      console.log('Fetching inactive students...');
      
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          admission_number,
          gender,
          class_id,
          status,
          exit_reason,
          exit_feedback,
          exit_date,
          inactive_at,
          reactivated_at,
          anonymized,
          created_at,
          updated_at,
          classes (
            name,
            section
          )
        `)
        .in('status', ['Inactive', 'Alumni', 'Transferred', 'Withdrawn'])
        .order('inactive_at', { ascending: false });

      if (error) {
        console.error('Error fetching inactive students:', error);
        throw error;
      }

      // Transform the data to match our interface
      const transformedData: InactiveStudent[] = (data || []).map(student => ({
        ...student,
        class_name: student.classes?.name || null,
        section: student.classes?.section || null,
      }));

      console.log('Fetched inactive students:', transformedData);
      return transformedData;
    } catch (error) {
      console.error('fetchInactiveStudents error:', error);
      throw error;
    }
  };

  const reactivateStudent = async (id: string) => {
    if (!confirm("Are you sure you want to reactivate this student? They will be moved back to the active list.")) return;

    try {
      console.log('Reactivating student:', id);
      
      const { error } = await supabase.rpc('reactivate_student', {
        p_student_id: id
      });

      if (error) {
        console.error('Error reactivating student:', error);
        throw error;
      }

      toast({ 
        title: "Student reactivated successfully",
        description: "Student has been moved back to the active list."
      });
    } catch (error: any) {
      console.error('reactivateStudent error:', error);
      toast({
        title: "Error reactivating student", 
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { fetchInactiveStudents, reactivateStudent };
};