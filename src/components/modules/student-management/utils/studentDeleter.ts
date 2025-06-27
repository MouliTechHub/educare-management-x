
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useStudentDeleter = () => {
  const { toast } = useToast();

  const deleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student? This will also delete all associated fees and parent links.")) return;

    try {
      console.log('Deleting student and associated records:', id);
      
      // Delete associated fees first
      const { error: feesError } = await supabase
        .from("fees")
        .delete()
        .eq("student_id", id);

      if (feesError) {
        console.error('Error deleting fees:', feesError);
        throw feesError;
      }

      // Delete parent links
      const { error: parentLinksError } = await supabase
        .from("student_parent_links")
        .delete()
        .eq("student_id", id);

      if (parentLinksError) {
        console.error('Error deleting parent links:', parentLinksError);
        throw parentLinksError;
      }

      // Delete attendance records
      const { error: attendanceError } = await supabase
        .from("attendance")
        .delete()
        .eq("student_id", id);

      if (attendanceError) {
        console.error('Error deleting attendance records:', attendanceError);
        throw attendanceError;
      }

      // Delete grades
      const { error: gradesError } = await supabase
        .from("grades")
        .delete()
        .eq("student_id", id);

      if (gradesError) {
        console.error('Error deleting grades:', gradesError);
        throw gradesError;
      }

      // Finally delete the student
      const { error: studentError } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

      if (studentError) {
        console.error('Error deleting student:', studentError);
        throw studentError;
      }

      toast({ title: "Student and all associated records deleted successfully" });
    } catch (error: any) {
      console.error('deleteStudent error:', error);
      toast({
        title: "Error deleting student",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { deleteStudent };
};
