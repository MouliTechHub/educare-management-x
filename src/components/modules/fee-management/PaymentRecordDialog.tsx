import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fee } from "./types/feeTypes";
import { calculateFeeAmounts, validatePaymentAmount } from "./utils/feeCalculations";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface PaymentRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: Fee | null;
  onSuccess: () => void;
  currentAcademicYear: string;
}

export function PaymentRecordDialog({ 
  open, 
  onOpenChange, 
  fee, 
  onSuccess,
  currentAcademicYear 
}: PaymentRecordDialogProps) {
  const [formData, setFormData] = useState({
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentTime: new Date().toTimeString().slice(0, 5),
    paymentMethod: 'Cash',
    lateFee: '0',
    receiptNumber: '',
    paymentReceiver: 'Admin',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (!fee) return null;

  const handleSubmit = async () => {
    try {
      setLoading(true);

      // Validate payment amount
      const paymentAmount = parseFloat(formData.amountPaid);
      const validation = validatePaymentAmount(fee, paymentAmount);
      
      if (!validation.isValid) {
        toast({
          title: "Invalid Payment Amount",
          description: validation.message || "Invalid payment amount",
          variant: "destructive"
        });
        return;
      }

      // Create payment record
      const { error } = await supabase
        .from('fee_payment_records')
        .insert({
          fee_record_id: fee.id,
          student_id: fee.student_id,
          amount_paid: paymentAmount,
          payment_date: formData.paymentDate,
          payment_time: formData.paymentTime,
          late_fee: parseFloat(formData.lateFee) || 0,
          payment_method: formData.paymentMethod,
          receipt_number: formData.receiptNumber,
          payment_receiver: formData.paymentReceiver,
          notes: formData.notes,
          created_by: 'Admin'
        });

      if (error) throw error;

      toast({
        title: "Payment Recorded",
        description: `Payment of ₹${paymentAmount.toLocaleString()} recorded successfully.`
      });

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Payment error:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to record payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = () => {
    return formData.amountPaid && 
           formData.paymentDate && 
           formData.receiptNumber &&
           parseFloat(formData.amountPaid) > 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p><strong>Student:</strong> {fee.student?.first_name} {fee.student?.last_name}</p>
              <p><strong>Admission No:</strong> {fee.student?.admission_number}</p>
              <p><strong>Class:</strong> {fee.student?.class_name} {fee.student?.section}</p>
              <p><strong>Fee Type:</strong> {fee.fee_type}</p>
            </div>
            <div className="space-y-2">
              <p><strong>Actual Fee:</strong> ₹{fee.actual_fee.toLocaleString()}</p>
              <p><strong>Discount:</strong> ₹{fee.discount_amount.toLocaleString()}</p>
              <p><strong>Final Fee:</strong> ₹{fee.final_fee.toLocaleString()}</p>
              <p><strong>Paid Amount:</strong> ₹{fee.paid_amount.toLocaleString()}</p>
              <p><strong>Balance:</strong> <span className={fee.balance_fee > 0 ? 'text-red-600' : 'text-green-600'}>₹{fee.balance_fee.toLocaleString()}</span></p>
            </div>
          </div>

          {/* Payment form fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amountPaid">Amount Paid *</Label>
              <Input
                id="amountPaid"
                type="number"
                value={formData.amountPaid}
                onChange={(e) => setFormData({...formData, amountPaid: e.target.value})}
                placeholder="Enter amount"
                max={fee.balance_fee}
              />
            </div>
            <div>
              <Label htmlFor="paymentMethod">Payment Method</Label>
              <Select value={formData.paymentMethod} onValueChange={(value) => setFormData({...formData, paymentMethod: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receiptNumber">Receipt Number *</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => setFormData({...formData, receiptNumber: e.target.value})}
                placeholder="Enter receipt number"
              />
            </div>
            <div>
              <Label htmlFor="paymentReceiver">Payment Receiver</Label>
              <Input
                id="paymentReceiver"
                value={formData.paymentReceiver}
                onChange={(e) => setFormData({...formData, paymentReceiver: e.target.value})}
                placeholder="Admin"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Add any additional notes..."
              rows={2}
            />
          </div>

          <Button 
            onClick={handleSubmit} 
            disabled={loading || !isFormValid()}
            className="w-full"
          >
            {loading ? "Recording Payment..." : "Record Payment"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}