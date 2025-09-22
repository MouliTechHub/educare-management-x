
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DiscountForm } from "./discount/DiscountForm";
import { DiscountSummary } from "./discount/DiscountSummary";

interface DiscountFormData {
  type: string;
  amount: number;
  reason: string;
  notes: string;
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFee: any;
  onSuccess: () => void;
}

export function DiscountDialog({ open, onOpenChange, selectedFee, onSuccess }: DiscountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<DiscountFormData>({
    defaultValues: {
      type: "Fixed Amount",
      amount: 0,
      reason: "",
      notes: "",
    },
  });

  const onSubmit = async (data: DiscountFormData) => {
    if (!selectedFee) return;

    setLoading(true);
    try {
      console.log('🔍 Starting discount application for:', {
        selectedFeeId: selectedFee.id,
        studentId: selectedFee.student_id,
        feeType: selectedFee.fee_type,
        discountData: data
      });

      // Get the actual fee amount from the student_fee_records
      const actualAmount = selectedFee.actual_fee || selectedFee.actual_amount || selectedFee.amount || 0;
      
      // Prevent discounts on aggregated Previous Year Dues row
      if (String(selectedFee.id || '').startsWith('pyd_')) {
        toast({
          title: "Not supported on aggregated dues",
          description: "Apply discounts on specific prior-year fee records from Payment History.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      
      // Validation
      if (data.amount <= 0) {
        toast({
          title: "Invalid discount amount",
          description: "Discount amount must be greater than 0",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (!data.reason) {
        toast({
          title: "Reason required",
          description: "Please select a reason for the discount",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      let discountAmount = 0;
      
      if (data.type === 'Fixed Amount') {
        discountAmount = data.amount;
      } else if (data.type === 'Percentage') {
        if (data.amount > 100) {
          toast({
            title: "Invalid percentage",
            description: "Discount percentage cannot exceed 100%",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        discountAmount = (actualAmount * data.amount) / 100;
      }

      // Get current discount amount from student_fee_records
      const currentDiscount = selectedFee.discount_amount || 0;
      const newTotalDiscount = currentDiscount + discountAmount;

      // Validate total discount doesn't exceed actual amount
      if (newTotalDiscount > actualAmount) {
        toast({
          title: "Invalid discount amount",
          description: `Total discount (₹${newTotalDiscount.toFixed(2)}) cannot exceed the actual fee amount (₹${actualAmount.toFixed(2)})`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('💰 Applying cumulative discount:', {
        currentDiscount,
        newDiscountAmount: discountAmount,
        newTotalDiscount
      });

      // Apply discount atomically via RPC
      const { data: rpcData, error: rpcError } = await supabase.rpc('apply_student_discount', {
        p_fee_record_id: selectedFee.id,
        p_type: data.type,
        p_amount: data.amount,
        p_reason: data.reason,
        p_notes: data.notes,
        p_applied_by: 'Admin'
      });

      if (rpcError) {
        console.error('❌ RPC error applying discount:', rpcError);
        throw rpcError;
      }

      console.log('✅ Discount applied via RPC:', rpcData);

      toast({
        title: "Discount applied successfully",
        description: `Additional discount of ₹${discountAmount.toFixed(2)} applied.`
      });

      onOpenChange(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('❌ Error applying discount:', error);
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

  // Get the actual fee amount for display and validation
  const actualAmount = selectedFee?.actual_fee || selectedFee?.actual_amount || selectedFee?.amount || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <p className="text-sm text-gray-500">
            Apply discount for {selectedFee?.student?.first_name} {selectedFee?.student?.last_name} - {selectedFee?.fee_type}
            {selectedFee?.discount_amount > 0 && (
              <span className="block text-green-600 font-medium mt-1">
                Current discount: ₹{selectedFee.discount_amount.toLocaleString()}
              </span>
            )}
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <DiscountSummary selectedFee={{ ...selectedFee, actual_fee: actualAmount }} />
          
          <DiscountForm 
            form={form}
            onSubmit={onSubmit}
            loading={loading}
            selectedFee={{ ...selectedFee, actual_amount: actualAmount }}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
