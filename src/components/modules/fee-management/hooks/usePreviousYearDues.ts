
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface PreviousYearDues {
  studentId: string;
  totalDues: number;
  duesDetails: {
    academicYear: string;
    feeType: string;
    balanceAmount: number;
  }[];
}

export function usePreviousYearDues(currentAcademicYearId: string | any) {
  const [previousYearDues, setPreviousYearDues] = useState<Map<string, PreviousYearDues>>(new Map());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Stabilize the currentAcademicYearId to prevent infinite re-renders
  const stableYearId = typeof currentAcademicYearId === 'string' 
    ? currentAcademicYearId 
    : (currentAcademicYearId as any)?.id || '';

  const fetchPreviousYearDues = async () => {
    if (!stableYearId || stableYearId === 'undefined') {
      console.log('⚠️ No valid current academic year ID provided');
      setPreviousYearDues(new Map());
      return;
    }
    
    setLoading(true);
    try {
      console.log('📅 Fetching previous year dues for current year:', stableYearId);
      
      // Fetch "Previous Year Dues" records from the current academic year
      // These are created when students are promoted and have outstanding balances
      const { data: feeData, error: feeError } = await supabase
        .from('student_fee_records')
        .select(`
          id,
          student_id,
          fee_type,
          actual_fee,
          discount_amount,
          paid_amount,
          balance_fee,
          academic_year_id,
          status,
          academic_years!inner(year_name)
        `)
        .neq('academic_year_id', stableYearId)
        .gt('balance_fee', 0);

      if (feeError) {
        console.error('❌ Error fetching fee data:', feeError);
        throw feeError;
      }

      console.log('✅ Previous Year Dues records fetched:', feeData?.length || 0, 'records');
      console.log('📊 Fee data details:', feeData);

      // Group dues by student
      const studentDuesMap = new Map<string, PreviousYearDues>();

      (feeData || []).forEach((fee: any) => {
        const balanceAmount = fee.balance_fee || (fee.actual_fee - fee.discount_amount - fee.paid_amount);
        
        if (balanceAmount <= 0) return; // Skip if fully paid

        const studentId = fee.student_id;
        
        if (!studentDuesMap.has(studentId)) {
          studentDuesMap.set(studentId, {
            studentId,
            totalDues: 0,
            duesDetails: []
          });
        }

        const studentDues = studentDuesMap.get(studentId)!;
        studentDues.totalDues += balanceAmount;
        studentDues.duesDetails.push({
          academicYear: fee.academic_years.year_name,
          feeType: fee.fee_type,
          balanceAmount
        });
      });

      console.log('✅ Previous year dues processed:', studentDuesMap.size, 'students with dues');
      setPreviousYearDues(studentDuesMap);
    } catch (error: any) {
      console.error('❌ Error fetching previous year dues:', error);
      toast({
        title: "Error",
        description: "Failed to fetch previous year dues",
        variant: "destructive",
      });
      setPreviousYearDues(new Map());
    } finally {
      setLoading(false);
    }
  };

  const getStudentDues = (studentId: string): PreviousYearDues | null => {
    return previousYearDues.get(studentId) || null;
  };

  const hasOutstandingDues = (studentId: string): boolean => {
    const dues = previousYearDues.get(studentId);
    return dues ? dues.totalDues > 0 : false;
  };

  const logPaymentBlockage = async (studentId: string, attemptedAmount: number, reason: string) => {
    try {
      const studentDues = getStudentDues(studentId);
      
      await supabase.from('payment_blockage_log').insert({
        student_id: studentId,
        blocked_amount: attemptedAmount,
        outstanding_dues: studentDues?.totalDues || 0,
        reason: reason,
        academic_year_id: stableYearId
      });
    } catch (error) {
      console.error('Error logging payment blockage:', error);
    }
  };

  useEffect(() => {
    if (stableYearId) {
      fetchPreviousYearDues();
    }
  }, [stableYearId]);

  // Listen for payment events to trigger immediate refresh
  useEffect(() => {
    const handlePaymentRecorded = () => {
      console.log('🔄 Payment recorded event received, refreshing previous year dues...');
      fetchPreviousYearDues();
    };

    window.addEventListener('payment-recorded', handlePaymentRecorded);
    return () => window.removeEventListener('payment-recorded', handlePaymentRecorded);
  }, []);

  return {
    previousYearDues: Array.from(previousYearDues.values()),
    getStudentDues,
    hasOutstandingDues,
    logPaymentBlockage,
    loading,
    refetch: fetchPreviousYearDues
  };
}
