
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
      
      // First get payment totals from both payment systems
      const [paymentHistoryData, feePaymentData] = await Promise.all([
        supabase
          .from('payment_history')
          .select('fee_id, amount_paid')
          .order('created_at', { ascending: true }),
        
        supabase
          .from('fee_payment_records')
          .select('fee_record_id, amount_paid')
          .order('created_at', { ascending: true })
      ]);

      // Calculate payment totals from payment_history
      const paymentTotalsFromHistory = paymentHistoryData.data?.reduce((acc, payment) => {
        acc[payment.fee_id] = (acc[payment.fee_id] || 0) + payment.amount_paid;
        return acc;
      }, {} as Record<string, number>) || {};

      // Calculate payment totals from fee_payment_records
      const paymentTotalsFromRecords = feePaymentData.data?.reduce((acc, payment) => {
        acc[payment.fee_record_id] = (acc[payment.fee_record_id] || 0) + payment.amount_paid;
        return acc;
      }, {} as Record<string, number>) || {};

      // Fetch fees from the enhanced fee system (student_fee_records)
      const { data: enhancedFeeData, error: enhancedError } = await supabase
        .from("student_fee_records")
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            admission_number,
            gender,
            status,
            class_id,
            classes (
              name,
              section
            )
          )
        `)
        .eq("academic_year_id", currentAcademicYear)
        .order("created_at", { ascending: false });

      if (enhancedError) {
        console.error('Error fetching enhanced fee data:', enhancedError);
      }

      // Also fetch from legacy fees table for backward compatibility
      const { data: legacyFeeData, error: legacyError } = await supabase
        .from("fees")
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            admission_number,
            gender,
            status,
            class_id,
            classes (
              name,
              section
            )
          )
        `)
        .eq("academic_year_id", currentAcademicYear)
        .order("created_at", { ascending: false });

      if (legacyError) {
        console.error('Error fetching legacy fee data:', legacyError);
      }

      console.log('✅ Enhanced fee data fetched:', enhancedFeeData?.length || 0, 'records');
      console.log('✅ Legacy fee data fetched:', legacyFeeData?.length || 0, 'records');

      // Combine and transform the data, prioritizing enhanced fee records
      let allFees = [];

      // Process enhanced fee records first
      if (enhancedFeeData && enhancedFeeData.length > 0) {
        const enhancedFees = enhancedFeeData.map((fee: any) => {
          const totalPaidFromRecords = paymentTotalsFromRecords[fee.id] || 0;
          
          return {
            id: fee.id,
            student_id: fee.student_id,
            amount: fee.actual_fee,
            actual_amount: fee.actual_fee,
            discount_amount: fee.discount_amount,
            total_paid: totalPaidFromRecords,
            fee_type: fee.fee_type,
            due_date: fee.due_date,
            payment_date: null,
            status: fee.status,
            receipt_number: null,
            created_at: fee.created_at,
            updated_at: fee.updated_at,
            discount_notes: fee.discount_notes,
            discount_updated_by: fee.discount_updated_by,
            discount_updated_at: fee.discount_updated_at,
            academic_year_id: fee.academic_year_id,
            student: fee.students ? {
              id: fee.students.id,
              first_name: fee.students.first_name,
              last_name: fee.students.last_name,
              admission_number: fee.students.admission_number,
              gender: fee.students.gender as 'Male' | 'Female' | 'Other',
              status: fee.students.status as 'Active' | 'Inactive' | 'Alumni',
              class_name: fee.students.classes?.name,
              section: fee.students.classes?.section,
              class_id: fee.students.class_id
            } : null
          };
        });

        allFees = [...enhancedFees];
      }

      // Add legacy fees if no enhanced records exist for those students
      if (legacyFeeData && legacyFeeData.length > 0) {
        const existingStudentIds = new Set(allFees.map(f => f.student_id));
        
        const legacyFees = legacyFeeData
          .filter((fee: any) => !existingStudentIds.has(fee.student_id))
          .map((fee: any) => {
            const totalPaidFromHistory = paymentTotalsFromHistory[fee.id] || 0;
            
            return {
              id: fee.id,
              student_id: fee.student_id,
              amount: fee.amount,
              actual_amount: fee.actual_amount,
              discount_amount: fee.discount_amount,
              total_paid: totalPaidFromHistory,
              fee_type: fee.fee_type,
              due_date: fee.due_date,
              payment_date: fee.payment_date,
              status: fee.status,
              receipt_number: fee.receipt_number,
              created_at: fee.created_at,
              updated_at: fee.updated_at,
              discount_notes: fee.discount_notes,
              discount_updated_by: fee.discount_updated_by,
              discount_updated_at: fee.discount_updated_at,
              academic_year_id: fee.academic_year_id,
              student: fee.students ? {
                id: fee.students.id,
                first_name: fee.students.first_name,
                last_name: fee.students.last_name,
                admission_number: fee.students.admission_number,
                gender: fee.students.gender as 'Male' | 'Female' | 'Other',
                status: fee.students.status as 'Active' | 'Inactive' | 'Alumni',
                class_name: fee.students.classes?.name,
                section: fee.students.classes?.section,
                class_id: fee.students.class_id
              } : null
            };
          });

        allFees = [...allFees, ...legacyFees];
      }

      console.log('✅ Total combined fees:', allFees.length);
      console.log('📊 Fees with student data:', allFees.filter(f => f.student).length);

      setFees(allFees);
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
