
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
      
      // Fetch payment totals from all payment systems filtered by academic year
      const [paymentHistoryResult, feePaymentResult, studentPaymentResult] = await Promise.allSettled([
        supabase
          .from('payment_history')
          .select(`
            fee_id, 
            amount_paid,
            fees!inner(academic_year_id)
          `)
          .eq('fees.academic_year_id', currentAcademicYear)
          .order('created_at', { ascending: true }),
        
        supabase
          .from('fee_payment_records')
          .select(`
            fee_record_id, 
            amount_paid,
            student_fee_records!inner(academic_year_id)
          `)
          .eq('student_fee_records.academic_year_id', currentAcademicYear)
          .order('created_at', { ascending: true }),

        supabase
          .from('student_payments')
          .select(`
            *,
            fee_structures!inner(academic_year_id)
          `)
          .eq('fee_structures.academic_year_id', currentAcademicYear)
          .order('created_at', { ascending: true })
      ]);

      // Calculate payment totals from payment_history
      const paymentTotalsFromHistory = paymentHistoryResult.status === 'fulfilled' && paymentHistoryResult.value.data
        ? paymentHistoryResult.value.data.reduce((acc, payment) => {
            acc[payment.fee_id] = (acc[payment.fee_id] || 0) + payment.amount_paid;
            return acc;
          }, {} as Record<string, number>)
        : {};

      // Calculate payment totals from fee_payment_records
      const paymentTotalsFromRecords = feePaymentResult.status === 'fulfilled' && feePaymentResult.value.data
        ? feePaymentResult.value.data.reduce((acc, payment) => {
            acc[payment.fee_record_id] = (acc[payment.fee_record_id] || 0) + payment.amount_paid;
            return acc;
          }, {} as Record<string, number>)
        : {};

      // Group student payments by student_id and fee_structure
      const studentPaymentTotals = studentPaymentResult.status === 'fulfilled' && studentPaymentResult.value.data
        ? studentPaymentResult.value.data.reduce((acc, payment) => {
            const key = `${payment.student_id}_${payment.fee_structure_id}`;
            acc[key] = (acc[key] || 0) + payment.amount_paid;
            return acc;
          }, {} as Record<string, number>)
        : {};

      // Fetch enhanced fee records first (these are the primary source of truth)
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

      console.log('✅ Enhanced fee data fetched:', enhancedFeeData?.length || 0, 'records');

      // Create a map to track unique student-fee combinations
      const uniqueFeeMap = new Map();
      let allFees = [];

      // Process enhanced fee records first (priority system)
      if (enhancedFeeData && enhancedFeeData.length > 0) {
        enhancedFeeData.forEach((fee: any) => {
          const uniqueKey = `${fee.student_id}_${fee.fee_type}_${fee.academic_year_id}`;
          
          // Only add if we haven't seen this student-fee-academic year combination
          if (!uniqueFeeMap.has(uniqueKey)) {
            const totalPaidFromRecords = paymentTotalsFromRecords[fee.id] || 0;
            const totalPaidFromHistory = paymentTotalsFromHistory[fee.id] || 0;
            const totalPaid = Math.max(totalPaidFromRecords, totalPaidFromHistory, fee.paid_amount || 0);
            
            const transformedFee = {
              id: fee.id,
              student_id: fee.student_id,
              amount: fee.actual_fee,
              actual_amount: fee.actual_fee,
              discount_amount: fee.discount_amount,
              total_paid: totalPaid,
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

            uniqueFeeMap.set(uniqueKey, transformedFee);
            allFees.push(transformedFee);
          }
        });
      }

      // Also fetch legacy fees to ensure we show all fee records
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
      } else {
      console.log('✅ Legacy fee data fetched:', legacyFeeData?.length || 0, 'records');
      if (legacyFeeData) {
        console.log('🔍 Legacy fee types found:', [...new Set(legacyFeeData.map(f => f.fee_type))]);
      }
        
        // Add legacy fees only if they don't already exist in enhanced system
        legacyFeeData?.forEach((fee: any) => {
          const uniqueKey = `${fee.student_id}_${fee.fee_type}`;
          
          if (!uniqueFeeMap.has(uniqueKey)) {
            const totalPaidFromHistory = paymentTotalsFromHistory[fee.id] || 0;
            
            const transformedFee = {
              id: fee.id,
              student_id: fee.student_id,
              amount: fee.amount,
              actual_amount: fee.actual_amount,
              discount_amount: fee.discount_amount,
              total_paid: Math.max(totalPaidFromHistory, fee.total_paid || 0),
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

            uniqueFeeMap.set(uniqueKey, transformedFee);
            allFees.push(transformedFee);
          }
        });
      }

      // Update fees with student payment totals from student_payments table
      allFees = allFees.map(fee => {
        // Try to find matching student payment based on student_id and fee type
        const studentPaymentKey = Object.keys(studentPaymentTotals).find(key => {
          const [studentId] = key.split('_');
          return studentId === fee.student_id;
        });
        
        if (studentPaymentKey) {
          const additionalPayments = studentPaymentTotals[studentPaymentKey] || 0;
          return {
            ...fee,
            total_paid: Math.max(fee.total_paid, additionalPayments)
          };
        }
        
        return fee;
      });

      console.log('✅ Final processed fees:', allFees.length);
      console.log('📊 Fees with student data:', allFees.filter(f => f.student).length);
      console.log('🔍 Unique fee combinations:', uniqueFeeMap.size);

      setFees(allFees);
    } catch (error: any) {
      console.error("❌ Error fetching fees:", error);
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
