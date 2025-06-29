
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Class } from "@/types/database";

interface ClassFormData {
  name: string;
  section?: string;
  homeroom_teacher_id?: string;
}

export function useClassActions(fetchClasses: () => Promise<void>) {
  const { toast } = useToast();

  const saveClass = async (data: ClassFormData, selectedClass: Class | null) => {
    try {
      const classData = {
        ...data,
        homeroom_teacher_id: data.homeroom_teacher_id || null,
      };

      if (selectedClass) {
        const { error } = await supabase
          .from("classes")
          .update(classData)
          .eq("id", selectedClass.id);

        if (error) throw error;
        toast({ title: "Class updated successfully" });
      } else {
        const { error } = await supabase
          .from("classes")
          .insert([classData]);

        if (error) throw error;
        toast({ title: "Class created successfully" });
      }

      fetchClasses();
    } catch (error: any) {
      toast({
        title: "Error saving class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteClass = async (id: string) => {
    if (!confirm("Are you sure you want to delete this class?")) return;

    try {
      const { error } = await supabase
        .from("classes")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Class deleted successfully" });
      fetchClasses();
    } catch (error: any) {
      toast({
        title: "Error deleting class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteTeacher = async (teacherId: string) => {
    if (!confirm("Are you sure you want to delete this teacher? They will be removed from any classes where they are assigned as homeroom teacher.")) return;

    try {
      // First, remove the teacher from any classes where they are homeroom teacher
      const { error: updateError } = await supabase
        .from("classes")
        .update({ homeroom_teacher_id: null })
        .eq("homeroom_teacher_id", teacherId);

      if (updateError) throw updateError;

      // Then delete the teacher
      const { error: deleteError } = await supabase
        .from("teachers")
        .delete()
        .eq("id", teacherId);

      if (deleteError) throw deleteError;
      
      toast({ title: "Teacher deleted successfully" });
      fetchClasses(); // Refresh classes to show updated homeroom teacher assignments
    } catch (error: any) {
      toast({
        title: "Error deleting teacher",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    saveClass,
    deleteClass,
    deleteTeacher,
  };
}
