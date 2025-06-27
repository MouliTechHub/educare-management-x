
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useStudentFeeCreator = () => {
  const { toast } = useToast();

  const createDefaultFeeRecords = async (studentId: string, classId?: string | null) => {
    try {
      console.log('Creating default fee records for student:', studentId);
      
      // Create default fee records for common fee types
      const defaultFees = [
        {
          student_id: studentId,
          fee_type: "Tuition",
          amount: 5000,
          actual_amount: 5000,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0], // Next month 10th
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Library",
          amount: 500,
          actual_amount: 500,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Sports",
          amount: 1000,
          actual_amount: 1000,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        }
      ];

      const { error } = await supabase
        .from("fees")
        .insert(defaultFees);

      if (error) {
        console.error('Error creating default fee records:', error);
        throw error;
      }

      console.log('Default fee records created successfully');
    } catch (error: any) {
      console.error("Error creating default fee records:", error);
      toast({
        title: "Fee Records Creation Error",
        description: "Default fee records could not be created for the student.",
        variant: "destructive",
      });
    }
  };

  return { createDefaultFeeRecords };
};
