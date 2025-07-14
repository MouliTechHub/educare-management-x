import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface FeeWithDues {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  previous_year_dues: number;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

export function useFeeRecordsWithDues(currentAcademicYear: string) {
  const [fees, setFees] = useState<FeeWithDues[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeesWithDues = async () => {
    if (!currentAcademicYear) {
      console.log('⚠️ No academic year selected, skipping fee fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Fetching fees with previous year dues for academic year:', currentAcademicYear);
      
      // Group students by their current year fees and calculate previous year dues
      const studentFeesMap = new Map();
      
      // First, get all current year fees (excluding Previous Year Dues)
      const { data: currentYearFees, error: currentError } = await supabase
        .from("student_fee_records")
        .select(`
          *,
          students (
            id,
            first_name,
            last_name,
            admission_number,
            class_id,
            classes (
              name,
              section
            )
          )
        `)
        .eq("academic_year_id", currentAcademicYear)
        .neq("fee_type", "Previous Year Dues")
        .order("created_at", { ascending: false });

      if (currentError) {
        console.error('❌ Error fetching current year fees:', currentError);
        throw currentError;
      }

      // Then get all previous year dues for the same students
      const { data: previousYearDues, error: duesError } = await supabase
        .from("student_fee_records")
        .select("student_id, balance_fee")
        .eq("academic_year_id", currentAcademicYear)
        .eq("fee_type", "Previous Year Dues");

      if (duesError) {
        console.warn('⚠️ Error fetching previous year dues:', duesError);
      }

      // Create a map of student_id to previous year dues amount
      const duesMap = new Map();
      previousYearDues?.forEach(due => {
        duesMap.set(due.student_id, due.balance_fee || 0);
      });

      console.log('✅ Current year fees fetched:', currentYearFees?.length || 0, 'records');
      console.log('✅ Previous year dues fetched for', duesMap.size, 'students');
      
      // Transform the data and merge with previous year dues
      const feesWithDues: FeeWithDues[] = (currentYearFees || []).map((fee: any) => {
        const previousDues = duesMap.get(fee.student_id) || 0;

        return {
          id: fee.id,
          student_id: fee.student_id,
          amount: fee.actual_fee,
          actual_amount: fee.actual_fee,
          discount_amount: fee.discount_amount,
          total_paid: fee.paid_amount,
          fee_type: fee.fee_type,
          due_date: fee.due_date,
          payment_date: null,
          status: fee.status as 'Pending' | 'Paid' | 'Overdue',
          receipt_number: null,
          created_at: fee.created_at,
          updated_at: fee.updated_at,
          discount_notes: fee.discount_notes,
          discount_updated_by: fee.discount_updated_by,
          discount_updated_at: fee.discount_updated_at,
          academic_year_id: fee.academic_year_id,
          previous_year_dues: previousDues,
          student: fee.students ? {
            id: fee.students.id,
            first_name: fee.students.first_name,
            last_name: fee.students.last_name,
            admission_number: fee.students.admission_number,
            class_name: fee.students.classes?.name,
            section: fee.students.classes?.section,
            class_id: fee.students.class_id
          } : undefined
        };
      });

      console.log('✅ Fees with previous year dues processed:', feesWithDues.length, 'records');
      setFees(feesWithDues);
    } catch (error: any) {
      console.error("❌ Error fetching fees with dues:", error);
      toast({
        title: "Error fetching fee data",
        description: error.message,
        variant: "destructive",
      });
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentAcademicYear) {
      fetchFeesWithDues();
    } else {
      setLoading(false);
    }
  }, [currentAcademicYear]);

  // Set up real-time subscription for fee record updates
  useEffect(() => {
    if (!currentAcademicYear) return;

    const channel = supabase
      .channel('fees-with-dues-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'student_fee_records',
          filter: `academic_year_id=eq.${currentAcademicYear}`
        },
        (payload) => {
          console.log('🔄 Real-time update for fees with dues:', payload);
          fetchFeesWithDues();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fee_payment_records'
        },
        (payload) => {
          console.log('💰 Payment update affecting fees with dues:', payload);
          fetchFeesWithDues();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentAcademicYear]);

  const refetchFees = () => {
    console.log('🔄 Manually refreshing fees with dues...');
    fetchFeesWithDues();
  };

  return {
    fees,
    loading,
    refetchFees
  };
}