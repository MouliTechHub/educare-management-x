
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
          student_fee_records:student_fee_records!student_fee_records_student_id_fkey(
            id,
            fee_type,
            actual_fee,
            discount_amount,
            paid_amount,
            discount_notes,
            discount_updated_by,
            discount_updated_at,
            due_date,
            status,
            academic_year_id,
            created_at,
            updated_at
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching students:', error);
        throw error;
      }
      
      console.log('Fetched students with parents and fee records:', data);
      
      // Transform the data to include parents array and financial calculations
      const typedStudents = (data || []).map(student => {
        const feeRecords = student.student_fee_records || [];
        const totalPaid = feeRecords
          .reduce((sum, fee) => sum + Number(fee.paid_amount || 0), 0);
        const totalPending = feeRecords
          .reduce((sum, fee) => {
            const finalFee = Number(fee.actual_fee || 0) - Number(fee.discount_amount || 0);
            const balance = finalFee - Number(fee.paid_amount || 0);
            return sum + Math.max(0, balance);
          }, 0);

        // Convert student_fee_records to fees format for backward compatibility
        const fees = feeRecords.map(feeRecord => ({
          id: feeRecord.id,
          student_id: student.id,
          fee_type: feeRecord.fee_type,
          amount: feeRecord.actual_fee,
          actual_amount: feeRecord.actual_fee,
          discount_amount: feeRecord.discount_amount || 0,
          total_paid: feeRecord.paid_amount || 0,
          discount_notes: feeRecord.discount_notes || null,
          discount_updated_by: feeRecord.discount_updated_by || null,
          discount_updated_at: feeRecord.discount_updated_at || null,
          due_date: feeRecord.due_date || '',
          payment_date: null, // This would come from payment records
          receipt_number: null, // This would come from payment records
          status: feeRecord.status as 'Pending' | 'Paid' | 'Overdue',
          academic_year_id: feeRecord.academic_year_id,
          created_at: feeRecord.created_at,
          updated_at: feeRecord.updated_at
        }));

        return {
          ...student,
          gender: student.gender as 'Male' | 'Female' | 'Other',
          status: student.status as 'Active' | 'Inactive' | 'Alumni',
          caste_category: student.caste_category as 'SC' | 'ST' | 'OC' | 'BC-A' | 'BC-B' | 'BC-C' | 'BC-D' | 'BC-E' | 'EWS' | null,
          mother_tongue: student.mother_tongue || null,
          nationality: student.nationality || 'Indian',
          transfer_certificate: student.transfer_certificate || null,
          parents: student.student_parent_links?.map(link => ({
            ...link.parents,
            relation: link.parents.relation as 'Mother' | 'Father' | 'Guardian' | 'Other'
          })).filter(Boolean) || [],
          total_paid: totalPaid,
          total_pending: totalPending,
          fees: fees
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
