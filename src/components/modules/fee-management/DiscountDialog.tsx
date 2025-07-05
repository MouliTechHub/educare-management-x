
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

      // Apply discount using UPSERT to prevent duplicates
      const currentDiscount = selectedFee.discount_amount || 0;
      const newTotalDiscount = currentDiscount + discountAmount;
      
      // Validate discount doesn't exceed fee amount
      if (newTotalDiscount > selectedFee.actual_amount) {
        toast({
          title: "Invalid discount amount",
          description: `Total discount (₹${newTotalDiscount.toFixed(2)}) cannot exceed the actual fee amount (₹${selectedFee.actual_amount.toFixed(2)})`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const discountData = {
        discount_amount: newTotalDiscount,
        discount_notes: data.notes,
        discount_updated_by: 'Admin',
        discount_updated_at: new Date().toISOString()
      };

      // First, ensure we have a valid fee record to work with
      let feeId = selectedFee.id;
      let updatedFeeRecord = null;

      // Try to update existing fee record first
      const { data: updatedFee, error: feeUpdateError } = await supabase
        .from('fees')
        .update(discountData)
        .eq('student_id', selectedFee.student_id)
        .eq('fee_type', selectedFee.fee_type)
        .eq('academic_year_id', currentYear.id)
        .select()
        .maybeSingle();

      if (feeUpdateError || !updatedFee) {
        console.log('Fee update failed, creating/upserting record:', feeUpdateError);
        
        // Get fee structure for creating new record
        const feeStructure = feeStructures.find(fs => 
          fs.class_id === selectedFee.student?.class_id && 
          fs.fee_type === selectedFee.fee_type
        );

        if (!feeStructure) {
          throw new Error('Fee structure not found for this class and fee type');
        }

        // Create or update fee record using UPSERT
        const { data: newFee, error: insertError } = await supabase
          .from('fees')
          .upsert({
            student_id: selectedFee.student_id,
            fee_type: selectedFee.fee_type,
            amount: feeStructure.amount,
            actual_amount: feeStructure.amount,
            ...discountData,
            total_paid: selectedFee.total_paid || 0,
            due_date: selectedFee.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: selectedFee.status || 'Pending',
            academic_year_id: currentYear.id
          }, {
            onConflict: 'student_id,fee_type,academic_year_id',
            ignoreDuplicates: false
          })
          .select()
          .single();

        if (insertError) throw insertError;
        
        feeId = newFee.id;
        updatedFeeRecord = newFee;
      } else {
        updatedFeeRecord = updatedFee;
      }

      // Ensure both systems are synchronized - update enhanced fee records table
      await supabase
        .from('student_fee_records')
        .upsert({
          student_id: selectedFee.student_id,
          class_id: selectedFee.student?.class_id,
          academic_year_id: currentYear.id,
          fee_type: selectedFee.fee_type,
          actual_fee: updatedFeeRecord.actual_amount,
          discount_amount: newTotalDiscount,
          discount_notes: data.notes,
          discount_updated_by: 'Admin',
          discount_updated_at: new Date().toISOString(),
          due_date: updatedFeeRecord.due_date,
          status: updatedFeeRecord.status
        }, {
          onConflict: 'student_id,fee_type,academic_year_id',
          ignoreDuplicates: false
        });

      // Log discount history manually to ensure it's recorded correctly
      // Check if this exact entry already exists to prevent duplicates
      const { data: existingEntry } = await supabase
        .from('discount_history')
        .select('id')
        .eq('fee_id', feeId)
        .eq('student_id', selectedFee.student_id)
        .eq('discount_amount', discountAmount)
        .eq('reason', data.reason)
        .gte('applied_at', new Date(Date.now() - 5000).toISOString())
        .limit(1);

      if (!existingEntry || existingEntry.length === 0) {
        await supabase.from('discount_history').insert({
          fee_id: feeId,
          student_id: selectedFee.student_id,
          discount_amount: discountAmount,
          discount_type: data.type,
          discount_percentage: data.type === 'Percentage' ? data.amount : null,
          reason: data.reason,
          notes: data.notes,
          applied_by: 'Admin'
        });
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
