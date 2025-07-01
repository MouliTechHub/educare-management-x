
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

      // First, get all active students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, 
          class_id, 
          first_name, 
          last_name,
          status,
          classes(id, name, section)
        `)
        .eq('status', 'Active');

      if (studentsError) {
        console.error('Error fetching students:', studentsError);
        throw studentsError;
      }

      console.log('Found active students:', students?.length || 0);

      if (!students || students.length === 0) {
        toast({
          title: "No active students found",
          description: "Please add students first before creating fee records.",
          variant: "destructive",
        });
        return;
      }

      // Delete any existing records for this academic year to start fresh
      console.log('Cleaning existing records for academic year:', academicYearId);
      await supabase
        .from('student_fee_records')
        .delete()
        .eq('academic_year_id', academicYearId);

      // Get unique class IDs
      const uniqueClassIds = [...new Set(students.map(s => s.class_id))];
      console.log('Unique class IDs:', uniqueClassIds);

      // Create fee structures for each class if they don't exist
      for (const classId of uniqueClassIds) {
        const { data: existingStructure } = await supabase
          .from('fee_structures')
          .select('id')
          .eq('class_id', classId)
          .eq('academic_year_id', academicYearId)
          .eq('fee_type', 'Tuition')
          .eq('is_active', true)
          .single();

        if (!existingStructure) {
          console.log(`Creating fee structure for class ${classId}`);
          const { error: createError } = await supabase
            .from('fee_structures')
            .insert({
              class_id: classId,
              academic_year_id: academicYearId,
              fee_type: 'Tuition',
              amount: 5000,
              frequency: 'Monthly',
              description: 'Default tuition fee',
              is_active: true
            });

          if (createError) {
            console.error('Error creating fee structure:', createError);
          }
        }
      }

      // Create fee records for all students
      const feeRecordsToCreate = students.map(student => ({
        student_id: student.id,
        class_id: student.class_id,
        academic_year_id: academicYearId,
        fee_type: 'Tuition Fee',
        actual_fee: 5000,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'Pending'
      }));

      console.log(`Creating ${feeRecordsToCreate.length} fee records`);

      const { error: insertError } = await supabase
        .from('student_fee_records')
        .insert(feeRecordsToCreate);

      if (insertError) {
        console.error('Error inserting fee records:', insertError);
        throw insertError;
      }

      toast({
        title: "Fee records created successfully",
        description: `Created ${feeRecordsToCreate.length} fee record(s) for ${students.length} student(s).`,
      });

      onRecordsCreated();

    } catch (error: any) {
      console.error('Error creating fee records:', error);
      toast({
        title: "Error creating fee records",
        description: error.message || "An unexpected error occurred",
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
