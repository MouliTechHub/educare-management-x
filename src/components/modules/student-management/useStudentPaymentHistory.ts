
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
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
  const { toast } = useToast();

  const fetchPaymentHistory = async () => {
    if (!fees.length) return;
    
    setLoading(true);
    try {
      const studentId = fees[0].student_id;
      
      // Get all payment history for the student with payment_time
      const { data: historyData, error: historyError } = await supabase
        .from('payment_history')
        .select('*, payment_time')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false })
        .order('payment_time', { ascending: false });

      if (historyError) {
        console.error('Payment history fetch error:', historyError);
        setPaymentHistory([]);
      } else {
        // Filter by academic year if selected
        let filteredHistory = historyData || [];
        if (currentAcademicYear) {
          // Get fee IDs for the selected academic year
          const yearFeeIds = fees
            .filter(fee => fee.academic_year_id === currentAcademicYear)
            .map(fee => fee.id);
          
          filteredHistory = filteredHistory.filter(payment => 
            yearFeeIds.includes(payment.fee_id)
          );
        }
        
        setPaymentHistory(filteredHistory as PaymentHistory[]);
      }

      // Fetch payment reversals
      const { data: reversalData, error: reversalError } = await supabase
        .from('payment_reversals')
        .select('*')
        .order('created_at', { ascending: false });

      if (reversalError) {
        console.error('Payment reversals fetch error:', reversalError);
        setPaymentReversals([]);
      } else {
        setPaymentReversals((reversalData || []) as PaymentReversal[]);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching payment history:', error);
      toast({
        title: "Error fetching payment history",
        description: "Could not load payment history. Please try again.",
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
    reversalDialogOpen,
    setReversalDialogOpen,
    selectedPayment,
    openReversalDialog,
    fetchPaymentHistory
  };
}
