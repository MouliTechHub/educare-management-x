
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

      console.log('Raw fee records data:', data);

      // If no records found, try to create them automatically
      if (!data || data.length === 0) {
        console.log('No fee records found, attempting to create them...');
        await createMissingFeeRecords(yearId);
        
        // Retry fetching after creation
        const { data: retryData, error: retryError } = await supabase
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

        if (retryError) {
          console.error('Error on retry fetch:', retryError);
        } else {
          console.log('Retry fetch successful:', retryData?.length || 0);
          const enhancedRecords = (retryData || []).map(mapToStudentFeeRecord);
          setFeeRecords(enhancedRecords);
          setLoading(false);
          return;
        }
      }

      const enhancedRecords = (data || []).map(mapToStudentFeeRecord);
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

  const mapToStudentFeeRecord = (record: any): StudentFeeRecord => ({
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
  });

  const createMissingFeeRecords = async (yearId: string) => {
    try {
      console.log('Creating missing fee records...');
      
      // Get all active students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, class_id, first_name, last_name')
        .eq('status', 'Active');

      if (studentsError) throw studentsError;
      
      console.log(`Found ${students?.length || 0} active students`);

      if (!students || students.length === 0) return;

      // Create fee structures if they don't exist
      const uniqueClassIds = [...new Set(students.map(s => s.class_id))];
      
      for (const classId of uniqueClassIds) {
        const { data: existingStructure } = await supabase
          .from('fee_structures')
          .select('id')
          .eq('class_id', classId)
          .eq('academic_year_id', yearId)
          .eq('fee_type', 'Tuition')
          .single();

        if (!existingStructure) {
          console.log(`Creating fee structure for class ${classId}`);
          await supabase
            .from('fee_structures')
            .insert({
              class_id: classId,
              academic_year_id: yearId,
              fee_type: 'Tuition',
              amount: 5000,
              frequency: 'Monthly',
              description: 'Default tuition fee',
              is_active: true
            });
        }
      }

      // Create fee records for students
      const feeRecordsToCreate = students.map(student => ({
        student_id: student.id,
        class_id: student.class_id,
        academic_year_id: yearId,
        fee_type: 'Tuition Fee',
        actual_fee: 5000,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'Pending'
      }));

      console.log(`Inserting ${feeRecordsToCreate.length} fee records`);
      
      const { error: insertError } = await supabase
        .from('student_fee_records')
        .insert(feeRecordsToCreate);

      if (insertError) {
        console.error('Error inserting fee records:', insertError);
        throw insertError;
      }

      console.log('Fee records created successfully');

    } catch (error) {
      console.error('Error creating missing fee records:', error);
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
