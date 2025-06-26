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
      console.log('Fetching students with parent and financial information...');
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          classes(id, name, section),
          student_parent_links(
            parents(
              id,
              first_name,
              last_name,
              relation,
              phone_number,
              email
            )
          ),
          fees(
            id,
            fee_type,
            amount,
            due_date,
            payment_date,
            receipt_number,
            status,
            created_at,
            updated_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      
      console.log('Fetched students with parents and fees:', data);
      
      // Transform the data to include parents array and financial calculations
      const typedStudents = (data || []).map(student => {
        const fees = student.fees || [];
        const totalPaid = fees
          .filter(fee => fee.status === 'Paid')
          .reduce((sum, fee) => sum + Number(fee.amount), 0);
        const totalPending = fees
          .filter(fee => fee.status === 'Pending' || fee.status === 'Overdue')
          .reduce((sum, fee) => sum + Number(fee.amount), 0);

        return {
          ...student,
          gender: student.gender as 'Male' | 'Female' | 'Other',
          status: student.status as 'Active' | 'Inactive' | 'Alumni',
          parents: student.student_parent_links?.map(link => ({
            ...link.parents,
            relation: link.parents.relation as 'Mother' | 'Father' | 'Guardian' | 'Other'
          })).filter(Boolean) || [],
          total_paid: totalPaid,
          total_pending: totalPending,
          fees: fees.map(fee => ({
            ...fee,
            student_id: student.id,
            status: fee.status as 'Pending' | 'Paid' | 'Overdue'
          }))
        };
      });
      
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
