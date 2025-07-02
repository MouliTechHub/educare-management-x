import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TeacherSalary, Teacher } from "@/types/database";

export function useTeacherSalaryData() {
  const [salaries, setSalaries] = useState<TeacherSalary[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSalaries = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch salaries with teacher details
      const { data: salaryData, error: salaryError } = await supabase
        .from("teacher_salaries" as any)
        .select(`
          *,
          teachers (
            id,
            first_name,
            last_name,
            employee_id,
            salary
          ),
          academic_years (
            year_name
          )
        `)
        .order("year", { ascending: false })
        .order("month", { ascending: false });

      if (salaryError) throw salaryError;

      // Fetch all teachers for forms
      const { data: teacherData, error: teacherError } = await supabase
        .from("teachers")
        .select("*")
        .eq("status", "Active")
        .order("first_name");

      if (teacherError) throw teacherError;

      setSalaries((salaryData as any) || []);
      setTeachers((teacherData as any) || []);
    } catch (error: any) {
      toast({
        title: "Error fetching salary data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const saveSalary = useCallback(async (salaryData: any) => {
    try {
      // Calculate final salary based on attendance
      const workingDays = salaryData.working_days || 26;
      const attendanceDays = salaryData.attendance_days || workingDays;
      const baseSalary = salaryData.base_salary;
      
      const calculatedSalary = (baseSalary / workingDays) * attendanceDays;
      const finalSalary = calculatedSalary + (salaryData.bonus || 0) - (salaryData.deductions || 0);

      const processedData = {
        ...salaryData,
        calculated_salary: calculatedSalary,
        final_salary: finalSalary
      };

      if (salaryData.id) {
        // Update existing salary
        const { error } = await supabase
          .from("teacher_salaries" as any)
          .update(processedData)
          .eq("id", salaryData.id);

        if (error) throw error;
        toast({ title: "Salary updated successfully" });
      } else {
        // Create new salary record
        const { error } = await supabase
          .from("teacher_salaries" as any)
          .insert([processedData]);

        if (error) throw error;
        toast({ title: "Salary record created successfully" });
      }

      // If salary is marked as paid, create expense record
      if (processedData.status === 'Paid' && processedData.payment_date) {
        const teacher = teachers.find(t => t.id === processedData.teacher_id);
        if (teacher) {
          const expenseData = {
            date: processedData.payment_date,
            category: 'Salaries',
            description: `Salary payment for ${teacher.first_name} ${teacher.last_name} - ${processedData.month}/${processedData.year}`,
            amount: finalSalary,
            paid_to: `${teacher.first_name} ${teacher.last_name}`,
            payment_mode: processedData.payment_mode || 'Bank Transfer',
            academic_year_id: processedData.academic_year_id,
            month: processedData.month,
            notes: `Salary payment for ${teacher.employee_id || 'N/A'}`
          };

          await supabase
            .from("expenses" as any)
            .insert([expenseData]);
        }
      }

      fetchSalaries();
    } catch (error: any) {
      toast({
        title: "Error saving salary",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  }, [fetchSalaries, toast, teachers]);

  const deleteSalary = useCallback(async (id: string) => {
    if (!confirm("Are you sure you want to delete this salary record?")) return;

    try {
      const { error } = await supabase
        .from("teacher_salaries" as any)
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Salary record deleted successfully" });
      fetchSalaries();
    } catch (error: any) {
      toast({
        title: "Error deleting salary record",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [fetchSalaries, toast]);

  const bulkProcessSalaries = useCallback(async (selectedTeachers: string[], month: number, year: number, academicYearId: string) => {
    try {
      const salaryRecords = selectedTeachers.map(teacherId => {
        const teacher = teachers.find(t => t.id === teacherId);
        if (!teacher) return null;

        const workingDays = 26;
        const attendanceDays = workingDays; // Default to full attendance
        const baseSalary = teacher.salary || 0;
        const calculatedSalary = (baseSalary / workingDays) * attendanceDays;

        return {
          teacher_id: teacherId,
          month,
          year,
          academic_year_id: academicYearId,
          base_salary: baseSalary,
          attendance_days: attendanceDays,
          working_days: workingDays,
          calculated_salary: calculatedSalary,
          bonus: 0,
          deductions: 0,
          final_salary: calculatedSalary,
          status: 'Pending'
        };
      }).filter(Boolean);

      const { error } = await supabase
        .from("teacher_salaries" as any)
        .insert(salaryRecords);

      if (error) throw error;
      
      toast({ 
        title: "Bulk salary processing completed",
        description: `Created ${salaryRecords.length} salary records`
      });
      
      fetchSalaries();
    } catch (error: any) {
      toast({
        title: "Error in bulk processing",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [teachers, fetchSalaries, toast]);

  const exportSalaries = useCallback(async (salariesToExport: TeacherSalary[]) => {
    try {
      const headers = ['Teacher', 'Employee ID', 'Month/Year', 'Base Salary', 'Attendance Days', 'Working Days', 'Calculated Salary', 'Bonus', 'Deductions', 'Final Salary', 'Status', 'Payment Date'];
      const csvContent = [
        headers.join(','),
        ...salariesToExport.map(salary => {
          const teacher = teachers.find(t => t.id === salary.teacher_id);
          return [
            `"${teacher ? `${teacher.first_name} ${teacher.last_name}` : 'Unknown'}"`,
            teacher?.employee_id || 'N/A',
            `${salary.month}/${salary.year}`,
            salary.base_salary,
            salary.attendance_days,
            salary.working_days,
            salary.calculated_salary,
            salary.bonus || 0,
            salary.deductions || 0,
            salary.final_salary,
            salary.status,
            salary.payment_date || 'Not Paid'
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `teacher_salaries_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({ title: "Salaries exported successfully" });
    } catch (error: any) {
      toast({
        title: "Error exporting salaries",
        description: error.message,
        variant: "destructive",
      });
    }
  }, [teachers, toast]);

  return {
    salaries,
    teachers,
    loading,
    fetchSalaries,
    saveSalary,
    deleteSalary,
    bulkProcessSalaries,
    exportSalaries
  };
}