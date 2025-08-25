
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useStudentArchiver = () => {
  const { toast } = useToast();

  const archiveStudent = async (id: string, reason: string = 'user_request') => {
    if (!confirm("Are you sure you want to archive this student? This will hide them from active lists but preserve all data.")) return;

    try {
      console.log('Archiving student:', id, 'with reason:', reason);
      
      // Call the archive_student RPC function
      const { error } = await supabase.rpc('archive_student', {
        p_student: id,
        p_reason: reason,
        p_anonymize: true
      });

      if (error) {
        console.error('Error archiving student:', error);
        throw error;
      }

      toast({ 
        title: "Student archived successfully",
        description: "Student has been archived and removed from active lists. All data is preserved."
      });
    } catch (error: any) {
      console.error('archiveStudent error:', error);
      toast({
        title: "Error archiving student", 
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { archiveStudent };
};
