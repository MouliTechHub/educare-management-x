
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

      // Generate receipt number if not provided
      const receiptNumber = formData.reference_number || `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      console.log('🔄 Recording payment in all systems...');

      // 1. Record payment in student_payments table (for Payments Management)
      const { error: paymentError } = await supabase
        .from("student_payments")
        .insert({
          student_id: formData.student_id,
          fee_structure_id: formData.fee_structure_id,
          amount_paid: amountPaid,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          late_fee: parseFloat(formData.late_fee) || 0,
          reference_number: receiptNumber,
          payment_received_by: formData.payment_received_by,
          notes: formData.notes || null,
        });

      if (paymentError) {
        console.error("Error recording student payment:", paymentError);
        throw paymentError;
      }

      console.log('✅ Student payment recorded');

      // 2. Find or create corresponding fee record in main fees table
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
        console.log('✅ Found existing fee record:', feeRecord.id);
      } else {
        // Create new fee record
        const { data: newFeeRecord, error: createFeeError } = await supabase
          .from("fees")
          .insert({
            student_id: formData.student_id,
            academic_year_id: currentYear.id,
            fee_type: selectedStructure.fee_type,
            amount: selectedStructure.amount,
            actual_amount: selectedStructure.amount,
            discount_amount: 0,
            total_paid: 0,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Pending'
          })
          .select()
          .single();

        if (createFeeError) {
          console.error("Error creating fee record:", createFeeError);
        } else {
          feeRecord = newFeeRecord;
          console.log('✅ Created new fee record:', feeRecord.id);
        }
      }

      // 3. Record payment in payment_history table if we have fee record
      if (feeRecord) {
        const { error: historyError } = await supabase
          .from("payment_history")
          .insert({
            fee_id: feeRecord.id,
            student_id: formData.student_id,
            amount_paid: amountPaid,
            payment_date: formData.payment_date,
            payment_method: formData.payment_method,
            receipt_number: receiptNumber,
            payment_receiver: formData.payment_received_by,
            notes: formData.notes || null,
            fee_type: selectedStructure.fee_type
          });

        if (historyError) {
          console.error("Error recording payment history:", historyError);
        } else {
          console.log('✅ Payment history recorded');
        }

        // 4. Update total_paid in fees table
        const { data: paymentTotal, error: totalError } = await supabase
          .from("payment_history")
          .select("amount_paid")
          .eq("fee_id", feeRecord.id);

        if (!totalError && paymentTotal) {
          const totalPaid = paymentTotal.reduce((sum, payment) => sum + payment.amount_paid, 0);
          
          const { error: updateError } = await supabase
            .from("fees")
            .update({
              total_paid: totalPaid,
              status: totalPaid >= (feeRecord.actual_amount - feeRecord.discount_amount) ? 'Paid' : 
                     totalPaid > 0 ? 'Partial' : 'Pending'
            })
            .eq("id", feeRecord.id);

          if (updateError) {
            console.error("Error updating fee total:", updateError);
          } else {
            console.log('✅ Fee total updated to:', totalPaid);
          }
        }
      }

      // 5. Handle enhanced fee system (student_fee_records)
      let enhancedFeeRecord;
      const { data: existingEnhancedRecord, error: enhancedRecordError } = await supabase
        .from("student_fee_records")
        .select("*")
        .eq("student_id", formData.student_id)
        .eq("academic_year_id", currentYear.id)
        .eq("fee_type", selectedStructure.fee_type)
        .maybeSingle();

      if (enhancedRecordError && enhancedRecordError.code !== 'PGRST116') {
        console.error("Error checking enhanced fee record:", enhancedRecordError);
      }

      if (existingEnhancedRecord) {
        enhancedFeeRecord = existingEnhancedRecord;
      } else {
        // Create new enhanced fee record
        const { data: newEnhancedRecord, error: createEnhancedError } = await supabase
          .from("student_fee_records")
          .insert({
            student_id: formData.student_id,
            class_id: formData.class_id,
            academic_year_id: currentYear.id,
            fee_type: selectedStructure.fee_type,
            actual_fee: selectedStructure.amount,
            discount_amount: 0,
            paid_amount: 0,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: 'Pending'
          })
          .select()
          .single();

        if (createEnhancedError) {
          console.error("Error creating enhanced fee record:", createEnhancedError);
        } else {
          enhancedFeeRecord = newEnhancedRecord;
        }
      }

      // Record payment in enhanced system
      if (enhancedFeeRecord) {
        const { error: feePaymentError } = await supabase
          .from("fee_payment_records")
          .insert({
            fee_record_id: enhancedFeeRecord.id,
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
        } else {
          console.log('✅ Enhanced fee payment recorded');
        }
      }

      console.log('✅ Payment recording completed successfully');

      // Show success message
      toast({
        title: "Payment recorded successfully",
        description: `Payment of ₹${amountPaid.toLocaleString()} recorded successfully. Receipt: ${receiptNumber}`,
      });

      // Call the parent onSubmit callback to refresh data and close dialog
      const formDataWithReceipt = {
        ...formData,
        reference_number: receiptNumber,
        amount_paid: amountPaid.toString()
      };

      onSubmit(formDataWithReceipt);

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
