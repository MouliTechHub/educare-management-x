
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
  const { academicYears, feeStructures } = useDiscountData();

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

      console.log('🔍 Starting discount application for:', {
        studentId: selectedFee.student_id,
        feeType: selectedFee.fee_type,
        selectedFeeId: selectedFee.id,
        newDiscountAmount: discountAmount,
        academicYear: currentYear.id
      });

      // First, get the main fee record to check current state
      const { data: mainFeeRecord, error: mainFeeError } = await supabase
        .from('fees')
        .select('*')
        .eq('student_id', selectedFee.student_id)
        .eq('fee_type', selectedFee.fee_type)
        .eq('academic_year_id', currentYear.id)
        .maybeSingle();

      if (mainFeeError) {
        console.error('Error fetching main fee record:', mainFeeError);
        throw mainFeeError;
      }

      let feeRecordId;
      let currentDiscount = 0;
      let updatedMainFeeRecord = mainFeeRecord;

      if (updatedMainFeeRecord) {
        feeRecordId = updatedMainFeeRecord.id;
        currentDiscount = updatedMainFeeRecord.discount_amount || 0;
        console.log('✅ Found existing main fee record:', {
          id: feeRecordId,
          currentDiscount
        });
      } else {
        // Create fee record in main fees table if it doesn't exist
        const feeStructure = feeStructures.find(fs => 
          fs.class_id === selectedFee.student?.class_id && 
          fs.fee_type === selectedFee.fee_type
        );

        if (!feeStructure) {
          throw new Error('Fee structure not found for this class and fee type');
        }

        const { data: newMainFee, error: createMainFeeError } = await supabase
          .from('fees')
          .insert({
            student_id: selectedFee.student_id,
            fee_type: selectedFee.fee_type,
            amount: feeStructure.amount,
            actual_amount: feeStructure.amount,
            discount_amount: 0,
            total_paid: 0,
            due_date: selectedFee.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Pending',
            academic_year_id: currentYear.id
          })
          .select('*')
          .single();

        if (createMainFeeError) {
          console.error('Error creating main fee record:', createMainFeeError);
          throw createMainFeeError;
        }

        feeRecordId = newMainFee.id;
        currentDiscount = 0;
        updatedMainFeeRecord = newMainFee;
        console.log('✅ Created new main fee record:', feeRecordId);
      }

      // Calculate the new total discount (cumulative)
      const newTotalDiscount = currentDiscount + discountAmount;

      // Validate total discount doesn't exceed actual amount
      if (newTotalDiscount > updatedMainFeeRecord.actual_amount) {
        toast({
          title: "Invalid discount amount",
          description: `Total discount (₹${newTotalDiscount.toFixed(2)}) cannot exceed the actual fee amount (₹${updatedMainFeeRecord.actual_amount.toFixed(2)})`,
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

      // Update the main fees table with the new cumulative discount
      const { error: mainUpdateError } = await supabase
        .from('fees')
        .update({
          discount_amount: newTotalDiscount,
          discount_notes: data.notes,
          discount_updated_by: 'Admin',
          discount_updated_at: new Date().toISOString()
        })
        .eq('id', feeRecordId);

      if (mainUpdateError) {
        console.error('Error updating main fee record:', mainUpdateError);
        throw mainUpdateError;
      }

      console.log('✅ Updated main fee record with total discount:', newTotalDiscount);

      // Also update the enhanced fee system for consistency
      const { error: enhancedUpdateError } = await supabase
        .from('student_fee_records')
        .upsert({
          student_id: selectedFee.student_id,
          class_id: selectedFee.student?.class_id,
          academic_year_id: currentYear.id,
          fee_type: selectedFee.fee_type,
          actual_fee: updatedMainFeeRecord.actual_amount,
          discount_amount: newTotalDiscount,
          discount_notes: data.notes,
          discount_updated_by: 'Admin',
          discount_updated_at: new Date().toISOString(),
          due_date: updatedMainFeeRecord.due_date,
          status: updatedMainFeeRecord.status
        }, {
          onConflict: 'student_id,fee_type,academic_year_id',
          ignoreDuplicates: false
        });

      if (enhancedUpdateError) {
        console.error('Error updating enhanced fee record:', enhancedUpdateError);
      } else {
        console.log('✅ Updated enhanced fee record');
      }

      // Log the discount in history (log only the new discount amount being added)
      const { error: historyError } = await supabase
        .from('discount_history')
        .insert({
          fee_id: feeRecordId,
          student_id: selectedFee.student_id,
          discount_amount: discountAmount, // This is the new discount amount being added
          discount_type: data.type,
          discount_percentage: data.type === 'Percentage' ? data.amount : null,
          reason: data.reason,
          notes: data.notes,
          applied_by: 'Admin'
        });

      if (historyError) {
        console.error('Error logging discount history:', historyError);
        // Don't throw here, just log the error
      } else {
        console.log('✅ Logged discount history for amount:', discountAmount);
      }

      toast({
        title: "Discount applied successfully",
        description: `Additional discount of ₹${discountAmount.toFixed(2)} applied. Total discount: ₹${newTotalDiscount.toFixed(2)}`
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
    onOpenChange(false);
  };

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
