
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AlertTriangle } from "lucide-react";

interface PaymentHistory {
  id: string;
  fee_id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  receipt_number: string;
  payment_receiver: string;
  payment_method: string;
  notes: string | null;
  fee_type: string;
  created_at: string;
}

interface PaymentReversalData {
  reversal_type: 'reversal' | 'refund';
  reversal_amount: number;
  reason: string;
  notes: string;
  authorized_by: string;
}

interface PaymentReversalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: PaymentHistory | null;
  onReversalRecorded: () => void;
}

export function PaymentReversalDialog({ 
  open, 
  onOpenChange, 
  payment, 
  onReversalRecorded 
}: PaymentReversalDialogProps) {
  const { toast } = useToast();

  const reversalForm = useForm<PaymentReversalData>({
    defaultValues: {
      reversal_type: 'reversal',
      reversal_amount: 0,
      reason: "",
      notes: "",
      authorized_by: "",
    },
  });

  const onSubmitReversal = async (data: PaymentReversalData) => {
    if (!payment) return;

    try {
      if (data.reversal_amount <= 0 || data.reversal_amount > payment.amount_paid) {
        toast({
          title: "Invalid amount",
          description: `Reversal amount must be between ₹1 and ₹${payment.amount_paid.toLocaleString()}`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('payment_reversals')
        .insert({
          payment_history_id: payment.id,
          reversal_type: data.reversal_type,
          reversal_amount: data.reversal_amount,
          reason: data.reason,
          notes: data.notes || null,
          authorized_by: data.authorized_by,
        });

      if (error) {
        console.error('Payment reversal error:', error);
        throw new Error(`Failed to record reversal: ${error.message}`);
      }

      toast({ 
        title: "Payment reversal recorded successfully",
        description: `${data.reversal_type === 'reversal' ? 'Reversal' : 'Refund'} of ₹${data.reversal_amount.toLocaleString()} has been recorded`
      });
      
      onReversalRecorded();
      onOpenChange(false);
      reversalForm.reset();
    } catch (error: any) {
      console.error('Payment reversal error:', error);
      toast({
        title: "Error recording reversal",
        description: error.message || "Failed to record payment reversal. Please try again.",
        variant: "destructive",
      });
    }
  };

  React.useEffect(() => {
    if (payment && open) {
      reversalForm.reset({
        reversal_type: 'reversal',
        reversal_amount: payment.amount_paid,
        reason: "",
        notes: "",
        authorized_by: "",
      });
    }
  }, [payment, open, reversalForm]);

  if (!payment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Payment Reversal/Refund</span>
          </DialogTitle>
          <DialogDescription>
            Original Payment: ₹{payment.amount_paid.toLocaleString()}
            <br />
            Date: {new Date(payment.payment_date).toLocaleDateString()}
            <br />
            Receipt: {payment.receipt_number}
            <br />
            <span className="text-red-600 font-medium">This action creates an audit record and cannot be undone.</span>
          </DialogDescription>
        </DialogHeader>
        <Form {...reversalForm}>
          <form onSubmit={reversalForm.handleSubmit(onSubmitReversal)} className="space-y-4">
            <FormField
              control={reversalForm.control}
              name="reversal_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <select {...field} className="w-full p-2 border rounded-md" required>
                      <option value="reversal">Payment Reversal</option>
                      <option value="refund">Refund</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={reversalForm.control}
              name="reversal_amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reversal Amount</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      min="1"
                      max={payment.amount_paid}
                      step="0.01"
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      required 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={reversalForm.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Enter reason for reversal/refund" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={reversalForm.control}
              name="authorized_by"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Authorized By</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Enter authorizing person's name" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={reversalForm.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Additional notes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive">
                Record {reversalForm.watch('reversal_type') === 'reversal' ? 'Reversal' : 'Refund'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
