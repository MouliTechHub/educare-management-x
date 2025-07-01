
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Class, Student, FeeStructure } from "@/types/database";

interface FeeDetails {
  actualAmount: number;
  discountAmount: number;
  finalAmount: number;
  paidAmount: number;
  balanceAmount: number;
}

export function useFeeDetails(
  studentId: string,
  feeStructureId: string,
  feeStructures: FeeStructure[]
) {
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);

  useEffect(() => {
    if (studentId && feeStructureId) {
      fetchFeeDetails();
    } else {
      setFeeDetails(null);
    }
  }, [studentId, feeStructureId]);

  const calculatePaidAmount = (data: any[]) => {
    if (!Array.isArray(data) || data.length === 0) return 0;
    return data.reduce((total, record) => {
      const amount = Number(record?.amount_paid) || 0;
      return total + amount;
    }, 0);
  };

  const fetchFeeDetails = async () => {
    try {
      // Get current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_current", true)
        .single();

      if (yearError || !currentYear) {
        console.error("No current academic year found");
        return;
      }

      // Get fee structure details
      const selectedStructure = feeStructures.find(fs => fs.id === feeStructureId);
      if (!selectedStructure) return;

      // First check enhanced fee system (student_fee_records)
      const { data: enhancedFeeRecord, error: enhancedError } = await supabase
        .from("student_fee_records")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_year_id", currentYear.id)
        .eq("fee_type", selectedStructure.fee_type)
        .maybeSingle();

      if (enhancedError && enhancedError.code !== 'PGRST116') {
        console.error("Error fetching enhanced fee record:", enhancedError);
      }

      // Check existing payments from all systems
      const [paymentHistoryData, feePaymentData, studentPaymentData] = await Promise.all([
        supabase
          .from('payment_history')
          .select('amount_paid')
          .eq('student_id', studentId)
          .eq('fee_type', selectedStructure.fee_type),
        
        enhancedFeeRecord ? supabase
          .from('fee_payment_records')
          .select('amount_paid')
          .eq('fee_record_id', enhancedFeeRecord.id) : Promise.resolve({ data: [] }),
        
        supabase
          .from('student_payments')
          .select('amount_paid')
          .eq('student_id', studentId)
          .eq('fee_structure_id', feeStructureId)
      ]);

      const paidFromHistory = calculatePaidAmount(paymentHistoryData.data || []);
      const paidFromRecords = calculatePaidAmount(feePaymentData.data || []);
      const paidFromPayments = calculatePaidAmount(studentPaymentData.data || []);

      if (enhancedFeeRecord) {
        // Use data from enhanced fee management system
        const actualAmount = enhancedFeeRecord.actual_fee;
        const discountAmount = enhancedFeeRecord.discount_amount;
        const finalAmount = actualAmount - discountAmount;
        const totalPaid = Math.max(paidFromHistory, paidFromRecords, paidFromPayments);
        const balanceAmount = Math.max(0, finalAmount - totalPaid);

        setFeeDetails({
          actualAmount,
          discountAmount,
          finalAmount,
          paidAmount: totalPaid,
          balanceAmount
        });
      } else {
        // Check legacy fee system
        const { data: legacyFeeRecord, error: legacyError } = await supabase
          .from("fees")
          .select("*")
          .eq("student_id", studentId)
          .eq("academic_year_id", currentYear.id)
          .eq("fee_type", selectedStructure.fee_type)
          .maybeSingle();

        if (legacyError && legacyError.code !== 'PGRST116') {
          console.error("Error fetching legacy fee record:", legacyError);
        }

        if (legacyFeeRecord) {
          // Use data from legacy fee system
          const actualAmount = legacyFeeRecord.actual_amount || selectedStructure.amount;
          const discountAmount = legacyFeeRecord.discount_amount || 0;
          const finalAmount = actualAmount - discountAmount;
          const totalPaid = Math.max(paidFromHistory, paidFromPayments, legacyFeeRecord.total_paid || 0);
          const balanceAmount = Math.max(0, finalAmount - totalPaid);

          setFeeDetails({
            actualAmount,
            discountAmount,
            finalAmount,
            paidAmount: totalPaid,
            balanceAmount
          });
        } else {
          // Fallback to fee structure amount if no fee record exists
          const actualAmount = selectedStructure.amount;
          const discountAmount = 0;
          const finalAmount = actualAmount;
          const totalPaid = Math.max(paidFromHistory, paidFromPayments);
          const balanceAmount = Math.max(0, finalAmount - totalPaid);

          setFeeDetails({
            actualAmount,
            discountAmount,
            finalAmount,
            paidAmount: totalPaid,
            balanceAmount
          });
        }
      }
    } catch (error) {
      console.error("Error fetching fee details:", error);
    }
  };

  return feeDetails;
}
