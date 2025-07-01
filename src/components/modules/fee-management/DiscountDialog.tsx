
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeRecord: StudentFeeRecord | null;
  onDiscountUpdate: (recordId: string, discountData: {
    discount_amount: number;
    discount_percentage?: number;
    discount_notes?: string;
    discount_updated_by: string;
  }) => Promise<void>;
}

export function DiscountDialog({ 
  open, 
  onOpenChange, 
  feeRecord, 
  onDiscountUpdate 
}: DiscountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [discountType, setDiscountType] = useState<'amount' | 'percentage'>('amount');
  const [formData, setFormData] = useState({
    discount_amount: 0,
    discount_percentage: 0,
    discount_notes: ''
  });

  useEffect(() => {
    if (feeRecord && open) {
      setFormData({
        discount_amount: feeRecord.discount_amount,
        discount_percentage: feeRecord.discount_percentage || 0,
        discount_notes: feeRecord.discount_notes || ''
      });
      
      // Determine discount type based on existing values
      if (feeRecord.discount_percentage && feeRecord.discount_percentage > 0) {
        setDiscountType('percentage');
      } else {
        setDiscountType('amount');
      }
    }
  }, [feeRecord, open]);

  const calculateDiscountAmount = () => {
    if (!feeRecord) return 0;
    
    if (discountType === 'percentage') {
      return (feeRecord.actual_fee * formData.discount_percentage) / 100;
    } else {
      return formData.discount_amount;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeRecord) return;

    const calculatedDiscountAmount = calculateDiscountAmount();

    // Validation
    if (calculatedDiscountAmount < 0) {
      toast({
        title: "Invalid Discount",
        description: "Discount amount cannot be negative",
        variant: "destructive",
      });
      return;
    }

    if (calculatedDiscountAmount > feeRecord.actual_fee) {
      toast({
        title: "Invalid Discount",
        description: `Discount amount cannot exceed actual fee of ₹${feeRecord.actual_fee.toLocaleString()}`,
        variant: "destructive",
      });
      return;
    }

    if (discountType === 'percentage' && formData.discount_percentage > 100) {
      toast({
        title: "Invalid Percentage",
        description: "Discount percentage cannot exceed 100%",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await onDiscountUpdate(feeRecord.id, {
        discount_amount: calculatedDiscountAmount,
        discount_percentage: discountType === 'percentage' ? formData.discount_percentage : 0,
        discount_notes: formData.discount_notes || null,
        discount_updated_by: 'Admin User'
      });

      onOpenChange(false);
    } catch (error) {
      console.error('Discount update error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!feeRecord) return null;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const calculatedDiscount = calculateDiscountAmount();
  const newFinalFee = feeRecord.actual_fee - calculatedDiscount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Percent className="w-5 h-5" />
            <span>Apply Discount</span>
          </DialogTitle>
          <DialogDescription>
            <div className="space-y-2">
              <div>
                Apply discount for {feeRecord.student ? 
                  `${feeRecord.student.first_name} ${feeRecord.student.last_name}` : 
                  "student"} - {feeRecord.fee_type}
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        {/* Fee Summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-orange-900">Current Fee Details</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Actual Fee:</span>
              <span className="font-medium">{formatCurrency(feeRecord.actual_fee)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Discount:</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(feeRecord.discount_amount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Current Final Fee:</span>
              <span className="font-medium">{formatCurrency(feeRecord.final_fee)}</span>
            </div>
          </div>
        </div>

        {/* New Discount Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-blue-900">New Discount Preview</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">New Discount:</span>
              <span className="font-medium text-green-600">
                -{formatCurrency(calculatedDiscount)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">New Final Fee:</span>
              <span className="font-bold text-blue-600">{formatCurrency(newFinalFee)}</span>
            </div>
          </div>
        </div>

        {/* Discount Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Discount Type</Label>
            <div className="flex space-x-4 mt-2">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="discountType"
                  value="amount"
                  checked={discountType === 'amount'}
                  onChange={(e) => setDiscountType(e.target.value as 'amount')}
                />
                <span>Fixed Amount</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  name="discountType"
                  value="percentage"
                  checked={discountType === 'percentage'}
                  onChange={(e) => setDiscountType(e.target.value as 'percentage')}
                />
                <span>Percentage</span>
              </label>
            </div>
          </div>

          {discountType === 'amount' ? (
            <div>
              <Label htmlFor="discount_amount">Discount Amount</Label>
              <Input
                id="discount_amount"
                type="number"
                step="0.01"
                min="0"
                max={feeRecord.actual_fee}
                value={formData.discount_amount}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  discount_amount: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
          ) : (
            <div>
              <Label htmlFor="discount_percentage">Discount Percentage (%)</Label>
              <Input
                id="discount_percentage"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discount_percentage}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  discount_percentage: parseFloat(e.target.value) || 0
                }))}
              />
            </div>
          )}

          <div>
            <Label htmlFor="discount_notes">Discount Notes</Label>
            <Textarea
              id="discount_notes"
              value={formData.discount_notes}
              onChange={(e) => setFormData(prev => ({
                ...prev,
                discount_notes: e.target.value
              }))}
              rows={3}
              placeholder="Reason for discount..."
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
              {loading ? "Applying..." : "Apply Discount"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
