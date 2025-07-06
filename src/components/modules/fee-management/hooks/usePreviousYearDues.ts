
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

export function usePreviousYearDues(currentAcademicYearId: string) {
  const [previousYearDues, setPreviousYearDues] = useState<Map<string, PreviousYearDues>>(new Map());
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchPreviousYearDues = async () => {
    // Ensure we have a valid string ID, not an object
    const yearId = typeof currentAcademicYearId === 'string' ? currentAcademicYearId : 
                   (currentAcademicYearId as any)?.id || '';
    
    if (!yearId || yearId === 'undefined') {
      console.log('⚠️ No valid current academic year ID provided');
      setPreviousYearDues(new Map());
      return;
    }
    
    setLoading(true);
    try {
      console.log('📅 Fetching previous year dues for current year:', yearId);
      
      // Get all academic years except current
      const { data: academicYears, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year_name')
        .neq('id', yearId)
        .order('start_date', { ascending: false });

      if (yearsError) {
        console.error('❌ Error fetching academic years:', yearsError);
        throw yearsError;
      }

      if (!academicYears || academicYears.length === 0) {
        console.log('⚠️ No previous academic years found');
        setPreviousYearDues(new Map());
        return;
      }

      const previousYearIds = academicYears.map(year => year.id);
      console.log('📋 Previous year IDs:', previousYearIds);

      // Fetch previous year dues from consolidated student_fee_records system only
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
          academic_years!inner(year_name)
        `)
        .in('academic_year_id', previousYearIds)
        .neq('status', 'Paid')
        .gt('balance_fee', 0);

      if (feeError) {
        console.error('❌ Error fetching fee data:', feeError);
        throw feeError;
      }

      console.log('✅ Fee data fetched:', feeData?.length || 0, 'records');

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
      const yearId = typeof currentAcademicYearId === 'string' ? currentAcademicYearId : 
                     (currentAcademicYearId as any)?.id || null;
      
      await supabase.from('payment_blockage_log').insert({
        student_id: studentId,
        blocked_amount: attemptedAmount,
        outstanding_dues: studentDues?.totalDues || 0,
        reason: reason,
        academic_year_id: yearId
      });
    } catch (error) {
      console.error('Error logging payment blockage:', error);
    }
  };

  useEffect(() => {
    fetchPreviousYearDues();
  }, [currentAcademicYearId]);

  return {
    previousYearDues: Array.from(previousYearDues.values()),
    getStudentDues,
    hasOutstandingDues,
    logPaymentBlockage,
    loading,
    refetch: fetchPreviousYearDues
  };
}
