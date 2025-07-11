
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

      // Get all outstanding fees from the year being promoted FROM (not target year)
      // This includes ALL outstanding fees regardless of type
      const { data: feeData, error: feeError } = await supabase
        .from('student_fee_records')
        .select(`
          student_id,
          fee_type,
          actual_fee,
          discount_amount,
          paid_amount,
          balance_fee,
          academic_year_id,
          students!inner(
            first_name,
            last_name,
            admission_number
          )
        `)
        .neq('status', 'Paid')
        .gt('balance_fee', 0)
        .neq('academic_year_id', currentAcademicYearId); // Get fees from the year being promoted FROM

      if (feeError) throw feeError;

      console.log('📊 Total fees with outstanding balances:', feeData?.length || 0);

      // Group by student and calculate outstanding amounts (Previous Year Dues + Tuition Fee only)
      const studentOutstandingMap = new Map<string, OutstandingFee>();

      (feeData || []).forEach((fee: any) => {
        const studentId = fee.student_id;
        const balanceAmount = fee.balance_fee || (fee.actual_fee - fee.discount_amount - fee.paid_amount);
        
        if (balanceAmount <= 0) return; // Skip if fully paid
        
        // Only include Previous Year Dues and Tuition Fee in outstanding calculation
        if (fee.fee_type !== 'Previous Year Dues' && fee.fee_type !== 'Tuition Fee') {
          return;
        }

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
        studentOutstanding.totalOutstanding += balanceAmount;
        studentOutstanding.feeDetails.push({
          feeType: fee.fee_type,
          academicYearName: yearMap.get(fee.academic_year_id) || 'Unknown Year',
          actualAmount: fee.actual_fee,
          discountAmount: fee.discount_amount,
          paidAmount: fee.paid_amount,
          balanceAmount
        });
      });

      // Convert map to array - show ALL students with outstanding fees
      const finalOutstandingStudents = Array.from(studentOutstandingMap.values());

      console.log('✅ Students with outstanding fees:', finalOutstandingStudents.length);
      console.log('📋 Outstanding students details:', finalOutstandingStudents);

      setOutstandingFees(finalOutstandingStudents);
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
            results.payments++;
            break;
          
          case 'waiver':
            results.waivers++;
            break;
          
          case 'carry_forward':
            results.carriedForward++;
            break;
          
          case 'block':
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

  // Auto-refresh every 30 seconds to catch payment updates
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOutstandingFees();
    }, 30000);

    return () => clearInterval(interval);
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
