import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Fee } from "./types/feeTypes";
import { usePreviousYearDues } from "./hooks/usePreviousYearDues";
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
    amount: 0,
    paymentMethod: 'Cash',
    receiptNumber: '',
    paymentReceiver: 'Admin',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getStudentDues, hasOutstandingDues, logPaymentBlockage } = usePreviousYearDues(currentAcademicYear);

  if (!fee) return null;

  const studentDues = getStudentDues(fee.student_id);
  const isPaymentBlocked = hasOutstandingDues(fee.student_id);

  // Use the centralized calculation function for consistency
  const feeCalculation = calculateFeeAmounts(fee);
  const maxPaymentAmount = feeCalculation.balanceAmount;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if payment is blocked for current year fees
    if (isPaymentBlocked) {
      await logPaymentBlockage(
        fee.student_id, 
        formData.amount, 
        `Attempted to pay current year fee while having ₹${studentDues?.totalDues} in previous year dues`
      );
      
      toast({
        title: "Payment Blocked",
        description: "You must clear all outstanding dues from previous academic years before paying for the current year.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate payment amount using centralized validation
    const validation = validatePaymentAmount(formData.amount, maxPaymentAmount);
    if (!validation.isValid) {
      toast({
        title: "Invalid Payment Amount",
        description: validation.error,
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      // Record payment in payment_history table
      const { error: paymentError } = await supabase
        .from('payment_history')
        .insert({
          fee_id: fee.id,
          student_id: fee.student_id,
          amount_paid: formData.amount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: formData.paymentMethod,
          receipt_number: formData.receiptNumber || `RCP-${Date.now()}`,
          payment_receiver: formData.paymentReceiver,
          notes: formData.notes,
          fee_type: fee.fee_type
        });

      if (paymentError) throw paymentError;

      // Update fee total_paid amount and recalculate status
      const newTotalPaid = fee.total_paid + formData.amount;
      const updatedFee = { ...fee, total_paid: newTotalPaid };
      const newCalculation = calculateFeeAmounts(updatedFee);
      const newStatus = newCalculation.status;

      const { error: feeUpdateError } = await supabase
        .from('fees')
        .update({
          total_paid: newTotalPaid,
          status: newStatus,
          payment_date: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : null,
          // Explicitly preserve the existing discount_amount
          discount_amount: fee.discount_amount
        })
        .eq('id', fee.id);

      if (feeUpdateError) throw feeUpdateError;

      toast({
        title: "Payment Recorded",
        description: `Successfully recorded payment of ₹${formData.amount.toLocaleString()}`,
      });

      onSuccess();
      onOpenChange(false);
      setFormData({
        amount: 0,
        paymentMethod: 'Cash',
        receiptNumber: '',
        paymentReceiver: 'Admin',
        notes: ''
      });
    } catch (error: any) {
      console.error('Payment recording error:', error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to record payment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded">
            <h4 className="font-medium">{fee.student?.first_name} {fee.student?.last_name}</h4>
            <p className="text-sm text-gray-600">{fee.fee_type}</p>
            <p className="text-sm">
              <span className="text-gray-600">Balance: </span>
              <span className="font-medium text-red-600">₹{maxPaymentAmount.toLocaleString()}</span>
            </p>
          </div>

          {/* Payment Blocking Warning */}
          {isPaymentBlocked && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Payment Blocked!</strong>
                <br />
                This student has ₹{studentDues?.totalDues.toLocaleString()} in outstanding dues from previous academic years.
                <br />
                <span className="text-sm">You must clear all previous year dues before paying current year fees.</span>
                {studentDues && (
                  <div className="mt-2 text-xs">
                    <strong>Outstanding dues:</strong>
                    <ul className="list-disc list-inside">
                      {studentDues.duesDetails.map((due, index) => (
                        <li key={index}>
                          {due.academicYear} - {due.feeType}: ₹{due.balanceAmount.toLocaleString()}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="amount">Payment Amount *</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                max={maxPaymentAmount}
                step="0.01"
                value={formData.amount || ''}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  amount: parseFloat(e.target.value) || 0
                }))}
                placeholder="Enter payment amount"
                required
              />
            </div>

            <div>
              <Label htmlFor="paymentMethod">Payment Method *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => setFormData(prev => ({ ...prev, paymentMethod: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="PhonePe">PhonePe</SelectItem>
                  <SelectItem value="GPay">GPay</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Online">Online Transfer</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="receiptNumber">Receipt Number</Label>
              <Input
                id="receiptNumber"
                value={formData.receiptNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, receiptNumber: e.target.value }))}
                placeholder="Auto-generated if empty"
              />
            </div>

            <div>
              <Label htmlFor="paymentReceiver">Payment Received By *</Label>
              <Input
                id="paymentReceiver"
                value={formData.paymentReceiver}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentReceiver: e.target.value }))}
                placeholder="Staff name"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes"
                rows={2}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || formData.amount <= 0 || isPaymentBlocked}
                className="flex-1"
              >
                {loading ? 'Recording...' : isPaymentBlocked ? 'Payment Blocked' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}