
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

export function useFeeRecords(academicYearId?: string) {
  const [feeRecords, setFeeRecords] = useState<StudentFeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchFeeRecords = async (yearId?: string) => {
    if (!yearId) {
      console.log('No academic year ID provided, skipping fee records fetch');
      setFeeRecords([]);
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching fee records for academic year:', yearId);
      setLoading(true);
      
      // First try to get fee records with full student data
      const { data, error } = await supabase
        .from("student_fee_records")
        .select(`
          *,
          students!inner(
            id, 
            first_name, 
            last_name, 
            admission_number,
            classes(name, section)
          )
        `)
        .eq('academic_year_id', yearId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error('Error fetching fee records:', error);
        throw error;
      }

      console.log('Fee records fetched successfully:', data?.length || 0);

      // If no records found, check if we have students without fee records
      if (!data || data.length === 0) {
        console.log('No fee records found, checking for students without records...');
        
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select(`
            id, 
            first_name, 
            last_name, 
            admission_number,
            class_id,
            status,
            classes(id, name, section)
          `)
          .eq('status', 'Active');

        if (studentsError) {
          console.error('Error fetching students:', studentsError);
        } else {
          console.log('Found students without fee records:', studentsData?.length || 0);
          
          if (studentsData && studentsData.length > 0) {
            toast({
              title: "No fee records found",
              description: `Found ${studentsData.length} students without fee records. Please create fee records first.`,
              variant: "destructive",
            });
          }
        }
      }

      const enhancedRecords: StudentFeeRecord[] = (data || []).map(record => ({
        ...record,
        status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
        student: {
          id: record.students.id,
          first_name: record.students.first_name,
          last_name: record.students.last_name,
          admission_number: record.students.admission_number,
          class_name: record.students.classes?.name || 'Unknown Class',
          section: record.students.classes?.section || '',
        }
      }));

      setFeeRecords(enhancedRecords);
      
    } catch (error: any) {
      console.error('Error fetching fee records:', error);
      toast({
        title: "Error fetching fee records",
        description: error.message,
        variant: "destructive",
      });
      setFeeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (academicYearId) {
      fetchFeeRecords(academicYearId);
    }
  }, [academicYearId]);

  return {
    feeRecords,
    loading,
    refetchFeeRecords: () => fetchFeeRecords(academicYearId)
  };
}
