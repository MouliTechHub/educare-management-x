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

      // Get all academic years except the current one to fetch previous year dues
      const { data: academicYears, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year_name')
        .neq('id', currentAcademicYearId)
        .order('start_date', { ascending: false });

      if (yearsError) throw yearsError;

      if (!academicYears || academicYears.length === 0) {
        setOutstandingFees([]);
        return;
      }

      const previousYearIds = academicYears.map(year => year.id);

      // Get all unpaid/partially paid fees from PREVIOUS years only
      const [enhancedFeesResult, legacyFeesResult] = await Promise.allSettled([
        // Enhanced system - student_fee_records
        supabase
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
          .in('academic_year_id', previousYearIds)
          .neq('status', 'Paid')
          .order('due_date', { ascending: true }),
        
        // Legacy system - fees table
        supabase
          .from('fees')
          .select(`
            id,
            student_id,
            fee_type,
            actual_amount,
            discount_amount,
            total_paid,
            due_date,
            academic_year_id,
            academic_years!inner(year_name, start_date)
          `)
          .in('academic_year_id', previousYearIds)
          .neq('status', 'Paid')
          .order('due_date', { ascending: true })
      ]);

      // Combine both result sets and deduplicate
      let allFeesData = [];
      const uniqueFeeMap = new Map<string, any>();
      
      if (enhancedFeesResult.status === 'fulfilled' && enhancedFeesResult.value.data) {
        enhancedFeesResult.value.data.forEach((fee: any) => {
          const uniqueKey = `${fee.student_id}_${fee.fee_type}_${fee.academic_year_id}`;
          uniqueFeeMap.set(uniqueKey, fee);
        });
      }
      
      if (legacyFeesResult.status === 'fulfilled' && legacyFeesResult.value.data) {
        // Transform legacy fees to match enhanced format, but only add if not already present
        legacyFeesResult.value.data.forEach((fee: any) => {
          const uniqueKey = `${fee.student_id}_${fee.fee_type}_${fee.academic_year_id}`;
          if (!uniqueFeeMap.has(uniqueKey)) {
            uniqueFeeMap.set(uniqueKey, {
              id: fee.id,
              student_id: fee.student_id,
              class_id: null, // Legacy fees don't have class_id
              fee_type: fee.fee_type,
              actual_fee: fee.actual_amount,
              discount_amount: fee.discount_amount,
              paid_amount: fee.total_paid,
              due_date: fee.due_date,
              academic_year_id: fee.academic_year_id,
              academic_years: fee.academic_years
            });
          }
        });
      }

      allFeesData = Array.from(uniqueFeeMap.values());

      console.log('🔍 Outstanding fees query result:', {
        currentAcademicYearId,
        enhancedFeesFound: enhancedFeesResult.status === 'fulfilled' ? enhancedFeesResult.value.data?.length || 0 : 0,
        legacyFeesFound: legacyFeesResult.status === 'fulfilled' ? legacyFeesResult.value.data?.length || 0 : 0,
        totalFeesFound: allFeesData.length
      });

      if (enhancedFeesResult.status === 'rejected' && legacyFeesResult.status === 'rejected') {
        throw enhancedFeesResult.reason;
      }

      // Group fees by student and calculate outstanding amounts
      const studentFeeMap = new Map<string, OutstandingFee>();

      allFeesData?.forEach((fee: any) => {
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
            console.log('🔄 Logging carry forward dues for student:', {
              studentId,
              totalOutstanding: student.totalOutstanding,
              targetAcademicYearId,
              feeDetails: student.feeDetails
            });
            
            // Log the carry forward in payment_blockage_log for tracking
            const { error: logError } = await supabase.from('payment_blockage_log').insert({
              student_id: studentId,
              blocked_amount: 0,
              outstanding_dues: student.totalOutstanding,
              reason: `Carried forward dues from previous academic years: ${student.feeDetails.map(f => `${f.academicYearName}: ₹${f.balanceAmount}`).join(', ')}`,
              academic_year_id: targetAcademicYearId
            });

            if (logError) {
              console.error('Error logging carry forward:', logError);
              throw logError;
            }

            console.log('✅ Carry forward logged successfully for student:', studentId);

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