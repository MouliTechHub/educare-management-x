
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentFeeRecord, FeePaymentRecord } from "@/types/enhanced-fee-types";

interface EnhancedPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeRecord: StudentFeeRecord | null;
  onPaymentRecord: (paymentData: Omit<FeePaymentRecord, 'id' | 'created_at'>) => Promise<void>;
  academicYearName?: string;
}

export function EnhancedPaymentDialog({ 
  open, 
  onOpenChange, 
  feeRecord, 
  onPaymentRecord, 
  academicYearName 
}: EnhancedPaymentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    amount_paid: 0,
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash' as const,
    late_fee: 0,
    receipt_number: '',
    payment_receiver: '',
    notes: ''
  });

  useEffect(() => {
    if (feeRecord && open) {
      const balanceAmount = feeRecord.balance_fee;
      setFormData({
        amount_paid: balanceAmount,
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'Cash',
        late_fee: 0,
        receipt_number: `RCP-${Date.now()}`,
        payment_receiver: 'Admin User',
        notes: ''
      });
    }
  }, [feeRecord, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeRecord) return;

    // Validation
    if (formData.amount_paid <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Payment amount must be greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (formData.amount_paid > feeRecord.balance_fee) {
      toast({
        title: "Invalid Amount",
        description: `Payment amount cannot exceed balance amount of ₹${feeRecord.balance_fee.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    const paymentDate = new Date(formData.payment_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (paymentDate < today) {
      toast({
        title: "Invalid Date",
        description: "Payment date cannot be in the past",
        variant: "destructive",
      });
      return;
    }

    if (!formData.receipt_number.trim()) {
      toast({
        title: "Missing Receipt Number",
        description: "Receipt number is required",
        variant: "destructive",
      });
      return;
    }

    if (!formData.payment_receiver.trim()) {
      toast({
        title: "Missing Payment Receiver",
        description: "Payment receiver name is required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onPaymentRecord({
        fee_record_id: feeRecord.id,
        student_id: feeRecord.student_id,
        amount_paid: formData.amount_paid,
        payment_date: formData.payment_date,
        payment_time: new Date().toTimeString().split(' ')[0],
        payment_method: formData.payment_method,
        late_fee: formData.late_fee,
        receipt_number: formData.receipt_number,
        payment_receiver: formData.payment_receiver,
        notes: formData.notes || null,
        created_by: 'Admin User'
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Payment recording error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!feeRecord) return null;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Record Payment</span>
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <div>
                Record payment for {feeRecord.student ? 
                  `${feeRecord.student.first_name} ${feeRecord.student.last_name}` : 
                  "student"} - {feeRecord.fee_type}
              </div>
              {academicYearName && (
                <Badge variant="outline" className="flex items-center space-x-1 w-fit">
                  <Calendar className="w-3 h-3" />
                  <span>Academic Year: {academicYearName}</span>
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Fee Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-900">Fee Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Actual Fee:</span>
              <span className="ml-2 font-medium">{formatCurrency(feeRecord.actual_fee)}</span>
            </div>
            <div>
              <span className="text-gray-600">Discount:</span>
              <span className="ml-2 font-medium text-green-600">
                -{formatCurrency(feeRecord.discount_amount)}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Final Fee:</span>
              <span className="ml-2 font-medium">{formatCurrency(feeRecord.final_fee)}</span>
            </div>
            <div>
              <span className="text-gray-600">Paid Till Date:</span>
              <span className="ml-2 font-medium text-blue-600">
                {formatCurrency(feeRecord.paid_amount)}
              </span>
            </div>
            <div className="col-span-2 pt-2 border-t border-blue-300">
              <span className="text-gray-600">Balance Amount:</span>
              <span className="ml-2 font-bold text-red-600 text-lg">
                {formatCurrency(feeRecord.balance_fee)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="amount_paid">Amount Paid *</Label>
              <Input
                id="amount_paid"
                type="number"
                step="0.01"
                min="0.01"
                max={feeRecord.balance_fee}
                value={formData.amount_paid}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  amount_paid: parseFloat(e.target.value) || 0
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="payment_date">Payment Date *</Label>
              <Input
                id="payment_date"
                type="date"
                value={formData.payment_date}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  payment_date: e.target.value
                }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="payment_method">Payment Method *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value: any) => setFormData(prev => ({
                  ...prev,
                  payment_method: value
                }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="PhonePe">PhonePe</SelectItem>
                  <SelectItem value="GPay">GPay</SelectItem>
                  <SelectItem value="Online">Online</SelectItem>
                  <SelectItem value="Cheque">Cheque</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="late_fee">Late Fee</Label>
              <Input
                id="late_fee"
                type="number"
                step="0.01"
                min="0"
                value={formData.late_fee}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  late_fee: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="receipt_number">Receipt Number *</Label>
              <Input
                id="receipt_number"
                value={formData.receipt_number}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  receipt_number: e.target.value
                }))}
                required
              />
            </div>
            <div>
              <Label htmlFor="payment_receiver">Payment Received By *</Label>
              <Input
                id="payment_receiver"
                value={formData.payment_receiver}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  payment_receiver: e.target.value
                }))}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                notes: e.target.value
              }))}
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Recording..." : "Record Payment"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
