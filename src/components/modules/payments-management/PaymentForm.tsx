
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Class, Student, FeeStructure } from "@/types/database";
import { useFeeDetails } from "./hooks/useFeeDetails";
import { StudentSelectionCard } from "./components/StudentSelectionCard";
import { FeeDetailsDisplay } from "./components/FeeDetailsDisplay";
import { PaymentInformationCard } from "./components/PaymentInformationCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePreviousYearDues } from "../fee-management/hooks/usePreviousYearDues";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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

  // Get current academic year for dues checking
  const [currentAcademicYear, setCurrentAcademicYear] = useState("");
  const { getStudentDues, hasOutstandingDues, logPaymentBlockage } = usePreviousYearDues(currentAcademicYear);

  // Get current academic year on component mount
  useEffect(() => {
    const getCurrentAcademicYear = async () => {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_current", true)
        .single();
      
      if (data && !error) {
        setCurrentAcademicYear(data.id);
      }
    };
    getCurrentAcademicYear();
  }, []);

  const studentDues = formData.student_id ? getStudentDues(formData.student_id) : null;
  const isPaymentBlocked = formData.student_id ? hasOutstandingDues(formData.student_id) : false;

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
    
    // Check if payment is blocked due to previous year dues
    if (isPaymentBlocked) {
      await logPaymentBlockage(
        formData.student_id,
        parseFloat(formData.amount_paid) || 0,
        `Attempted to pay current year fee while having ₹${studentDues?.totalDues} in previous year dues`
      );
      
      toast({
        title: 'Payment Blocked',
        description: 'You must clear all outstanding dues from previous academic years before paying for the current year.',
        variant: 'destructive',
      });
      return;
    }
    
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

      // Get or create fee record in the main fees table (not student_fee_records)
      let feeRecord;
      const { data: existingFeeRecord, error: feeRecordError } = await supabase
        .from("fees")
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
        // Create new fee record in main fees table
        const { data: newFeeRecord, error: createError } = await supabase
          .from("fees")
          .insert({
            student_id: formData.student_id,
            fee_type: selectedStructure.fee_type,
            amount: selectedStructure.amount,
            actual_amount: selectedStructure.amount,
            discount_amount: 0,
            total_paid: 0,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            academic_year_id: currentYear.id,
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

      // Also update/create enhanced fee record for consistency
      await supabase
        .from("student_fee_records")
        .upsert({
          student_id: formData.student_id,
          class_id: formData.class_id,
          academic_year_id: currentYear.id,
          fee_type: selectedStructure.fee_type,
          actual_fee: selectedStructure.amount,
          discount_amount: feeRecord.discount_amount || 0,
          discount_notes: feeRecord.discount_notes,
          discount_updated_by: feeRecord.discount_updated_by,
          discount_updated_at: feeRecord.discount_updated_at,
          due_date: feeRecord.due_date,
          status: feeRecord.status
        }, {
          onConflict: 'student_id,fee_type,academic_year_id',
          ignoreDuplicates: false
        });

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

      {/* Payment Blocking Warning */}
      {isPaymentBlocked && formData.student_id && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Payment Blocked!</strong>
            <br />
            This student has ₹{studentDues?.totalDues.toLocaleString()} in outstanding dues from previous academic years.
            <br />
            <span className="text-sm">You must clear all previous year dues before paying current year fees.</span>
            {studentDues && (
              <div className="mt-2 text-xs">
                <strong>Outstanding dues:</strong>
                <ul className="list-disc list-inside">
                  {studentDues.duesDetails.map((due, index) => (
                    <li key={index}>
                      {due.academicYear} - {due.feeType}: ₹{due.balanceAmount.toLocaleString()}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </AlertDescription>
        </Alert>
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
        <Button type="submit" disabled={isPaymentBlocked}>
          {isPaymentBlocked ? 'Payment Blocked' : 'Record Payment'}
        </Button>
      </div>
    </form>
  );
}
