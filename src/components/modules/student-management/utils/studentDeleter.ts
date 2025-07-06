
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useStudentDeleter = () => {
  const { toast } = useToast();

  const deleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student? This will also delete all associated fees and parent links.")) return;

    try {
      console.log('Deleting student and associated records:', id);
      
      // Delete fee payment records first
      const { error: feePaymentError } = await supabase
        .from("fee_payment_records")
        .delete()
        .eq("student_id", id);

      if (feePaymentError) {
        console.error('Error deleting fee payment records:', feePaymentError);
        throw feePaymentError;
      }

      // Delete student fee records
      const { error: studentFeeError } = await supabase
        .from("student_fee_records")
        .delete()
        .eq("student_id", id);

      if (studentFeeError) {
        console.error('Error deleting student fee records:', studentFeeError);
        throw studentFeeError;
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
