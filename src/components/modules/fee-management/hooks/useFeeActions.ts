
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FeePaymentRecord, FeeChangeHistory } from "@/types/enhanced-fee-types";

export function useFeeActions() {
  const { toast } = useToast();

  const updateDiscount = async (recordId: string, discountData: {
    discount_amount: number;
    discount_percentage?: number;
    discount_notes?: string;
    discount_updated_by: string;
  }) => {
    try {
      const { error } = await supabase
        .from("student_fee_records")
        .update({
          ...discountData,
          discount_updated_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("id", recordId);

      if (error) throw error;

      // Log the discount change
      await supabase.from("fee_change_history").insert({
        fee_record_id: recordId,
        change_type: 'discount',
        amount: discountData.discount_amount,
        changed_by: discountData.discount_updated_by,
        notes: discountData.discount_notes || 'Discount applied'
      });

      toast({
        title: "Discount updated successfully",
        description: "Fee record has been updated with the new discount."
      });

    } catch (error: any) {
      toast({
        title: "Error updating discount",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const recordPayment = async (paymentData: Omit<FeePaymentRecord, 'id' | 'created_at'>) => {
    try {
      const { error } = await supabase
        .from("fee_payment_records")
        .insert([paymentData]);

      if (error) throw error;

      toast({
        title: "Payment recorded successfully",
        description: "The payment has been added and fee status updated."
      });

    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const getChangeHistory = async (feeRecordId: string): Promise<FeeChangeHistory[]> => {
    try {
      const { data, error } = await supabase
        .from("fee_change_history")
        .select("*")
        .eq("fee_record_id", feeRecordId)
        .order("change_date", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        change_type: item.change_type as 'payment' | 'discount' | 'creation' | 'status_update'
      }));
    } catch (error: any) {
      console.error('Error fetching change history:', error);
      return [];
    }
  };

  const getPaymentHistory = async (feeRecordId: string): Promise<FeePaymentRecord[]> => {
    try {
      const { data, error } = await supabase
        .from("fee_payment_records")
        .select("*")
        .eq("fee_record_id", feeRecordId)
        .order("payment_date", { ascending: false });

      if (error) throw error;
      
      return (data || []).map(item => ({
        ...item,
        payment_method: item.payment_method as 'Cash' | 'Card' | 'PhonePe' | 'GPay' | 'Online' | 'Cheque' | 'Bank Transfer'
      }));
    } catch (error: any) {
      console.error('Error fetching payment history:', error);
      return [];
    }
  };

  return {
    updateDiscount,
    recordPayment,
    getChangeHistory,
    getPaymentHistory
  };
}
