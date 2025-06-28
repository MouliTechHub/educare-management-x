import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar, AlertCircle } from "lucide-react";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
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
  academic_year_id: string;
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
  academicYearName?: string;
}

export function PaymentDialog({ 
  open, 
  onOpenChange, 
  fee, 
  onPaymentRecorded,
  academicYearName 
}: PaymentDialogProps) {
  const { toast } = useToast();
  const [showConfirmation, setShowConfirmation] = React.useState(false);

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

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      const amountPaid = Number(data.amount_paid);
      const finalFee = fee.actual_amount - fee.discount_amount;
      const currentBalance = finalFee - fee.total_paid;
      
      // Validate payment amount
      if (amountPaid <= 0) {
        toast({
          title: "Invalid amount",
          description: "Payment amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (amountPaid > currentBalance) {
        toast({
          title: "Invalid amount",
          description: `Payment amount cannot be greater than balance amount (₹${currentBalance.toLocaleString()})`,
          variant: "destructive",
        });
        return;
      }

      const newTotalPaid = fee.total_paid + amountPaid;
      const newBalance = finalFee - newTotalPaid;
      
      // Determine if fee is fully paid
      const newStatus = newBalance <= 0 ? "Paid" : "Pending";

      console.log('Payment processing:', {
        finalFee,
        currentBalance,
        amountPaid,
        newTotalPaid,
        newBalance,
        newStatus,
        academicYear: academicYearName
      });

      // Create payment history record first
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
        throw new Error(`Failed to record payment: ${historyError.message}`);
      }

      // Update the fee record status and payment info if fully paid
      const feeUpdateData: any = {
        status: newStatus
      };

      if (newStatus === "Paid") {
        feeUpdateData.payment_date = data.payment_date;
        feeUpdateData.receipt_number = data.receipt_number;
      }

      const { error: feeError } = await supabase
        .from("fees")
        .update(feeUpdateData)
        .eq("id", fee.id);

      if (feeError) {
        console.error('Fee update error:', feeError);
        throw new Error(`Failed to update fee status: ${feeError.message}`);
      }

      toast({ 
        title: "Payment recorded successfully",
        description: `Payment recorded for ${academicYearName || 'selected academic year'}. ${newStatus === "Paid" ? "Fee fully paid" : `Remaining balance: ₹${newBalance.toLocaleString()}`}`
      });
      
      onPaymentRecorded();
      onOpenChange(false);
      paymentForm.reset();
      setShowConfirmation(false);
    } catch (error: any) {
      console.error('Payment recording error:', error);
      toast({
        title: "Error recording payment",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
      setShowConfirmation(false);
    }
  };

  // Reset form when fee changes
  React.useEffect(() => {
    if (fee && open) {
      const finalFee = fee.actual_amount - fee.discount_amount;
      const balanceAmount = finalFee - fee.total_paid;
      
      paymentForm.reset({
        payment_date: new Date().toISOString().split('T')[0],
        receipt_number: `RCP-${Date.now()}`,
        amount_paid: balanceAmount,
        payment_receiver: "",
        payment_method: "Cash",
        notes: "",
      });
      setShowConfirmation(false);
    }
  }, [fee, open, paymentForm]);

  if (!fee) return null;

  const finalFee = fee.actual_amount - fee.discount_amount;
  const balanceAmount = finalFee - fee.total_paid;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Record Payment</span>
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <div>
                Record payment for {fee?.student ? 
                  `${fee.student.first_name} ${fee.student.last_name}` : 
                  "student"} - {fee?.fee_type}
              </div>
              {academicYearName && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Calendar className="w-3 h-3" />
                  <span>Academic Year: {academicYearName}</span>
                </Badge>
              )}
              <div className="text-sm space-y-1">
                <span className="font-medium">Actual Fee: ₹{fee.actual_amount.toLocaleString()}</span>
                <br />
                <span className="font-medium">Final Fee: ₹{finalFee.toLocaleString()}</span>
                <br />
                <span className="font-medium">Paid: ₹{fee.total_paid.toLocaleString()}</span>
                <br />
                <span className="font-medium text-red-600">Balance: ₹{balanceAmount.toLocaleString()}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {showConfirmation ? (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="space-y-2">
                  <h4 className="font-medium text-amber-800">Confirm Payment Details</h4>
                  <div className="text-sm text-amber-700 space-y-1">
                    <p><strong>Student:</strong> {fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "Unknown"}</p>
                    <p><strong>Fee Type:</strong> {fee.fee_type}</p>
                    <p><strong>Academic Year:</strong> {academicYearName || "Not specified"}</p>
                    <p><strong>Amount:</strong> ₹{paymentForm.getValues('amount_paid').toLocaleString()}</p>
                    <p><strong>Receipt:</strong> {paymentForm.getValues('receipt_number')}</p>
                    <p><strong>Date:</strong> {new Date(paymentForm.getValues('payment_date')).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
              >
                Back to Edit
              </Button>
              <Button 
                onClick={() => onSubmitPayment(paymentForm.getValues())}
                className="bg-green-600 hover:bg-green-700"
              >
                Confirm & Record Payment
              </Button>
            </div>
          </div>
        ) : (
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
                        max={balanceAmount}
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
                <Button type="submit">Continue</Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
}
