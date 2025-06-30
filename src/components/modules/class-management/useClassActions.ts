
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithStats } from "@/types/database";

export function useClassActions(refetchClasses: () => void) {
  const { toast } = useToast();

  const saveClass = async (data: any, selectedClass: ClassWithStats | null) => {
    try {
      if (selectedClass) {
        const { error } = await supabase
          .from("classes")
          .update({
            name: data.name,
            section: data.section || null,
            homeroom_teacher_id: data.homeroom_teacher_id || null,
          })
          .eq("id", selectedClass.id);

        if (error) throw error;
        toast({ title: "Class updated successfully" });
      } else {
        const { error } = await supabase
          .from("classes")
          .insert([{
            name: data.name,
            section: data.section || null,
            homeroom_teacher_id: data.homeroom_teacher_id || null,
          }]);

        if (error) throw error;
        toast({ title: "Class created successfully" });
      }

      refetchClasses();
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
      refetchClasses();
    } catch (error: any) {
      toast({
        title: "Error deleting class",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return {
    saveClass,
    deleteClass,
  };
}
