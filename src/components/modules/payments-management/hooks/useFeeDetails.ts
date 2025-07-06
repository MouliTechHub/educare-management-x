
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

      // Check consolidated student_fee_records system only
      const { data: feeRecord, error: feeError } = await supabase
        .from("student_fee_records")
        .select("*")
        .eq("student_id", studentId)
        .eq("academic_year_id", currentYear.id)
        .eq("fee_type", selectedStructure.fee_type)
        .maybeSingle();

      if (feeError && feeError.code !== 'PGRST116') {
        console.error("Error fetching fee record:", feeError);
      }

      console.log('📊 Fee record found:', {
        feeRecord: !!feeRecord,
        discountAmount: feeRecord?.discount_amount
      });

      if (feeRecord) {
        // Use data from the consolidated fee management system
        const actualAmount = feeRecord.actual_fee || selectedStructure.amount;
        const discountAmount = feeRecord.discount_amount || 0;
        const finalAmount = feeRecord.final_fee || (actualAmount - discountAmount);
        const paidAmount = feeRecord.paid_amount || 0;
        const balanceAmount = feeRecord.balance_fee || Math.max(0, finalAmount - paidAmount);

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
