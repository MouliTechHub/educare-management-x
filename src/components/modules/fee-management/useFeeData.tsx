
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAutoFeeAssignment } from "./hooks/useAutoFeeAssignment";

export function useFeeData() {
  const [fees, setFees] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { assignFeesToStudents } = useAutoFeeAssignment();

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (currentAcademicYear) {
      fetchFeesWithAutoAssignment();
    }
  }, [currentAcademicYear]);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      setAcademicYears(data || []);
      
      // Set current academic year
      const current = data?.find(year => year.is_current);
      if (current) {
        setCurrentAcademicYear(current.id);
      } else if (data && data.length > 0) {
        setCurrentAcademicYear(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching academic years:", error);
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive",
      });
    }
  };

  const fetchFeesWithAutoAssignment = async () => {
    try {
      setLoading(true);
      
      // First, automatically assign fees for students who don't have them
      console.log('🔄 Auto-assigning fees before fetching data...');
      await assignFeesToStudents(currentAcademicYear);
      
      // Then fetch the updated fee data
      await fetchFees();
    } catch (error) {
      console.error("Error in fetchFeesWithAutoAssignment:", error);
      // Still try to fetch fees even if auto-assignment fails
      await fetchFees();
    } finally {
      setLoading(false);
    }
  };

  const fetchFees = async () => {
    if (!currentAcademicYear) return;

    try {
      console.log('📊 Fetching fees for academic year:', currentAcademicYear);
      
      const { data, error } = await supabase
        .from("fees")
        .select(`
          *,
          student:students(
            id,
            first_name,
            last_name,
            admission_number,
            gender,
            status,
            class_id,
            classes(name, section)
          )
        `)
        .eq("academic_year_id", currentAcademicYear)
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log('✅ Raw fee data fetched:', data?.length || 0, 'records');

      const transformedFees = (data || []).map(fee => ({
        ...fee,
        status: fee.status as 'Pending' | 'Paid' | 'Overdue',
        actual_amount: fee.actual_amount || fee.amount,
        discount_amount: fee.discount_amount || 0,
        total_paid: fee.total_paid || 0,
        student: fee.student ? {
          ...fee.student,
          gender: fee.student.gender as 'Male' | 'Female' | 'Other',
          status: fee.student.status as 'Active' | 'Inactive' | 'Alumni'
        } : null
      }));

      console.log('✅ Transformed fees:', transformedFees.length);
      console.log('📊 Fees with student data:', transformedFees.filter(f => f.student).length);

      setFees(transformedFees);
    } catch (error: any) {
      console.error("Error fetching fees:", error);
      toast({
        title: "Error fetching fees",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const refetchFees = () => {
    fetchFeesWithAutoAssignment();
  };

  return {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    loading,
    refetchFees
  };
}
