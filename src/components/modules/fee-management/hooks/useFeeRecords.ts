
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Fee {
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

export function useFeeRecords(currentAcademicYear: string) {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFees = async () => {
    if (!currentAcademicYear) {
      console.log('⚠️ No academic year selected, skipping fee fetch');
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      console.log('🔄 Fetching fees for academic year:', currentAcademicYear);
      
      // Fetch from consolidated student_fee_records table only
      const { data, error } = await supabase
        .from("student_fee_records")
        .select(`
          *,
          students!fk_sfr_student (
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
        .order("created_at", { ascending: false });

      if (error) {
        console.error('❌ Error fetching fees:', error);
        throw error;
      }

      console.log('✅ Raw fee data fetched:', data?.length || 0, 'records');
      
      if (data && data.length > 0) {
        console.log('📋 Sample fee record structure:', {
          id: data[0].id,
          student_id: data[0].student_id,
          hasStudent: !!data[0].students,
          studentName: data[0].students ? `${data[0].students.first_name} ${data[0].students.last_name}` : 'No student data'
        });
      }

      // Transform the data to match the expected interface
      const transformedFees: Fee[] = (data || []).map((fee: any) => ({
        id: fee.id,
        student_id: fee.student_id,
        amount: fee.actual_fee,
        actual_amount: fee.actual_fee,
        discount_amount: fee.discount_amount,
        total_paid: fee.paid_amount,
        fee_type: fee.fee_type,
        due_date: fee.due_date,
        payment_date: null, // This field doesn't exist in student_fee_records
        status: fee.status,
        receipt_number: null, // This field doesn't exist in student_fee_records
        created_at: fee.created_at,
        updated_at: fee.updated_at,
        discount_notes: fee.discount_notes,
        discount_updated_by: fee.discount_updated_by,
        discount_updated_at: fee.discount_updated_at,
        academic_year_id: fee.academic_year_id,
        student: fee.students ? {
          id: fee.students.id,
          first_name: fee.students.first_name,
          last_name: fee.students.last_name,
          admission_number: fee.students.admission_number,
          class_name: fee.students.classes?.name,
          section: fee.students.classes?.section,
          class_id: fee.students.class_id
        } : undefined
      }));

      console.log('✅ Transformed fees:', transformedFees.length, 'records');
      console.log('📊 Fees with student data:', transformedFees.filter(f => f.student).length);
      setFees(transformedFees);
    } catch (error: any) {
      console.error("❌ Error fetching fees:", error);
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
      fetchFees();
    } else {
      setLoading(false);
    }
  }, [currentAcademicYear]);

  const refetchFees = () => {
    console.log('🔄 Manually refreshing fees...');
    fetchFees();
  };

  return {
    fees,
    loading,
    refetchFees
  };
}
