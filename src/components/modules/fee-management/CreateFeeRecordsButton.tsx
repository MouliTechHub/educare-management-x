
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CreateFeeRecordsButtonProps {
  academicYearId: string;
  onRecordsCreated: () => void;
}

export function CreateFeeRecordsButton({ academicYearId, onRecordsCreated }: CreateFeeRecordsButtonProps) {
  const [isCreating, setIsCreating] = useState(false);
  const { toast } = useToast();

  const createFeeRecords = async () => {
    setIsCreating(true);
    try {
      console.log('Creating fee records for academic year:', academicYearId);

      // First, get all students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, class_id, first_name, last_name');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log('Found students:', students);

      if (!students || students.length === 0) {
        toast({
          title: "No students found",
          description: "Please add students first before creating fee records.",
          variant: "destructive",
        });
        return;
      }

      // Get fee structures for the academic year
      const { data: feeStructures, error: feeError } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('academic_year_id', academicYearId)
        .eq('is_active', true);

      if (feeError) {
        console.error('Error fetching fee structures:', feeError);
        throw feeError;
      }

      console.log('Found fee structures:', feeStructures);

      if (!feeStructures || feeStructures.length === 0) {
        toast({
          title: "No fee structures found",
          description: "Please set up fee structures for this academic year first.",
          variant: "destructive",
        });
        return;
      }

      // Create fee records for each student
      const feeRecordsToCreate = [];
      
      for (const student of students) {
        // Find tuition fee structure for this student's class
        const tuitionFee = feeStructures.find(fs => 
          fs.class_id === student.class_id && 
          fs.fee_type === 'Tuition'
        );

        if (tuitionFee) {
          // Check if record already exists
          const { data: existingRecord } = await supabase
            .from('student_fee_records')
            .select('id')
            .eq('student_id', student.id)
            .eq('academic_year_id', academicYearId)
            .eq('fee_type', 'Tuition Fee')
            .single();

          if (!existingRecord) {
            feeRecordsToCreate.push({
              student_id: student.id,
              class_id: student.class_id,
              academic_year_id: academicYearId,
              fee_type: 'Tuition Fee',
              actual_fee: tuitionFee.amount,
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
              status: 'Pending'
            });
          }
        }
      }

      if (feeRecordsToCreate.length === 0) {
        toast({
          title: "No new records to create",
          description: "All students already have fee records for this academic year.",
        });
        return;
      }

      console.log('Creating fee records:', feeRecordsToCreate);

      const { error: insertError } = await supabase
        .from('student_fee_records')
        .insert(feeRecordsToCreate);

      if (insertError) {
        console.error('Error inserting fee records:', insertError);
        throw insertError;
      }

      toast({
        title: "Fee records created successfully",
        description: `Created ${feeRecordsToCreate.length} fee record(s) for students.`,
      });

      onRecordsCreated();

    } catch (error: any) {
      console.error('Error creating fee records:', error);
      toast({
        title: "Error creating fee records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Button
      onClick={createFeeRecords}
      disabled={isCreating}
      className="bg-green-600 hover:bg-green-700 text-white"
    >
      {isCreating ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <PlusCircle className="w-4 h-4 mr-2" />
      )}
      {isCreating ? 'Creating...' : 'Create Fee Records'}
    </Button>
  );
}
