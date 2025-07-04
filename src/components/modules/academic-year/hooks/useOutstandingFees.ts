import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OutstandingFee {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  totalOutstanding: number;
  feeDetails: {
    feeId: string;
    feeType: string;
    academicYearName: string;
    amount: number;
    paidAmount: number;
    balanceAmount: number;
    dueDate: string;
    classId?: string;
  }[];
}

export interface FeeAction {
  studentId: string;
  action: 'block' | 'payment' | 'waiver' | 'carry_forward';
  paymentAmount?: number;
  waiverReason?: string;
  notes?: string;
}

export function useOutstandingFees(currentAcademicYearId: string) {
  const [outstandingFees, setOutstandingFees] = useState<OutstandingFee[]>([]);
  const [loading, setLoading] = useState(false);
  const [feeActions, setFeeActions] = useState<Map<string, FeeAction>>(new Map());
  const { toast } = useToast();

  const fetchOutstandingFees = async () => {
    if (!currentAcademicYearId) return;
    
    setLoading(true);
    try {
      // Get all active students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('status', 'Active');

      if (studentsError) throw studentsError;

      // Get all unpaid/partially paid fees from current academic year
      // Using student_fee_records as primary source to match Fee Management calculation
      const { data: feesData, error: feesError } = await supabase
        .from('student_fee_records')
        .select(`
          id,
          student_id,
          class_id,
          fee_type,
          actual_fee,
          discount_amount,
          paid_amount,
          due_date,
          academic_year_id,
          academic_years!inner(year_name, start_date)
        `)
        .eq('academic_year_id', currentAcademicYearId)
        .neq('status', 'Paid')
        .order('due_date', { ascending: true });

      console.log('🔍 Outstanding fees query result:', {
        currentAcademicYearId,
        feesFound: feesData?.length || 0,
        error: feesError
      });

      if (feesError) throw feesError;

      // Group fees by student and calculate outstanding amounts
      const studentFeeMap = new Map<string, OutstandingFee>();

      feesData?.forEach((fee: any) => {
        const student = studentsData?.find(s => s.id === fee.student_id);
        if (!student) return;

        // Calculate actual balance: actual fee minus discount minus paid amount (matching Fee Management)
        const balanceAmount = fee.actual_fee - fee.discount_amount - fee.paid_amount;
        
        console.log('💰 Fee calculation for student:', {
          studentName: `${student.first_name} ${student.last_name}`,
          feeType: fee.fee_type,
          actualFee: fee.actual_fee,
          discountAmount: fee.discount_amount,
          paidAmount: fee.paid_amount,
          calculatedBalance: balanceAmount
        });
        
        if (balanceAmount <= 0) return; // Skip if fully paid

        const studentKey = fee.student_id;
        if (!studentFeeMap.has(studentKey)) {
          studentFeeMap.set(studentKey, {
            studentId: fee.student_id,
            studentName: `${student.first_name} ${student.last_name}`,
            admissionNumber: student.admission_number,
            totalOutstanding: 0,
            feeDetails: []
          });
        }

        const studentFee = studentFeeMap.get(studentKey)!;
        studentFee.totalOutstanding += balanceAmount;
        studentFee.feeDetails.push({
          feeId: fee.id,
          feeType: fee.fee_type,
          academicYearName: fee.academic_years.year_name,
          amount: fee.actual_fee,
          paidAmount: fee.paid_amount,
          balanceAmount,
          dueDate: fee.due_date,
          classId: fee.class_id
        });
      });

      setOutstandingFees(Array.from(studentFeeMap.values()));
    } catch (error: any) {
      console.error('Error fetching outstanding fees:', error);
      toast({
        title: "Error",
        description: "Failed to fetch outstanding fees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setFeeAction = (studentId: string, action: FeeAction) => {
    setFeeActions(prev => {
      const newMap = new Map(prev);
      newMap.set(studentId, action);
      return newMap;
    });
  };

  const processOutstandingFees = async (targetAcademicYearId: string) => {
    const results = {
      blocked: 0,
      payments: 0,
      waivers: 0,
      carriedForward: 0,
      errors: [] as string[]
    };

    for (const [studentId, action] of feeActions) {
      try {
        const student = outstandingFees.find(f => f.studentId === studentId);
        if (!student) continue;

        switch (action.action) {
          case 'payment':
            if (action.paymentAmount && action.paymentAmount > 0) {
              // Record payment in payment_history
              await supabase.from('payment_history').insert({
                fee_id: student.feeDetails[0].feeId, // For simplicity, apply to first outstanding fee
                student_id: studentId,
                amount_paid: action.paymentAmount,
                payment_date: new Date().toISOString().split('T')[0],
                payment_method: 'Cash',
                receipt_number: `PAY-${Date.now()}`,
                payment_receiver: 'Admin',
                fee_type: 'Outstanding Balance',
                notes: action.notes || 'Payment for outstanding dues during promotion'
              });
              results.payments++;
            }
            break;

          case 'waiver':
            // Create waiver record - update fee to mark as waived
            for (const feeDetail of student.feeDetails) {
              // Get current fee data to add to existing discount
              const { data: currentFee } = await supabase
                .from('fees')
                .select('discount_amount')
                .eq('id', feeDetail.feeId)
                .single();
              
              const currentDiscount = currentFee?.discount_amount || 0;
              const newDiscount = currentDiscount + feeDetail.balanceAmount;
              
              await supabase.from('fees').update({
                discount_amount: newDiscount,
                discount_notes: action.waiverReason,
                discount_updated_by: 'Admin',
                discount_updated_at: new Date().toISOString(),
                status: 'Paid' // Mark as paid due to waiver
              }).eq('id', feeDetail.feeId);
            }
            results.waivers++;
            break;

          case 'carry_forward':
            // Create new fee record in target academic year for previous year dues
            const { error: carryForwardError } = await supabase.from('fees').insert({
              student_id: studentId,
              fee_type: 'Previous Year Dues',
              amount: student.totalOutstanding,
              actual_amount: student.totalOutstanding,
              discount_amount: 0,
              total_paid: 0,
              due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
              academic_year_id: targetAcademicYearId,
              status: 'Pending',
              notes: `Carried forward from previous academic years. Details: ${student.feeDetails.map(f => `${f.academicYearName}: ₹${f.balanceAmount}`).join(', ')}`
            });

            if (carryForwardError) {
              console.error('Error creating carry forward fee:', carryForwardError);
              throw carryForwardError;
            }

            // Also create in enhanced fee records for consistency
            const { error: enhancedCarryForwardError } = await supabase.from('student_fee_records').insert({
              student_id: studentId,
              class_id: student.feeDetails[0]?.classId || null,
              academic_year_id: targetAcademicYearId,
              fee_type: 'Previous Year Dues',
              actual_fee: student.totalOutstanding,
              discount_amount: 0,
              paid_amount: 0,
              due_date: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
              status: 'Pending'
            });

            if (enhancedCarryForwardError) {
              console.warn('Enhanced carry forward creation failed:', enhancedCarryForwardError);
            }

            results.carriedForward++;
            break;

          case 'block':
            results.blocked++;
            break;
        }
      } catch (error: any) {
        results.errors.push(`Error processing ${studentId}: ${error.message}`);
      }
    }

    return results;
  };

  useEffect(() => {
    fetchOutstandingFees();
  }, [currentAcademicYearId]);

  return {
    outstandingFees,
    loading,
    feeActions,
    setFeeAction,
    processOutstandingFees,
    refetch: fetchOutstandingFees
  };
}