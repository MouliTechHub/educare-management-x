
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface OutstandingFee {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  totalOutstanding: number;
  feeDetails: {
    feeType: string;
    academicYearName: string;
    actualAmount: number;
    discountAmount: number;
    paidAmount: number;
    balanceAmount: number;
  }[];
}

export interface FeeAction {
  studentId: string;
  action: 'block' | 'payment' | 'waiver' | 'carry_forward';
  amount?: number;
  notes?: string;
  reason?: string;
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
      console.log('🔍 Fetching outstanding fees for academic year:', currentAcademicYearId);

      // Get all academic years for reference
      const { data: academicYears, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year_name')
        .order('start_date', { ascending: false });

      if (yearsError) throw yearsError;

      const yearMap = new Map(academicYears?.map(year => [year.id, year.year_name]) || []);

      // Fetch outstanding fees from both fee systems - focusing on ALL years, not just previous
      const [enhancedFeesResult, legacyFeesResult] = await Promise.allSettled([
        // Enhanced system - student_fee_records (all years)
        supabase
          .from('student_fee_records')
          .select(`
            student_id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            academic_year_id,
            students!inner(
              first_name,
              last_name,
              admission_number
            )
          `)
          .neq('status', 'Paid'),
        
        // Legacy system - fees table (all years)
        supabase
          .from('fees')
          .select(`
            student_id,
            fee_type,
            actual_amount,
            discount_amount,
            total_paid,
            academic_year_id,
            students!inner(
              first_name,
              last_name,
              admission_number
            )
          `)
          .neq('status', 'Paid')
      ]);

      // Combine both result sets and process
      let allFeesData = [];
      const uniqueFeeMap = new Map<string, any>();
      
      // Process enhanced fees
      if (enhancedFeesResult.status === 'fulfilled' && enhancedFeesResult.value.data) {
        enhancedFeesResult.value.data.forEach((fee: any) => {
          const uniqueKey = `${fee.student_id}_${fee.fee_type}_${fee.academic_year_id}`;
          const balanceAmount = fee.actual_fee - fee.discount_amount - fee.paid_amount;
          
          if (balanceAmount > 0) { // Only include if there's actual outstanding balance
            uniqueFeeMap.set(uniqueKey, {
              student_id: fee.student_id,
              fee_type: fee.fee_type,
              actual_fee: fee.actual_fee,
              discount_amount: fee.discount_amount,
              paid_amount: fee.paid_amount,
              balance_amount: balanceAmount,
              academic_year_id: fee.academic_year_id,
              students: fee.students
            });
          }
        });
      }
      
      // Process legacy fees (only add if not already present)
      if (legacyFeesResult.status === 'fulfilled' && legacyFeesResult.value.data) {
        legacyFeesResult.value.data.forEach((fee: any) => {
          const uniqueKey = `${fee.student_id}_${fee.fee_type}_${fee.academic_year_id}`;
          const balanceAmount = fee.actual_amount - fee.discount_amount - fee.total_paid;
          
          if (balanceAmount > 0 && !uniqueFeeMap.has(uniqueKey)) {
            uniqueFeeMap.set(uniqueKey, {
              student_id: fee.student_id,
              fee_type: fee.fee_type,
              actual_fee: fee.actual_amount,
              discount_amount: fee.discount_amount,
              paid_amount: fee.total_paid,
              balance_amount: balanceAmount,
              academic_year_id: fee.academic_year_id,
              students: fee.students
            });
          }
        });
      }

      allFeesData = Array.from(uniqueFeeMap.values());

      console.log('📊 Total fees with outstanding balances:', allFeesData.length);

      // Group by student
      const studentOutstandingMap = new Map<string, OutstandingFee>();

      allFeesData.forEach((fee: any) => {
        const studentId = fee.student_id;
        
        if (!studentOutstandingMap.has(studentId)) {
          studentOutstandingMap.set(studentId, {
            studentId,
            studentName: `${fee.students.first_name} ${fee.students.last_name}`,
            admissionNumber: fee.students.admission_number,
            totalOutstanding: 0,
            feeDetails: []
          });
        }

        const studentOutstanding = studentOutstandingMap.get(studentId)!;
        studentOutstanding.totalOutstanding += fee.balance_amount;
        studentOutstanding.feeDetails.push({
          feeType: fee.fee_type,
          academicYearName: yearMap.get(fee.academic_year_id) || 'Unknown Year',
          actualAmount: fee.actual_fee,
          discountAmount: fee.discount_amount,
          paidAmount: fee.paid_amount,
          balanceAmount: fee.balance_amount
        });
      });

      const outstandingStudents = Array.from(studentOutstandingMap.values());
      
      console.log('✅ Students with outstanding fees:', outstandingStudents.length);
      console.log('📋 Outstanding students details:', outstandingStudents);

      setOutstandingFees(outstandingStudents);
    } catch (error: any) {
      console.error('❌ Error fetching outstanding fees:', error);
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
    setFeeActions(prev => new Map(prev.set(studentId, action)));
  };

  const processOutstandingFees = async (targetAcademicYearId: string) => {
    const results = {
      payments: 0,
      waivers: 0,
      carriedForward: 0,
      blocked: 0
    };

    for (const [studentId, action] of feeActions.entries()) {
      try {
        switch (action.action) {
          case 'payment':
            // Record payment for the student's outstanding fees
            // This would need to be implemented based on your payment recording logic
            results.payments++;
            break;
          
          case 'waiver':
            // Apply waiver to outstanding fees
            // This would need to be implemented based on your waiver logic
            results.waivers++;
            break;
          
          case 'carry_forward':
            // Carry forward the outstanding fees to the new academic year
            results.carriedForward++;
            break;
          
          case 'block':
            // Block the student from promotion
            results.blocked++;
            break;
        }
      } catch (error) {
        console.error(`Error processing fee action for student ${studentId}:`, error);
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
