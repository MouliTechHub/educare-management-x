import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CrossYearPaymentAllocation {
  payment_id: string;
  payment_amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  allocated_to_fee_id: string;
  allocated_amount: number;
  original_fee_type: string;
  original_academic_year: string;
  allocation_academic_year: string;
  student_id: string;
}

interface PaymentTrackingSummary {
  fee_record_id: string;
  original_balance: number;
  paid_directly: number;
  paid_through_previous_year_dues: number;
  remaining_balance: number;
  payment_history: CrossYearPaymentAllocation[];
}

export function useCrossYearPaymentTracking(academicYearId: string, studentId?: string) {
  const [paymentTrackings, setPaymentTrackings] = useState<Map<string, PaymentTrackingSummary>>(new Map());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchCrossYearPaymentTracking = async () => {
    if (!academicYearId) {
      console.log('⚠️ No academic year provided for cross-year payment tracking');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Fetching cross-year payment tracking for academic year:', academicYearId);

      // Get all payment allocations that involve this academic year
      let allocationsQuery = supabase
        .from('payment_allocations')
        .select(`
          id,
          allocated_amount,
          allocation_date,
          allocation_order,
          fee_record_id,
          payment_record_id,
          fee_payment_records!inner(
            id,
            amount_paid,
            payment_date,
            payment_method,
            receipt_number,
            student_id
          ),
          student_fee_records!inner(
            id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            balance_fee,
            academic_year_id,
            student_id,
            academic_years!inner(year_name)
          )
        `)
        .eq('student_fee_records.academic_year_id', academicYearId);

      if (studentId) {
        allocationsQuery = allocationsQuery.eq('fee_payment_records.student_id', studentId);
      }

      const { data: allocations, error: allocationsError } = await allocationsQuery;

      if (allocationsError) {
        console.error('❌ Error fetching payment allocations:', allocationsError);
        throw allocationsError;
      }

      console.log('✅ Payment allocations fetched:', allocations?.length || 0);

      // Also get payments made to "Previous Year Dues" that affect this academic year
      let previousYearQuery = supabase
        .from('payment_allocations')
        .select(`
          id,
          allocated_amount,
          allocation_date,
          fee_record_id,
          payment_record_id,
          fee_payment_records!inner(
            id,
            amount_paid,
            payment_date,
            payment_method,
            receipt_number,
            student_id
          ),
          student_fee_records!inner(
            id,
            fee_type,
            academic_year_id,
            carry_forward_source_id,
            academic_years!inner(year_name)
          )
        `)
        .eq('student_fee_records.fee_type', 'Previous Year Dues');

      if (studentId) {
        previousYearQuery = previousYearQuery.eq('fee_payment_records.student_id', studentId);
      }

      const { data: previousYearPayments, error: pyError } = await previousYearQuery;

      if (pyError) {
        console.warn('⚠️ Error fetching previous year dues payments:', pyError);
      }

      // Build payment tracking map
      const trackingMap = new Map<string, PaymentTrackingSummary>();

      // Process direct allocations to this academic year
      (allocations || []).forEach((allocation: any) => {
        const feeRecord = allocation.student_fee_records;
        const paymentRecord = allocation.fee_payment_records;
        
        if (!trackingMap.has(feeRecord.id)) {
          trackingMap.set(feeRecord.id, {
            fee_record_id: feeRecord.id,
            original_balance: feeRecord.actual_fee - feeRecord.discount_amount,
            paid_directly: 0,
            paid_through_previous_year_dues: 0,
            remaining_balance: feeRecord.balance_fee || 0,
            payment_history: []
          });
        }

        const tracking = trackingMap.get(feeRecord.id)!;
        tracking.paid_directly += allocation.allocated_amount;
        tracking.payment_history.push({
          payment_id: paymentRecord.id,
          payment_amount: paymentRecord.amount_paid,
          payment_date: paymentRecord.payment_date,
          payment_method: paymentRecord.payment_method,
          receipt_number: paymentRecord.receipt_number,
          allocated_to_fee_id: feeRecord.id,
          allocated_amount: allocation.allocated_amount,
          original_fee_type: feeRecord.fee_type,
          original_academic_year: feeRecord.academic_years.year_name,
          allocation_academic_year: feeRecord.academic_years.year_name,
          student_id: paymentRecord.student_id
        });
      });

      // Process payments made through "Previous Year Dues" in subsequent years
      (previousYearPayments || []).forEach((payment: any) => {
        const feeRecord = payment.student_fee_records;
        const paymentRecord = payment.fee_payment_records;
        
        // Find the original fee record that this previous year due payment affects
        if (feeRecord.carry_forward_source_id) {
          // This payment reduces previous year dues, track it for the original academic year
          console.log('📋 Found previous year dues payment:', payment.allocated_amount);
        }
      });

      console.log('✅ Cross-year payment tracking built for', trackingMap.size, 'fee records');
      setPaymentTrackings(trackingMap);

    } catch (error: any) {
      console.error('❌ Error fetching cross-year payment tracking:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment tracking information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getPaymentSummaryForFee = (feeRecordId: string): PaymentTrackingSummary | null => {
    return paymentTrackings.get(feeRecordId) || null;
  };

  const getTotalPaidAcrossYears = (feeRecordId: string): number => {
    const tracking = paymentTrackings.get(feeRecordId);
    if (!tracking) return 0;
    return tracking.paid_directly + tracking.paid_through_previous_year_dues;
  };

  useEffect(() => {
    if (academicYearId) {
      fetchCrossYearPaymentTracking();
    }
  }, [academicYearId, studentId]);

  return {
    paymentTrackings: Array.from(paymentTrackings.values()),
    getPaymentSummaryForFee,
    getTotalPaidAcrossYears,
    loading,
    refetch: fetchCrossYearPaymentTracking
  };
}