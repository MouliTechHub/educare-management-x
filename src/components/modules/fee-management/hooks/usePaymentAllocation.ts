import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PaymentAllocation {
  id: string;
  payment_record_id: string;
  fee_record_id: string;
  allocated_amount: number;
  allocation_date: string;
  allocation_order: number;
  fee_record?: {
    fee_type: string;
    academic_year_id: string;
    due_date: string;
  };
  academic_year?: {
    year_name: string;
  };
}

export function usePaymentAllocation() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getPaymentAllocations = async (paymentRecordId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_allocations")
        .select(`
          *,
          fee_record:student_fee_records!fk_allocation_fee (
            fee_type,
            academic_year_id,
            due_date,
            academic_years!fk_sfr_year (
              year_name
            )
          )
        `)
        .eq("payment_record_id", paymentRecordId)
        .order("allocation_order", { ascending: true });

      if (error) throw error;

      return data as PaymentAllocation[];
    } catch (error: any) {
      console.error("Error fetching payment allocations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment allocations",
        variant: "destructive",
      });
      return [];
    }
  };

  const getAllocationsForStudent = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("payment_allocations")
        .select(`
          *,
          fee_payment_records!inner (
            student_id,
            payment_date,
            payment_method,
            receipt_number,
            amount_paid
          ),
          student_fee_records!fk_allocation_fee (
            fee_type,
            academic_year_id,
            due_date,
            academic_years!fk_sfr_year (
              year_name
            )
          )
        `)
        .eq("fee_payment_records.student_id", studentId)
        .order("allocation_date", { ascending: false });

      if (error) throw error;

      return data;
    } catch (error: any) {
      console.error("Error fetching student allocations:", error);
      toast({
        title: "Error",
        description: "Failed to fetch student payment allocations",
        variant: "destructive",
      });
      return [];
    }
  };

  const simulatePaymentAllocation = async (
    studentId: string,
    paymentAmount: number
  ) => {
    setLoading(true);
    try {
      // Get all outstanding fees for simulation
      const { data: outstandingFees, error } = await supabase
        .from("student_fee_records")
        .select(`
          id,
          fee_type,
          balance_fee,
          due_date,
          academic_year_id,
          academic_years!fk_sfr_year (
            year_name
          )
        `)
        .eq("student_id", studentId)
        .gt("balance_fee", 0)
        .neq("status", "Paid")
        .neq("payment_blocked", true)
        .order("priority_order", { ascending: true })
        .order("due_date", { ascending: true });

      if (error) throw error;

      // Simulate FIFO allocation
      let remainingAmount = paymentAmount;
      const simulatedAllocations = [];

      for (const fee of outstandingFees || []) {
        if (remainingAmount <= 0) break;

        const allocationAmount = Math.min(remainingAmount, fee.balance_fee);
        simulatedAllocations.push({
          fee_record_id: fee.id,
          fee_type: fee.fee_type,
          academic_year: fee.academic_years?.year_name,
          due_date: fee.due_date,
          balance_before: fee.balance_fee,
          allocated_amount: allocationAmount,
          balance_after: fee.balance_fee - allocationAmount,
        });

        remainingAmount -= allocationAmount;
      }

      return {
        total_allocated: paymentAmount - remainingAmount,
        remaining_amount: remainingAmount,
        allocations: simulatedAllocations,
      };
    } catch (error: any) {
      console.error("Error simulating payment allocation:", error);
      toast({
        title: "Error",
        description: "Failed to simulate payment allocation",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const processPaymentWithAllocation = async (
    studentId: string,
    paymentAmount: number,
    paymentData: {
      payment_date: string;
      payment_method: string;
      payment_receiver: string;
      notes?: string;
      late_fee?: number;
      reference_number?: string;
      target_academic_year_id?: string; // Add this parameter
    }
  ) => {
    setLoading(true);
    try {
      // Use provided target academic year or get current academic year
      let targetAcademicYearId = paymentData.target_academic_year_id;
      
      if (!targetAcademicYearId) {
        const { data: currentYear, error: yearError } = await supabase
          .from("academic_years")
          .select("id")
          .eq("is_current", true)
          .single();

        if (yearError) throw yearError;
        targetAcademicYearId = currentYear.id;
      }

      // Find the first available fee record (for the payment record reference)
      const { data: firstFee, error: feeError } = await supabase
        .from("student_fee_records")
        .select("id")
        .eq("student_id", studentId)
        .gt("balance_fee", 0)
        .order("priority_order", { ascending: true })
        .limit(1)
        .single();

      if (feeError) throw feeError;

      // Generate receipt number
      const receiptNumber = paymentData.reference_number || 
        `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Create payment record with target academic year (this will trigger the FIFO allocation automatically)
      const { data: paymentRecord, error: paymentError } = await supabase
        .from("fee_payment_records")
        .insert({
          fee_record_id: firstFee.id,
          student_id: studentId,
          amount_paid: paymentAmount,
          payment_date: paymentData.payment_date,
          payment_method: paymentData.payment_method,
          late_fee: paymentData.late_fee || 0,
          receipt_number: receiptNumber,
          payment_receiver: paymentData.payment_receiver,
          notes: paymentData.notes,
          created_by: paymentData.payment_receiver,
          target_academic_year_id: targetAcademicYearId, // This is critical for FIFO allocation
        })
        .select()
        .single();

      if (paymentError) throw paymentError;

      toast({
        title: "Payment Processed",
        description: `Payment of ₹${paymentAmount.toLocaleString()} processed with FIFO allocation`,
      });

      return {
        success: true,
        payment_record: paymentRecord,
        receipt_number: receiptNumber,
      };
    } catch (error: any) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getPaymentAllocations,
    getAllocationsForStudent,
    simulatePaymentAllocation,
    processPaymentWithAllocation,
  };
}