
import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import { PaymentForm } from "./PaymentForm";
import { PaymentConfirmation } from "./PaymentConfirmation";

interface Fee {
  id: string;
  student_id: string;
  actual_fee: number;
  discount_amount: number;
  paid_amount: number;
  balance_fee?: number;
  fee_type: string;
  due_date: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial' | string;
  created_at: string;
  updated_at: string;
  discount_notes?: string | null;
  discount_updated_by?: string | null;
  discount_updated_at?: string | null;
  academic_year_id: string;
  payment_blocked?: boolean;
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
      
      // Validate payment amount
      if (amountPaid <= 0) {
        toast({
          title: "Invalid amount",
          description: "Payment amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      // Use the fee's academic year as the target for payment allocation
      // This ensures payment goes to the correct academic year
      const targetAcademicYearId = fee.academic_year_id;

      console.log('Payment processing with FIFO allocation:', {
        studentId: fee.student_id,
        amountPaid,
        targetAcademicYear: targetAcademicYearId,
        academicYear: academicYearName
      });

      // Create payment record with exact timestamp and target academic year
      const currentTime = new Date();
      const paymentTime = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS format

      const { data: paymentRecord, error: paymentError } = await supabase
        .from('fee_payment_records')
        .insert({
          fee_record_id: fee.id, // This is just for reference, FIFO will allocate properly
          student_id: fee.student_id,
          amount_paid: amountPaid,
          payment_date: data.payment_date,
          payment_time: paymentTime,
          receipt_number: data.receipt_number,
          payment_receiver: data.payment_receiver,
          payment_method: data.payment_method,
          notes: data.notes || null,
          created_by: 'Admin',
          target_academic_year_id: targetAcademicYearId // Payment targets the specific academic year
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Payment record insert error:', paymentError);
        throw new Error(`Failed to record payment: ${paymentError.message}`);
      }

      console.log('Payment record created successfully:', paymentRecord);

      toast({ 
        title: "Payment recorded successfully",
        description: `Payment of ₹${amountPaid.toLocaleString()} processed with FIFO allocation for ${academicYearName || 'current academic year'}`
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
      const finalFee = fee.actual_fee - fee.discount_amount;
      const balanceAmount = finalFee - fee.paid_amount;
      
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

  const finalFee = fee.actual_fee - fee.discount_amount;
  const balanceAmount = finalFee - fee.paid_amount;

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
                <span className="font-medium">Actual Fee: ₹{fee.actual_fee.toLocaleString()}</span>
                <br />
                {fee.discount_amount > 0 && (
                  <>
                    <span className="font-medium text-green-600">Discount: ₹{fee.discount_amount.toLocaleString()}</span>
                    <br />
                  </>
                )}
                <span className="font-medium">Final Fee: ₹{finalFee.toLocaleString()}</span>
                <br />
                <span className="font-medium">Paid: ₹{fee.paid_amount.toLocaleString()}</span>
                <br />
                <span className="font-medium text-red-600">Balance: ₹{balanceAmount.toLocaleString()}</span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        
        {showConfirmation ? (
          <PaymentConfirmation
            studentName={fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "Unknown"}
            feeType={fee.fee_type}
            academicYear={academicYearName || "Not specified"}
            amount={paymentForm.getValues('amount_paid')}
            receiptNumber={paymentForm.getValues('receipt_number')}
            paymentDate={paymentForm.getValues('payment_date')}
            onBack={() => setShowConfirmation(false)}
            onConfirm={() => onSubmitPayment(paymentForm.getValues())}
          />
        ) : (
          <PaymentForm
            form={paymentForm}
            balanceAmount={balanceAmount}
            onSubmit={onSubmitPayment}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
