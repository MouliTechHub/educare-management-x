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
    if (!currentAcademicYearId) return;
    
    setLoading(true);
    try {
      // Get all academic years except current
      const { data: academicYears, error: yearsError } = await supabase
        .from('academic_years')
        .select('id, year_name')
        .neq('id', currentAcademicYearId)
        .order('start_date', { ascending: false });

      if (yearsError) throw yearsError;

      if (!academicYears || academicYears.length === 0) {
        setPreviousYearDues(new Map());
        return;
      }

      const previousYearIds = academicYears.map(year => year.id);

      // Fetch previous year dues from both fee systems
      const [enhancedFeesResult, legacyFeesResult] = await Promise.allSettled([
        // Enhanced system - student_fee_records
        supabase
          .from('student_fee_records')
          .select(`
            student_id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            academic_year_id,
            academic_years!inner(year_name)
          `)
          .in('academic_year_id', previousYearIds)
          .neq('status', 'Paid'),
        
        // Legacy system - fees table
        supabase
          .from('fees')
          .select(`
            student_id,
            fee_type,
            actual_amount,
            discount_amount,
            total_paid,
            academic_year_id,
            academic_years!inner(year_name)
          `)
          .in('academic_year_id', previousYearIds)
          .neq('status', 'Paid')
      ]);

      // Combine both result sets
      let allFeesData = [];
      
      if (enhancedFeesResult.status === 'fulfilled' && enhancedFeesResult.value.data) {
        allFeesData = [...enhancedFeesResult.value.data];
      }
      
      if (legacyFeesResult.status === 'fulfilled' && legacyFeesResult.value.data) {
        // Transform legacy fees to match enhanced format
        const transformedLegacyFees = legacyFeesResult.value.data.map((fee: any) => ({
          student_id: fee.student_id,
          fee_type: fee.fee_type,
          actual_fee: fee.actual_amount,
          discount_amount: fee.discount_amount,
          paid_amount: fee.total_paid,
          academic_year_id: fee.academic_year_id,
          academic_years: fee.academic_years
        }));
        allFeesData = [...allFeesData, ...transformedLegacyFees];
      }

      // Group dues by student
      const studentDuesMap = new Map<string, PreviousYearDues>();

      allFeesData.forEach((fee: any) => {
        const balanceAmount = fee.actual_fee - fee.discount_amount - fee.paid_amount;
        
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

      setPreviousYearDues(studentDuesMap);
    } catch (error: any) {
      console.error('Error fetching previous year dues:', error);
      toast({
        title: "Error",
        description: "Failed to fetch previous year dues",
        variant: "destructive",
      });
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
      await supabase.from('fee_change_history').insert({
        fee_record_id: studentId, // Using student_id as reference
        change_type: 'payment_blocked',
        amount: attemptedAmount,
        changed_by: 'System',
        notes: `Payment blocked: ${reason}`
      });
    } catch (error) {
      console.error('Error logging payment blockage:', error);
    }
  };

  const logDuesClearance = async (studentId: string, clearedAmount: number) => {
    try {
      await supabase.from('fee_change_history').insert({
        fee_record_id: studentId, // Using student_id as reference
        change_type: 'dues_cleared',
        amount: clearedAmount,
        changed_by: 'System',
        notes: 'Previous year dues cleared - current year payments now enabled'
      });
    } catch (error) {
      console.error('Error logging dues clearance:', error);
    }
  };

  useEffect(() => {
    fetchPreviousYearDues();
  }, [currentAcademicYearId]);

  return {
    previousYearDues,
    loading,
    getStudentDues,
    hasOutstandingDues,
    logPaymentBlockage,
    logDuesClearance,
    refetch: fetchPreviousYearDues
  };
}