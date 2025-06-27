
import { supabase } from "@/integrations/supabase/client";
import { Student } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const useStudentFetcher = () => {
  const { toast } = useToast();

  const fetchStudents = async (): Promise<Student[]> => {
    try {
      console.log('Fetching students with parent and financial information...');
      const { data, error } = await supabase
        .from("students")
        .select(`
          *,
          classes(id, name, section),
          student_parent_links(
            parents(
              id,
              first_name,
              last_name,
              relation,
              phone_number,
              email
            )
          ),
          fees(
            id,
            fee_type,
            amount,
            actual_amount,
            discount_amount,
            discount_notes,
            discount_updated_by,
            discount_updated_at,
            due_date,
            payment_date,
            receipt_number,
            status,
            created_at,
            updated_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      
      console.log('Fetched students with parents and fees:', data);
      
      // Transform the data to include parents array and financial calculations
      const typedStudents = (data || []).map(student => {
        const fees = student.fees || [];
        const totalPaid = fees
          .filter(fee => fee.status === 'Paid')
          .reduce((sum, fee) => sum + Number(fee.amount), 0);
        const totalPending = fees
          .filter(fee => fee.status === 'Pending' || fee.status === 'Overdue')
          .reduce((sum, fee) => sum + Number(fee.amount), 0);

        return {
          ...student,
          gender: student.gender as 'Male' | 'Female' | 'Other',
          status: student.status as 'Active' | 'Inactive' | 'Alumni',
          parents: student.student_parent_links?.map(link => ({
            ...link.parents,
            relation: link.parents.relation as 'Mother' | 'Father' | 'Guardian' | 'Other'
          })).filter(Boolean) || [],
          total_paid: totalPaid,
          total_pending: totalPending,
          fees: fees.map(fee => ({
            ...fee,
            student_id: student.id,
            status: fee.status as 'Pending' | 'Paid' | 'Overdue',
            actual_amount: fee.actual_amount || fee.amount,
            discount_amount: fee.discount_amount || 0,
            discount_notes: fee.discount_notes || null,
            discount_updated_by: fee.discount_updated_by || null,
            discount_updated_at: fee.discount_updated_at || null
          }))
        };
      });
      
      return typedStudents;
    } catch (error: any) {
      console.error('fetchStudents error:', error);
      toast({
        title: "Error fetching students",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { fetchStudents };
};
