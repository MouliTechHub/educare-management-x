
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useStudentFeeCreator = () => {
  const { toast } = useToast();

  const createDefaultFeeRecords = async (studentId: string, classId?: string | null) => {
    try {
      console.log('Creating default fee records for student:', studentId);
      
      // Indian school fee structure - more comprehensive
      const defaultFees = [
        {
          student_id: studentId,
          fee_type: "Tuition Fee",
          amount: 8000,
          actual_amount: 8000,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Development Fee",
          amount: 2000,
          actual_amount: 2000,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Library Fee",
          amount: 500,
          actual_amount: 500,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Laboratory Fee",
          amount: 1000,
          actual_amount: 1000,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Sports Fee",
          amount: 800,
          actual_amount: 800,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Computer Fee",
          amount: 1200,
          actual_amount: 1200,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString().split('T')[0],
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Examination Fee",
          amount: 600,
          actual_amount: 600,
          discount_amount: 0,
          due_date: new Date(new Date().getFullYear(), 2, 15).toISOString().split('T')[0], // March 15th for annual exams
          status: "Pending"
        },
        {
          student_id: studentId,
          fee_type: "Activity Fee",
          amount: 400,
          actual_amount: 400,
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

      console.log('Indian school fee records created successfully');
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
