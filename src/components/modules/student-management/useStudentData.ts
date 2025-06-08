
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Student, Class } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export function useStudentData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Test database connectivity
  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase.from('students').select('count').limit(1);
      if (error) {
        console.error('Database connection test failed:', error);
        toast({
          title: "Database Connection Error",
          description: "Unable to connect to the database. Please check your connection.",
          variant: "destructive",
        });
      } else {
        console.log('Database connection successful');
      }
    } catch (error) {
      console.error('Database connection test error:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      console.log('Fetching students...');
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          classes(id, name, section)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      
      console.log('Fetched students:', data);
      
      // Type cast the gender and status fields
      const typedStudents = (data || []).map(student => ({
        ...student,
        gender: student.gender as 'Male' | 'Female' | 'Other',
        status: student.status as 'Active' | 'Inactive' | 'Alumni'
      }));
      
      setStudents(typedStudents);
    } catch (error: any) {
      console.error('fetchStudents error:', error);
      toast({
        title: "Error fetching students",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      console.log('Fetching classes...');
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) {
        console.error('Error fetching classes:', error);
        throw error;
      }
      
      console.log('Fetched classes:', data);
      setClasses(data || []);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const deleteStudent = async (id: string) => {
    if (!confirm("Are you sure you want to delete this student?")) return;

    try {
      console.log('Deleting student:', id);
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", id);

      if (error) {
        console.error('Delete error:', error);
        throw error;
      }
      toast({ title: "Student deleted successfully" });
      fetchStudents();
    } catch (error: any) {
      console.error('deleteStudent error:', error);
      toast({
        title: "Error deleting student",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    testDatabaseConnection();
  }, []);

  return {
    students,
    classes,
    loading,
    fetchStudents,
    deleteStudent,
  };
}
