
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Class, Student, FeeStructure } from "@/types/database";
import { useFeeDetails } from "./hooks/useFeeDetails";
import { StudentSelectionCard } from "./components/StudentSelectionCard";
import { FeeDetailsDisplay } from "./components/FeeDetailsDisplay";
import { PaymentInformationCard } from "./components/PaymentInformationCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentFormProps {
  classes: Class[];
  students: Student[];
  feeStructures: FeeStructure[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function PaymentForm({ classes, students, feeStructures, onSubmit, onCancel }: PaymentFormProps) {
  const [formData, setFormData] = useState({
    class_id: '',
    student_id: '',
    fee_structure_id: '',
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    late_fee: '0',
    reference_number: '',
    payment_received_by: '',
    notes: '',
  });

  const feeDetails = useFeeDetails(formData.student_id, formData.fee_structure_id, feeStructures);
  const { toast } = useToast();

  // Reset dependent fields when class changes
  useEffect(() => {
    if (formData.class_id) {
      setFormData(prev => ({ ...prev, student_id: '', fee_structure_id: '' }));
    }
  }, [formData.class_id]);

  // Update amount when fee details change
  useEffect(() => {
    if (feeDetails) {
      setFormData(prev => ({ 
        ...prev, 
        amount_paid: feeDetails.balanceAmount > 0 ? feeDetails.balanceAmount.toString() : '0'
      }));
    }
  }, [feeDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.student_id || !formData.fee_structure_id || !formData.amount_paid || !formData.payment_received_by) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    const amountPaid = parseFloat(formData.amount_paid);
    if (amountPaid <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Amount paid must be greater than 0',
        variant: 'destructive',
      });
      return;
    }

    if (feeDetails && amountPaid > feeDetails.balanceAmount) {
      toast({
        title: 'Validation Error',
        description: `Amount paid cannot exceed balance amount of ₹${feeDetails.balanceAmount.toLocaleString()}`,
        variant: 'destructive',
      });
      return;
    }

    try {
      // Get current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_current", true)
        .single();

      if (yearError || !currentYear) {
        throw new Error("No current academic year found");
      }

      // Get fee structure details
      const selectedStructure = feeStructures.find(fs => fs.id === formData.fee_structure_id);
      if (!selectedStructure) {
        throw new Error("Fee structure not found");
      }

      // Check if enhanced fee record exists, if not create it
      let feeRecord;
      const { data: existingFeeRecord, error: feeRecordError } = await supabase
        .from("student_fee_records")
        .select("*")
        .eq("student_id", formData.student_id)
        .eq("academic_year_id", currentYear.id)
        .eq("fee_type", selectedStructure.fee_type)
        .maybeSingle();

      if (feeRecordError && feeRecordError.code !== 'PGRST116') {
        console.error("Error checking fee record:", feeRecordError);
      }

      if (existingFeeRecord) {
        feeRecord = existingFeeRecord;
      } else {
        // Create new fee record in enhanced system
        const { data: newFeeRecord, error: createError } = await supabase
          .from("student_fee_records")
          .insert({
            student_id: formData.student_id,
            class_id: formData.class_id,
            academic_year_id: currentYear.id,
            fee_type: selectedStructure.fee_type,
            actual_fee: selectedStructure.amount,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            status: 'Pending'
          })
          .select()
          .single();

        if (createError) {
          console.error("Error creating fee record:", createError);
          throw createError;
        }
        feeRecord = newFeeRecord;
      }

      // Generate receipt number if not provided
      const receiptNumber = formData.reference_number || `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Record payment in enhanced system first (fee_payment_records)
      const { error: feePaymentError } = await supabase
        .from("fee_payment_records")
        .insert({
          fee_record_id: feeRecord.id,
          student_id: formData.student_id,
          amount_paid: amountPaid,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          late_fee: parseFloat(formData.late_fee) || 0,
          receipt_number: receiptNumber,
          payment_receiver: formData.payment_received_by,
          notes: formData.notes || null,
          created_by: formData.payment_received_by
        });

      if (feePaymentError) {
        console.error("Error recording fee payment:", feePaymentError);
        throw feePaymentError;
      }

      // Also record in payment_history for timeline tracking
      const currentTime = new Date();
      const paymentTime = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS format

      const { error: historyError } = await supabase
        .from("payment_history")
        .insert({
          fee_id: feeRecord.id,
          student_id: formData.student_id,
          amount_paid: amountPaid,
          payment_date: formData.payment_date,
          payment_time: paymentTime,
          receipt_number: receiptNumber,
          payment_receiver: formData.payment_received_by,
          payment_method: formData.payment_method,
          notes: formData.notes || null,
          fee_type: selectedStructure.fee_type
        });

      if (historyError) {
        console.error("Error recording payment history:", historyError);
      }

      // Call original onSubmit to maintain existing functionality
      const formDataWithReceipt = {
        ...formData,
        reference_number: receiptNumber,
        amount_paid: amountPaid.toString()
      };

      onSubmit(formDataWithReceipt);

      toast({
        title: "Payment recorded successfully",
        description: `Payment of ₹${amountPaid.toLocaleString()} recorded successfully. Receipt: ${receiptNumber}`,
      });

    } catch (error: any) {
      console.error("Error recording payment:", error);
      toast({
        title: "Error recording payment",
        description: error.message || "Failed to record payment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <StudentSelectionCard
        classId={formData.class_id}
        studentId={formData.student_id}
        feeStructureId={formData.fee_structure_id}
        classes={classes}
        students={students}
        feeStructures={feeStructures}
        onInputChange={handleInputChange}
      />

      {feeDetails && (
        <FeeDetailsDisplay feeDetails={feeDetails} />
      )}

      <PaymentInformationCard
        formData={formData}
        feeDetails={feeDetails}
        onInputChange={handleInputChange}
      />

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          Record Payment
        </Button>
      </div>
    </form>
  );
}
