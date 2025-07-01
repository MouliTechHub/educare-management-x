
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

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

export function useFeeData() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      setAcademicYears(data || []);
      
      // Set current year as default
      const currentYear = data?.find(year => year.is_current);
      if (currentYear) {
        setCurrentAcademicYear(currentYear.id);
      } else if (data && data.length > 0) {
        setCurrentAcademicYear(data[0].id);
      }
    } catch (error: any) {
      console.error("Error fetching academic years:", error);
      toast({
        title: "Error fetching academic years",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const fetchFees = async () => {
    if (!currentAcademicYear) return;
    
    try {
      setLoading(true);
      
      // First, get the payment totals for each fee
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_history')
        .select('fee_id, amount_paid')
        .order('created_at', { ascending: true });

      if (paymentError) throw paymentError;

      // Calculate total paid per fee
      const paymentTotals = paymentData?.reduce((acc, payment) => {
        acc[payment.fee_id] = (acc[payment.fee_id] || 0) + payment.amount_paid;
        return acc;
      }, {} as Record<string, number>) || {};

      // Now fetch fees with student data
      const { data, error } = await supabase
        .from("fees")
        .select(`
          *,
          students!inner (
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

      if (error) throw error;

      // Transform and enrich the data
      const transformedFees: Fee[] = (data || []).map((fee: any) => {
        const totalPaidFromHistory = paymentTotals[fee.id] || 0;
        
        return {
          id: fee.id,
          student_id: fee.student_id,
          amount: fee.amount,
          actual_amount: fee.actual_amount,
          discount_amount: fee.discount_amount,
          total_paid: totalPaidFromHistory, // Use calculated total from payment history
          fee_type: fee.fee_type,
          due_date: fee.due_date,
          payment_date: fee.payment_date,
          status: fee.status,
          receipt_number: fee.receipt_number,
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
        };
      });

      setFees(transformedFees);
    } catch (error: any) {
      console.error("Error fetching fees:", error);
      toast({
        title: "Error fetching fee data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (currentAcademicYear) {
      fetchFees();
    }
  }, [currentAcademicYear]);

  const refetchFees = () => {
    fetchFees();
  };

  return {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    loading,
    refetchFees
  };
}
