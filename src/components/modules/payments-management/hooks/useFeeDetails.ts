
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeeStructure } from "@/types/database";

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

      console.log('🔍 Fetching fee details for:', {
        studentId,
        feeType: selectedStructure.fee_type,
        academicYear: currentYear.id
      });

      // First, check the main fees table (Fee Management system)
      const { data: mainFeeRecord, error: mainFeeError } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_year_id", currentYear.id)
        .eq("fee_type", selectedStructure.fee_type)
        .maybeSingle();

      if (mainFeeError && mainFeeError.code !== 'PGRST116') {
        console.error("Error fetching main fee record:", mainFeeError);
      }

      // Also check enhanced fee system for consistency
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

      console.log('📊 Fee records found:', {
        mainFeeRecord: !!mainFeeRecord,
        enhancedFeeRecord: !!enhancedFeeRecord,
        mainDiscount: mainFeeRecord?.discount_amount,
        enhancedDiscount: enhancedFeeRecord?.discount_amount
      });

      // Use the record with the most recent discount information
      let feeRecord = mainFeeRecord;
      
      // If enhanced record has more recent discount data, use it
      if (enhancedFeeRecord && 
          (!mainFeeRecord || 
           (enhancedFeeRecord.discount_updated_at > mainFeeRecord.discount_updated_at) ||
           (!mainFeeRecord.discount_updated_at && enhancedFeeRecord.discount_amount > 0))) {
        feeRecord = {
          ...mainFeeRecord,
          actual_amount: enhancedFeeRecord.actual_fee,
          discount_amount: enhancedFeeRecord.discount_amount,
          total_paid: enhancedFeeRecord.paid_amount,
          discount_notes: enhancedFeeRecord.discount_notes,
          discount_updated_by: enhancedFeeRecord.discount_updated_by,
          discount_updated_at: enhancedFeeRecord.discount_updated_at
        };
      }

      if (feeRecord) {
        // Use data from the fee management system
        const actualAmount = feeRecord.actual_amount || selectedStructure.amount;
        const discountAmount = feeRecord.discount_amount || 0;
        const finalAmount = actualAmount - discountAmount;
        const paidAmount = feeRecord.total_paid || 0;
        const balanceAmount = Math.max(0, finalAmount - paidAmount);

        console.log('✅ Final fee details:', {
          actualAmount,
          discountAmount,
          finalAmount,
          paidAmount,
          balanceAmount
        });

        setFeeDetails({
          actualAmount,
          discountAmount,
          finalAmount,
          paidAmount,
          balanceAmount
        });
      } else {
        // Fallback to fee structure amount if no fee record exists
        const actualAmount = selectedStructure.amount;
        const discountAmount = 0;
        const finalAmount = actualAmount;
        const paidAmount = 0;
        const balanceAmount = finalAmount;

        console.log('⚠️ Using fallback fee structure data:', {
          actualAmount,
          discountAmount,
          finalAmount,
          paidAmount,
          balanceAmount
        });

        setFeeDetails({
          actualAmount,
          discountAmount,
          finalAmount,
          paidAmount,
          balanceAmount
        });
      }
    } catch (error) {
      console.error("Error fetching fee details:", error);
    }
  };

  return feeDetails;
}
