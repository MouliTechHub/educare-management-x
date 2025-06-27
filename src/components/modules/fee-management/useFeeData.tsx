
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentBasic } from "@/types/database";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
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
  student?: StudentBasic & {
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

export function useFeeData() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select(`
          *,
          students!inner(
            id, 
            first_name, 
            last_name, 
            admission_number,
            class_id,
            classes(name, section),
            student_parent_links(
              parents(phone_number, email)
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const feesWithStudents = (data || []).map(fee => ({
        ...fee,
        status: fee.status as 'Pending' | 'Paid' | 'Overdue',
        student: {
          ...fee.students,
          class_name: fee.students.classes?.name,
          section: fee.students.classes?.section,
          parent_phone: fee.students.student_parent_links?.[0]?.parents?.phone_number,
          parent_email: fee.students.student_parent_links?.[0]?.parents?.email,
          class_id: fee.students.class_id,
        }
      }));

      setFees(feesWithStudents);
    } catch (error: any) {
      toast({
        title: "Error fetching fees",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFees();
    
    // Set up real-time subscription for fee updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fees'
        },
        () => {
          console.log('Fee data changed, refreshing...');
          fetchFees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    fees,
    loading,
    refetchFees: fetchFees
  };
}
