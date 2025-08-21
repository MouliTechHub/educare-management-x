
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useYearScopedCache } from "./useYearScopedCache";

export interface PreviousYearDues {
  studentId: string;
  totalDues: number;
  duesDetails: {
    academicYear: string;
    feeType: string;
    balanceAmount: number;
  }[];
}

export interface PYDSummaryData {
  studentsWithDues: number;
  totalOutstanding: number;
  avgPerStudent: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
}

export function usePreviousYearDues(currentAcademicYearId: string | any) {
  const [previousYearDues, setPreviousYearDues] = useState<Map<string, PreviousYearDues>>(new Map());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { invalidateYearCache, invalidateAfterPayment } = useYearScopedCache();

  // Stabilize the currentAcademicYearId to prevent infinite re-renders
  const stableYearId = typeof currentAcademicYearId === 'string' 
    ? currentAcademicYearId 
    : (currentAcademicYearId as any)?.id || '';

  // ✅ FIX: Always call useQuery to maintain consistent hook count
  const { data: summaryData = {
    studentsWithDues: 0,
    totalOutstanding: 0,
    avgPerStudent: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0
  }, error: summaryError } = useQuery({
    queryKey: ['pyd-summary', stableYearId || 'no-year'],
    queryFn: async () => {
      if (!stableYearId || stableYearId === 'undefined') {
        return {
          studentsWithDues: 0,
          totalOutstanding: 0,
          avgPerStudent: 0,
          highCount: 0,
          mediumCount: 0,
          lowCount: 0
        };
      }

      console.log('📅 Fetching PYD summary for year:', stableYearId);
      
      const { data: summary, error: summaryError } = await supabase
        .rpc('get_pyd_summary', { p_year: stableYearId });

      if (summaryError) {
        console.error('❌ Error fetching PYD summary:', summaryError);
        throw summaryError;
      }

      return summary?.[0] ? {
        studentsWithDues: summary[0].students_with_dues || 0,
        totalOutstanding: Number(summary[0].total_outstanding) || 0,
        avgPerStudent: Number(summary[0].avg_per_student) || 0,
        highCount: summary[0].high_count || 0,
        mediumCount: summary[0].medium_count || 0,
        lowCount: summary[0].low_count || 0
      } : {
        studentsWithDues: 0,
        totalOutstanding: 0,
        avgPerStudent: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0
      };
    },
    staleTime: 30000, // 30 seconds
  });

  const fetchPreviousYearDues = async () => {
    if (!stableYearId || stableYearId === 'undefined') {
      console.log('⚠️ No valid current academic year ID provided');
      setPreviousYearDues(new Map());
      return;
    }
    
    setLoading(true);
    try {
      console.log('📅 Fetching PYD details for current year:', stableYearId);
      
      // ✅ FIX: Query PYD records using explicit relationship name to avoid ambiguity
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
          academic_years!student_fee_records_academic_year_id_fkey(year_name)
        `)
        .eq('academic_year_id', stableYearId)
        .eq('fee_type', 'Previous Year Dues')
        .gt('balance_fee', 0);

      if (feeError) {
        console.error('❌ Error fetching PYD data:', feeError);
        throw feeError;
      }

      console.log('✅ Previous Year Dues records fetched:', feeData?.length || 0, 'records');

      // Group dues by student using canonical calculation
      const studentDuesMap = new Map<string, PreviousYearDues>();

      (feeData || []).forEach((fee: any) => {
        // Use canonical outstanding calculation
        const balanceAmount = Math.max(
          0,
          (fee.actual_fee || 0) - (fee.paid_amount || 0) - (fee.discount_amount || 0)
        );
        
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

  const refetch = () => {
    console.log('🔄 Manually refreshing previous year dues...');
    // Invalidate React Query cache for this year using year-scoped cache
    invalidateYearCache(stableYearId, ['pyd-summary', 'pyd-list']);
    fetchPreviousYearDues();
  };

  useEffect(() => {
    if (stableYearId) {
      fetchPreviousYearDues();
    }
  }, [stableYearId]);

  // Listen for payment events to trigger immediate refresh
  useEffect(() => {
    const handlePaymentRecorded = (event: CustomEvent) => {
      console.log('🔄 Payment recorded event received, refreshing previous year dues...', event.detail);
      invalidateYearCache(stableYearId, ['pyd-summary', 'pyd-list']);
      fetchPreviousYearDues();
    };

    const handlePYDPaymentRecorded = (event: CustomEvent) => {
      console.log('🔄 PYD payment recorded, targeted refresh...', event.detail);
      if (event.detail.yearId === stableYearId) {
        invalidateYearCache(stableYearId, ['pyd-summary', 'pyd-list']);
        fetchPreviousYearDues();
      }
    };

    window.addEventListener('payment-recorded', handlePaymentRecorded as EventListener);
    window.addEventListener('pyd-payment-recorded', handlePYDPaymentRecorded as EventListener);
    
    return () => {
      window.removeEventListener('payment-recorded', handlePaymentRecorded as EventListener);
      window.removeEventListener('pyd-payment-recorded', handlePYDPaymentRecorded as EventListener);
    };
  }, [stableYearId, invalidateYearCache]);

  return {
    previousYearDues: Array.from(previousYearDues.values()),
    summaryData,
    getStudentDues,
    hasOutstandingDues,
    logPaymentBlockage,
    loading,
    refetch
  };
}
