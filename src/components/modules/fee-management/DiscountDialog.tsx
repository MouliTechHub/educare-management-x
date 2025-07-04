
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DiscountForm } from "./discount/DiscountForm";
import { DiscountSummary } from "./discount/DiscountSummary";
import { useDiscountData } from "./discount/useDiscountData";

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
  const { academicYears, feeStructures, existingFees } = useDiscountData();

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
        if (discountAmount > selectedFee.actual_amount) {
          toast({
            title: "Invalid discount amount",
            description: "Discount cannot exceed the actual fee amount",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
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
        discountAmount = (selectedFee.actual_amount * data.amount) / 100;
      }

      const currentYear = academicYears.find(year => year.is_current);
      if (!currentYear) throw new Error('No current academic year found');

      // Apply discount to both fee systems for consistency - ADD to existing discount
      const currentDiscount = selectedFee.discount_amount || 0;
      const newTotalDiscount = currentDiscount + discountAmount;
      
      const discountData = {
        discount_amount: newTotalDiscount,
        discount_notes: data.notes,
        discount_updated_by: 'Admin',
        discount_updated_at: new Date().toISOString()
      };

      // Update or create in legacy fees table
      const legacyFee = existingFees.find(ef => 
        ef.student_id === selectedFee.student_id && 
        ef.fee_type === selectedFee.fee_type
      );

      if (legacyFee) {
        const { error: legacyError } = await supabase
          .from('fees')
          .update(discountData)
          .eq('id', legacyFee.id);

        if (legacyError) throw legacyError;
      } else {
        // Create new legacy fee record if needed
        const feeStructure = feeStructures.find(fs => 
          fs.class_id === selectedFee.student?.class_id && 
          fs.fee_type === selectedFee.fee_type
        );

        if (feeStructure) {
          const { error: legacyInsertError } = await supabase
            .from('fees')
            .insert({
              student_id: selectedFee.student_id,
              fee_type: selectedFee.fee_type,
              amount: feeStructure.amount,
              actual_amount: feeStructure.amount,
              ...discountData,
              total_paid: 0,
              due_date: selectedFee.due_date,
              status: 'Pending',
              academic_year_id: currentYear.id
            });

          if (legacyInsertError) throw legacyInsertError;
        }
      }

      // Update enhanced fee records table if the record exists there
      const { error: enhancedError } = await supabase
        .from('student_fee_records')
        .update({
          discount_amount: newTotalDiscount,
          discount_notes: data.notes,
          discount_updated_by: 'Admin',
          discount_updated_at: new Date().toISOString()
        })
        .eq('student_id', selectedFee.student_id)
        .eq('fee_type', selectedFee.fee_type)
        .eq('academic_year_id', currentYear.id);

      // Don't throw error if no enhanced record exists, as it's optional
      if (enhancedError) {
        console.warn('Enhanced fee record update failed:', enhancedError);
      }

      toast({
        title: "Discount applied",
        description: `Additional discount of ₹${discountAmount.toFixed(2)} applied. Total discount: ₹${newTotalDiscount.toFixed(2)}`
      });

      onOpenChange(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error applying discount:', error);
      toast({
        title: "Error applying discount",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Apply Discount</DialogTitle>
          <p className="text-sm text-gray-500">
            Apply discount for {selectedFee?.student?.first_name} {selectedFee?.student?.last_name} - {selectedFee?.fee_type}
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <DiscountSummary selectedFee={selectedFee} />
          
          <DiscountForm 
            form={form}
            onSubmit={onSubmit}
            loading={loading}
            selectedFee={selectedFee}
            onCancel={handleCancel}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
