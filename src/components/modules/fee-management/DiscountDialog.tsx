
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
      let discountAmount = 0;
      
      if (data.type === 'Fixed Amount') {
        discountAmount = data.amount;
      } else if (data.type === 'Percentage') {
        discountAmount = (selectedFee.actual_amount * data.amount) / 100;
      }

      const currentYear = academicYears.find(year => year.is_current);
      if (!currentYear) throw new Error('No current academic year found');

      // Check if fee record exists
      const existingFee = existingFees.find(ef => 
        ef.student_id === selectedFee.student_id && 
        ef.fee_type === selectedFee.fee_type
      );

      if (existingFee) {
        // Update existing fee record
        const { error } = await supabase
          .from('fees')
          .update({
            discount_amount: discountAmount,
            discount_notes: data.notes,
            discount_updated_by: 'Admin',
            discount_updated_at: new Date().toISOString()
          })
          .eq('id', existingFee.id);

        if (error) throw error;
      } else {
        // Create new fee record
        const feeStructure = feeStructures.find(fs => 
          fs.class_id === selectedFee.student.class_id && 
          fs.fee_type === selectedFee.fee_type
        );

        if (feeStructure) {
          const { error } = await supabase
            .from('fees')
            .insert({
              student_id: selectedFee.student_id,
              fee_type: selectedFee.fee_type,
              amount: feeStructure.amount,
              actual_amount: feeStructure.amount,
              discount_amount: discountAmount,
              total_paid: 0,
              due_date: selectedFee.due_date,
              status: 'Pending',
              academic_year_id: currentYear.id,
              discount_notes: data.notes,
              discount_updated_by: 'Admin',
              discount_updated_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      }

      toast({
        title: "Discount applied",
        description: `Discount of ₹${discountAmount.toFixed(2)} applied successfully`
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
