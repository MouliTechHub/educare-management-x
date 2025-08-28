import { supabase } from "@/integrations/supabase/client";

export interface StudentWithStatus {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  gender: string;
  date_of_birth: string;
  class_id: string;
  status: string;
  exit_reason?: string;
  exit_date?: string;
  feedback_notes?: string;
  created_at: string;
  updated_at: string;
  class_name?: string;
  section?: string;
}

export function useStatusBasedStudentFetcher() {
  const fetchStudentsByStatus = async (status: string): Promise<StudentWithStatus[]> => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          id,
          first_name,
          last_name,
          admission_number,
          gender,
          date_of_birth,
          class_id,
          status,
          exit_reason,
          exit_date,
          feedback_notes,
          created_at,
          updated_at,
          classes!inner(
            name,
            section
          )
        `)
        .eq('status', status)
        .is('deleted_at', null)
        .order('first_name');

      if (error) {
        console.error('Error fetching students by status:', error);
        throw error;
      }

      return data?.map(student => ({
        ...student,
        class_name: student.classes?.name,
        section: student.classes?.section,
      })) || [];
    } catch (error) {
      console.error('Error in fetchStudentsByStatus:', error);
      throw error;
    }
  };

  const fetchActiveStudents = () => fetchStudentsByStatus('Active');
  const fetchInactiveStudents = () => fetchStudentsByStatus('Inactive');
  const fetchAlumniStudents = () => fetchStudentsByStatus('Alumni');
  const fetchTransferredStudents = () => fetchStudentsByStatus('Transferred');
  const fetchWithdrawnStudents = () => fetchStudentsByStatus('Withdrawn');

  const reactivateStudent = async (studentId: string) => {
    try {
      const { error } = await supabase.rpc('reactivate_student', {
        p_student_id: studentId
      });

      if (error) {
        console.error('Error reactivating student:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in reactivateStudent:', error);
      throw error;
    }
  };

  return {
    fetchStudentsByStatus,
    fetchActiveStudents,
    fetchInactiveStudents,
    fetchAlumniStudents,
    fetchTransferredStudents,
    fetchWithdrawnStudents,
    reactivateStudent,
  };
}