import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

interface PYDDiscountFormData {
  type: string;
  amount: number;
  reason: string;
  tag: string;
  notes: string;
}

interface PYDDiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFee: any;
  onSuccess: () => void;
}

const PYD_TAGS = [
  'Parent Request',
  'Management Waiver',
  'Scholarship',
  'Financial Hardship',
  'Good Performance',
  'Sibling Discount',
  'Other'
];

export function PYDDiscountDialog({ open, onOpenChange, selectedFee, onSuccess }: PYDDiscountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<PYDDiscountFormData>({
    defaultValues: {
      type: "Fixed Amount",
      amount: 0,
      reason: "",
      tag: "Parent Request",
      notes: "",
    },
  });

  const onSubmit = async (data: PYDDiscountFormData) => {
    if (!selectedFee) return;

    setLoading(true);
    try {
      console.log('🏷️ Starting PYD discount application with tagging:', {
        selectedFeeId: selectedFee.id,
        studentId: selectedFee.student_id,
        feeType: selectedFee.fee_type,
        tag: data.tag,
        discountData: data
      });

      // Validation
      if (data.amount <= 0) {
        toast({
          title: "Invalid discount amount",
          description: "Discount amount must be greater than 0",
          variant: "destructive",
        });
        return;
      }

      if (!data.reason || !data.tag) {
        toast({
          title: "Required fields missing",
          description: "Please provide both reason and tag for PYD discounts",
          variant: "destructive",
        });
        return;
      }

      // Apply discount with tagging via RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('apply_previous_year_dues_discount', {
        p_student_id: selectedFee.student_id,
        p_current_year_id: selectedFee.academic_year_id,
        p_type: data.type,
        p_amount: data.amount,
        p_reason: data.reason,
        p_notes: data.notes,
        p_approved_by: 'Admin'
      });

      if (rpcError) {
        console.error('❌ RPC error applying PYD discount:', rpcError);
        throw rpcError;
      }

      // Update discount history with PYD tag
      await supabase
        .from('discount_history')
        .update({
          applies_to: 'pyd',
          tag: data.tag
        })
        .eq('fee_id', selectedFee.id)
        .eq('applied_by', 'Admin')
        .order('created_at', { ascending: false })
        .limit(1);

      console.log('✅ PYD discount applied with tagging:', rpcData);

      toast({
        title: "PYD Discount applied successfully",
        description: `Discount of ₹${data.amount} applied with tag: ${data.tag}`
      });

      onOpenChange(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('❌ Error applying PYD discount:', error);
      toast({
        title: "Error applying discount",
        description: error.message || "Failed to apply discount. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  const actualAmount = selectedFee?.actual_fee || selectedFee?.actual_amount || selectedFee?.amount || 0;
  const currentDiscount = selectedFee?.discount_amount || 0;
  const remainingBalance = actualAmount - currentDiscount - (selectedFee?.paid_amount || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-orange-100 text-orange-800">PYD</Badge>
            Apply Previous Year Dues Discount
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Apply tagged discount for {selectedFee?.student?.first_name} {selectedFee?.student?.last_name}
            {currentDiscount > 0 && (
              <span className="block text-green-600 font-medium mt-1">
                Current discount: ₹{currentDiscount.toLocaleString()}
              </span>
            )}
          </p>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {/* Discount Summary */}
          <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Actual Fee:</span>
              <span className="font-medium">₹{actualAmount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Current Discount:</span>
              <span className="font-medium text-green-600">₹{currentDiscount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Paid Amount:</span>
              <span className="font-medium">₹{(selectedFee?.paid_amount || 0).toLocaleString()}</span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span>Outstanding Balance:</span>
              <span className="font-bold text-red-600">₹{remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Discount Type */}
          <div>
            <Label htmlFor="type">Discount Type</Label>
            <Select 
              value={form.watch("type")} 
              onValueChange={(value) => form.setValue("type", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                <SelectItem value="Percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amount */}
          <div>
            <Label htmlFor="amount">
              {form.watch("type") === "Percentage" ? "Percentage (%)" : "Amount (₹)"}
            </Label>
            <Input
              {...form.register("amount", { 
                required: true, 
                min: 0.01,
                max: form.watch("type") === "Percentage" ? 100 : remainingBalance
              })}
              type="number"
              step="0.01"
              placeholder={form.watch("type") === "Percentage" ? "Enter percentage" : "Enter amount"}
            />
          </div>

          {/* Tag (PYD-specific) */}
          <div>
            <Label htmlFor="tag">Discount Tag</Label>
            <Select 
              value={form.watch("tag")} 
              onValueChange={(value) => form.setValue("tag", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PYD_TAGS.map((tag) => (
                  <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reason */}
          <div>
            <Label htmlFor="reason">Reason</Label>
            <Input
              {...form.register("reason", { required: true })}
              placeholder="Brief reason for discount"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              {...form.register("notes")}
              placeholder="Additional details or justification"
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Applying..." : "Apply PYD Discount"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}