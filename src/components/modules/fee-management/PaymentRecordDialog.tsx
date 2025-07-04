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

interface PaymentRecordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fee: Fee | null;
  onSuccess: () => void;
}

export function PaymentRecordDialog({
  open,
  onOpenChange,
  fee,
  onSuccess
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

  if (!fee) return null;

  const balanceAmount = (fee.actual_amount - fee.discount_amount) - fee.total_paid;
  const maxPaymentAmount = Math.max(0, balanceAmount);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0",
        variant: "destructive"
      });
      return;
    }

    if (formData.amount > maxPaymentAmount) {
      toast({
        title: "Amount Exceeds Balance",
        description: `Payment amount cannot exceed balance of ₹${maxPaymentAmount.toLocaleString()}`,
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

      // Update fee total_paid amount while preserving discount
      const newTotalPaid = fee.total_paid + formData.amount;
      const newStatus = newTotalPaid >= (fee.actual_amount - fee.discount_amount) ? 'Paid' : 'Partial';

      const { error: feeUpdateError } = await supabase
        .from('fees')
        .update({
          total_paid: newTotalPaid,
          status: newStatus,
          payment_date: newStatus === 'Paid' ? new Date().toISOString().split('T')[0] : null
          // Explicitly preserving discount_amount - NOT updating it
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
                disabled={loading || formData.amount <= 0}
                className="flex-1"
              >
                {loading ? 'Recording...' : 'Record Payment'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}