
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

interface PaymentFormData {
  payment_date: string;
  receipt_number: string;
  amount_paid: number;
  payment_receiver: string;
  payment_method: string;
  notes: string;
}

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: Fee | null;
  onPaymentRecorded: () => void;
}

export function PaymentDialog({ open, onOpenChange, fee, onPaymentRecorded }: PaymentDialogProps) {
  const { toast } = useToast();

  const paymentForm = useForm<PaymentFormData>({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      receipt_number: "",
      amount_paid: 0,
      payment_receiver: "",
      payment_method: "Cash",
      notes: "",
    },
  });

  const onSubmitPayment = async (data: PaymentFormData) => {
    if (!fee) return;

    try {
      const amountPaid = Number(data.amount_paid);
      const currentPending = fee.amount;
      
      // Validate payment amount
      if (amountPaid <= 0) {
        toast({
          title: "Invalid amount",
          description: "Payment amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (amountPaid > currentPending) {
        toast({
          title: "Invalid amount",
          description: "Payment amount cannot be greater than pending amount",
          variant: "destructive",
        });
        return;
      }

      const newPendingAmount = currentPending - amountPaid;
      
      // Determine if fee is fully paid or partially paid
      const newStatus = newPendingAmount <= 0 ? "Paid" : "Pending";
      // Ensure amount is never negative (should be 0 or positive)
      const finalAmount = Math.max(0, newPendingAmount);

      console.log('Payment processing:', {
        currentPending,
        amountPaid,
        newPendingAmount,
        finalAmount,
        newStatus
      });

      // Update the fee record with proper validation
      const { error: feeError } = await supabase
        .from("fees")
        .update({
          status: newStatus,
          payment_date: newStatus === "Paid" ? data.payment_date : null,
          receipt_number: data.receipt_number,
          amount: finalAmount
        })
        .eq("id", fee.id);

      if (feeError) {
        console.error('Fee update error:', feeError);
        throw new Error(`Failed to update fee: ${feeError.message}`);
      }

      // Create payment history record
      const { error: historyError } = await supabase
        .from('payment_history')
        .insert({
          fee_id: fee.id,
          student_id: fee.student_id,
          amount_paid: amountPaid,
          payment_date: data.payment_date,
          receipt_number: data.receipt_number,
          payment_receiver: data.payment_receiver,
          payment_method: data.payment_method,
          notes: data.notes || null,
          fee_type: fee.fee_type
        });

      if (historyError) {
        console.error('Payment history insert error:', historyError);
        // Continue anyway as the main fee update succeeded
        toast({
          title: "Payment recorded with warning",
          description: "Payment updated but history may not be complete. Please check records.",
          variant: "destructive",
        });
      } else {
        toast({ 
          title: "Payment recorded successfully",
          description: newStatus === "Paid" ? "Fee fully paid" : `Remaining amount: ₹${finalAmount.toLocaleString()}`
        });
      }
      
      onPaymentRecorded();
      onOpenChange(false);
      paymentForm.reset();
    } catch (error: any) {
      console.error('Payment recording error:', error);
      toast({
        title: "Error recording payment",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Reset form when fee changes
  React.useEffect(() => {
    if (fee && open) {
      paymentForm.reset({
        payment_date: new Date().toISOString().split('T')[0],
        receipt_number: `RCP-${Date.now()}`,
        amount_paid: fee.amount,
        payment_receiver: "",
        payment_method: "Cash",
        notes: "",
      });
    }
  }, [fee, open, paymentForm]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription>
            Record payment for {fee?.student ? 
              `${fee.student.first_name} ${fee.student.last_name}` : 
              "student"} - {fee?.fee_type}
            <br />
            <span className="font-medium">Pending Amount: ₹{fee?.amount.toLocaleString()}</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...paymentForm}>
          <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4">
            <FormField
              control={paymentForm.control}
              name="amount_paid"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount Being Paid</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="1"
                      max={fee?.amount || 0}
                      step="0.01"
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === '' ? '' : Number(value));
                      }}
                      required 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={paymentForm.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={paymentForm.control}
              name="receipt_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt Number</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter receipt number" required />
                  </FormControl>
                  <FormMessage />
                </FormMessage>
              )}
            />
            
            <FormField
              control={paymentForm.control}
              name="payment_receiver"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Received By</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter receiver name" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={paymentForm.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full p-2 border rounded-md" required>
                      <option value="Cash">Cash</option>
                      <option value="Online">Online Transfer</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Card">Card</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={paymentForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Additional notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
