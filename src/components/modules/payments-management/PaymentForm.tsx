
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Class, Student, FeeStructure } from "@/types/database";
import { StudentSelectionCardNew } from "./components/StudentSelectionCardNew";
import { FeeDetailsDisplay } from "./components/FeeDetailsDisplay";
import { PaymentInformationCard } from "./components/PaymentInformationCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePreviousYearDues } from "../fee-management/hooks/usePreviousYearDues";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

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
    academic_year_id: '',
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'Cash',
    late_fee: '0',
    reference_number: '',
    payment_received_by: '',
    notes: '',
  });

  // Remove fee details dependency since we're using academic year approach
  const { toast } = useToast();
  const queryClient = useQueryClient();

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
      setFormData(prev => ({ ...prev, student_id: '' }));
    }
  }, [formData.class_id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Payment validation - simply validate that we have required fields
    if (!formData.student_id || !formData.academic_year_id || !formData.amount_paid || !formData.payment_received_by) {
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

    // Skip balance validation since we'll use FIFO allocation

    try {
      // Use the selected academic year
      const academicYearId = formData.academic_year_id;

      // Generate receipt number if not provided
      const receiptNumber = formData.reference_number || `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      console.log('🔄 Recording payment in consolidated system...');

      // Record payment directly without fee structure dependency
      // This will use FIFO allocation to automatically allocate to outstanding fees
      const currentTime = new Date();
      const paymentTime = currentTime.toTimeString().split(' ')[0];

      const { error: paymentError } = await supabase
        .from("fee_payment_records")
        .insert({
          fee_record_id: null, // Will be handled by allocation system
          student_id: formData.student_id,
          amount_paid: amountPaid,
          payment_date: formData.payment_date,
          payment_time: paymentTime,
          payment_method: formData.payment_method,
          late_fee: parseFloat(formData.late_fee) || 0,
          receipt_number: receiptNumber,
          payment_receiver: formData.payment_received_by,
          notes: formData.notes || null,
          created_by: formData.payment_received_by,
          target_academic_year_id: academicYearId // Pass the selected academic year
        });

      if (paymentError) {
        console.error("Error recording payment:", paymentError);
        throw paymentError;
      }

      console.log('✅ Payment recording completed successfully');

      // Invalidate fee management cache to show updated payment
      queryClient.invalidateQueries({ queryKey: ['student-fee-records'] });
      queryClient.invalidateQueries({ queryKey: ['fee-payment-records'] });

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
      <StudentSelectionCardNew
        classId={formData.class_id}
        studentId={formData.student_id}
        academicYearId={formData.academic_year_id}
        classes={classes}
        students={students}
        onInputChange={handleInputChange}
      />

      {/* Smart Payment Allocation Info */}
      {formData.student_id && formData.academic_year_id && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Smart Payment Allocation</strong>
            <br />
            Payment will be automatically allocated to outstanding fees using FIFO (First In, First Out) method.
            Previous year dues will be cleared first, followed by fees for the selected academic year in chronological order.
            <br />
            <span className="text-sm text-muted-foreground mt-1 block">
              Target Academic Year: {formData.academic_year_id ? 'Selected' : 'Current'}
            </span>
          </AlertDescription>
        </Alert>
      )}

      <PaymentInformationCard
        formData={formData}
        feeDetails={null}
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
