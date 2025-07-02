
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Fee } from "@/types/database";

interface PaymentHistory {
  id: string;
  fee_id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  payment_time?: string;
  receipt_number: string;
  payment_receiver: string;
  payment_method: string;
  notes: string | null;
  fee_type: string;
  created_at: string;
}

interface PaymentReversal {
  id: string;
  payment_history_id: string;
  reversal_type: 'reversal' | 'refund';
  reversal_amount: number;
  reversal_date: string;
  reason: string;
  notes: string | null;
  authorized_by: string;
  created_at: string;
}

export function useStudentPaymentHistory(fees: Fee[], currentAcademicYear: string) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [paymentReversals, setPaymentReversals] = useState<PaymentReversal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
  const { toast } = useToast();

  const fetchPaymentHistory = async () => {
    console.log('🔄 Fetching payment history for fees:', fees?.length || 0);
    
    if (!fees || fees.length === 0) {
      console.log('⚠️ No fees provided for payment history');
      setPaymentHistory([]);
      setPaymentReversals([]);
      setError(null);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const studentId = fees[0]?.student_id;
      if (!studentId) {
        throw new Error('No student ID found in fee records');
      }

      console.log('📊 Fetching payment history for student:', studentId);

      // Get payment history from payment_history table
      const { data: historyData, error: historyError } = await supabase
        .from('payment_history')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false })
        .order('payment_time', { ascending: false });

      if (historyError) {
        console.error('❌ Payment history fetch error:', historyError);
        throw new Error(`Failed to fetch payment history: ${historyError.message}`);
      }

      console.log('✅ Payment history data fetched:', historyData?.length || 0, 'records');

      // Get payment history from fee_payment_records table
      const { data: feePaymentData, error: feePaymentError } = await supabase
        .from('fee_payment_records')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false })
        .order('payment_time', { ascending: false });

      if (feePaymentError) {
        console.error('❌ Fee payment records fetch error:', feePaymentError);
        // Don't throw here, just log the error
      }

      console.log('✅ Fee payment records fetched:', feePaymentData?.length || 0, 'records');

      // Combine and transform payment data
      let allPayments: PaymentHistory[] = [];

      // Add payment_history records
      if (historyData && historyData.length > 0) {
        allPayments = allPayments.concat(
          historyData.map(payment => ({
            id: payment.id,
            fee_id: payment.fee_id || '',
            student_id: payment.student_id,
            amount_paid: Number(payment.amount_paid) || 0,
            payment_date: payment.payment_date,
            payment_time: payment.payment_time || undefined,
            receipt_number: payment.receipt_number || `RCP-${payment.id}`,
            payment_receiver: payment.payment_receiver || 'Unknown',
            payment_method: payment.payment_method || 'Cash',
            notes: payment.notes,
            fee_type: payment.fee_type || 'Unknown',
            created_at: payment.created_at
          }))
        );
      }

      // Add fee_payment_records
      if (feePaymentData && feePaymentData.length > 0) {
        allPayments = allPayments.concat(
          feePaymentData.map(payment => ({
            id: payment.id,
            fee_id: payment.fee_record_id || '',
            student_id: payment.student_id,
            amount_paid: Number(payment.amount_paid) || 0,
            payment_date: payment.payment_date,
            payment_time: payment.payment_time || undefined,
            receipt_number: payment.receipt_number || `RCP-${payment.id}`,
            payment_receiver: payment.payment_receiver || 'Unknown',
            payment_method: payment.payment_method || 'Cash',
            notes: payment.notes,
            fee_type: 'Fee Payment', // Default since fee_payment_records doesn't have fee_type
            created_at: payment.created_at
          }))
        );
      }

      // Filter by academic year if selected
      let filteredHistory = allPayments;
      if (currentAcademicYear && fees.length > 0) {
        // Get fee IDs for the selected academic year
        const yearFeeIds = fees
          .filter(fee => fee.academic_year_id === currentAcademicYear)
          .map(fee => fee.id);
        
        if (yearFeeIds.length > 0) {
          filteredHistory = allPayments.filter(payment => 
            yearFeeIds.includes(payment.fee_id) || payment.student_id === studentId
          );
        }
      }

      // Remove duplicates based on receipt number and amount
      const uniquePayments = filteredHistory.reduce((acc, current) => {
        const isDuplicate = acc.some(payment => 
          payment.receipt_number === current.receipt_number &&
          payment.amount_paid === current.amount_paid &&
          payment.payment_date === current.payment_date
        );
        
        if (!isDuplicate) {
          acc.push(current);
        }
        return acc;
      }, [] as PaymentHistory[]);

      // Sort by date and time
      uniquePayments.sort((a, b) => {
        const dateA = new Date(a.payment_date + ' ' + (a.payment_time || '00:00:00'));
        const dateB = new Date(b.payment_date + ' ' + (b.payment_time || '00:00:00'));
        return dateB.getTime() - dateA.getTime();
      });

      console.log('✅ Final processed payment history:', uniquePayments.length, 'records');
      setPaymentHistory(uniquePayments);

      // Fetch payment reversals
      const { data: reversalData, error: reversalError } = await supabase
        .from('payment_reversals')
        .select('*')
        .order('created_at', { ascending: false });

      if (reversalError) {
        console.error('❌ Payment reversals fetch error:', reversalError);
        // Don't throw here, just set empty array
        setPaymentReversals([]);
      } else {
        console.log('✅ Payment reversals fetched:', reversalData?.length || 0, 'records');
        setPaymentReversals((reversalData || []) as PaymentReversal[]);
      }

    } catch (error: any) {
      console.error('❌ Unexpected error fetching payment history:', error);
      const errorMessage = error.message || 'Failed to load payment history';
      setError(errorMessage);
      toast({
        title: "Error fetching payment history",
        description: errorMessage,
        variant: "destructive",
      });
      setPaymentHistory([]);
      setPaymentReversals([]);
    } finally {
      setLoading(false);
    }
  };

  const openReversalDialog = (payment: PaymentHistory) => {
    setSelectedPayment(payment);
    setReversalDialogOpen(true);
  };

  return {
    paymentHistory,
    paymentReversals,
    loading,
    error,
    reversalDialogOpen,
    setReversalDialogOpen,
    selectedPayment,
    openReversalDialog,
    fetchPaymentHistory
  };
}
