
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ClassWithStats, TeacherBasic } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useClassDataWithStats() {
  const [classes, setClasses] = useState<ClassWithStats[]>([]);
  const [teachers, setTeachers] = useState<TeacherBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClasses = async () => {
    try {
      // Use the class_gender_stats view
      const { data: classData, error: classError } = await supabase
        .from("class_gender_stats")
        .select("*")
        .order("name");

      if (classError) throw classError;

      setClasses(classData || []);
    } catch (error: any) {
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("id, first_name, last_name")
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      setTeachers(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching teachers",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      await Promise.all([fetchClasses(), fetchTeachers()]);
      setLoading(false);
    };

    fetchData();
  }, []);

  return {
    classes,
    teachers,
    loading,
    fetchClasses,
  };
}
