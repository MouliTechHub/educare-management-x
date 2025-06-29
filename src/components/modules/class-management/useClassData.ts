
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Class, Teacher, Subject, TeacherBasic } from "@/types/database";

interface ClassWithDetails extends Class {
  teacher?: TeacherBasic;
  student_count?: number;
  subjects?: Subject[];
}

export function useClassData() {
  const [classes, setClasses] = useState<ClassWithDetails[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select(`
          *,
          teachers:homeroom_teacher_id (id, first_name, last_name)
        `)
        .order("name");

      if (error) throw error;

      // Get student counts for each class
      const classesWithCounts = await Promise.all(
        (data || []).map(async (classItem) => {
          const { count } = await supabase
            .from("students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", classItem.id);

          return {
            ...classItem,
            student_count: count || 0,
            teacher: classItem.teachers ? {
              id: classItem.teachers.id,
              first_name: classItem.teachers.first_name,
              last_name: classItem.teachers.last_name
            } : undefined
          };
        })
      );

      setClasses(classesWithCounts);
    } catch (error: any) {
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      
      const typedTeachers = (data || []).map(teacher => ({
        ...teacher,
        status: teacher.status as 'Active' | 'On Leave' | 'Retired',
        aadhaar_number: teacher.aadhaar_number || null,
        pan_number: teacher.pan_number || null,
      }));
      
      setTeachers(typedTeachers);
    } catch (error: any) {
      console.error("Error fetching teachers:", error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
  }, []);

  return {
    classes,
    teachers,
    subjects,
    loading,
    fetchClasses,
    fetchTeachers,
    fetchSubjects,
  };
}
