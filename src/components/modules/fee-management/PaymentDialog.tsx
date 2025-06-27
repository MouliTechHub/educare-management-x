
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
      const newPendingAmount = currentPending - amountPaid;
      
      // Determine if fee is fully paid or partially paid
      const newStatus = newPendingAmount <= 0 ? "Paid" : "Pending";
      const finalAmount = newPendingAmount <= 0 ? 0 : newPendingAmount;

      // Update the fee record
      const { error: feeError } = await supabase
        .from("fees")
        .update({
          status: newStatus,
          payment_date: newStatus === "Paid" ? data.payment_date : null,
          receipt_number: data.receipt_number,
          amount: finalAmount
        })
        .eq("id", fee.id);

      if (feeError) throw feeError;

      // Create payment history record
      const { error: historyError } = await supabase
        .from("payment_history")
        .insert({
          fee_id: fee.id,
          student_id: fee.student_id,
          amount_paid: amountPaid,
          payment_date: data.payment_date,
          receipt_number: data.receipt_number,
          payment_receiver: data.payment_receiver,
          payment_method: data.payment_method,
          notes: data.notes,
          fee_type: fee.fee_type
        });

      if (historyError) throw historyError;

      toast({ 
        title: "Payment recorded successfully",
        description: newStatus === "Paid" ? "Fee fully paid" : `Remaining amount: ₹${finalAmount.toLocaleString()}`
      });
      
      onPaymentRecorded();
      onOpenChange(false);
      paymentForm.reset();
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
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
                      onChange={(e) => field.onChange(Number(e.target.value))}
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
                </FormItem>
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
