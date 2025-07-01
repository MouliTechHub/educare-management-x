
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

      // First, get all students with their class information
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, 
          class_id, 
          first_name, 
          last_name,
          classes(id, name, section)
        `);

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

      // Check if fee structures exist for this academic year
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
          description: "Please set up fee structures for this academic year first in Fee Structure Management.",
          variant: "destructive",
        });
        return;
      }

      // Create fee records for each student
      const feeRecordsToCreate = [];
      let studentsProcessed = 0;
      let recordsSkipped = 0;
      
      for (const student of students) {
        console.log(`Processing student: ${student.first_name} ${student.last_name} (Class: ${student.class_id})`);
        
        // Find fee structures for this student's class
        const classFeeStructures = feeStructures.filter(fs => fs.class_id === student.class_id);
        
        if (classFeeStructures.length === 0) {
          console.log(`No fee structures found for class ${student.class_id}`);
          continue;
        }

        for (const feeStructure of classFeeStructures) {
          // Check if record already exists
          const { data: existingRecord } = await supabase
            .from('student_fee_records')
            .select('id')
            .eq('student_id', student.id)
            .eq('academic_year_id', academicYearId)
            .eq('fee_type', feeStructure.fee_type)
            .single();

          if (existingRecord) {
            console.log(`Fee record already exists for student ${student.id}, fee type ${feeStructure.fee_type}`);
            recordsSkipped++;
            continue;
          }

          // Calculate due date (30 days from now)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          feeRecordsToCreate.push({
            student_id: student.id,
            class_id: student.class_id,
            academic_year_id: academicYearId,
            fee_type: feeStructure.fee_type,
            actual_fee: feeStructure.amount,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'Pending'
          });
        }
        
        studentsProcessed++;
      }

      console.log(`Processed ${studentsProcessed} students, creating ${feeRecordsToCreate.length} fee records, skipped ${recordsSkipped} existing records`);

      if (feeRecordsToCreate.length === 0) {
        if (recordsSkipped > 0) {
          toast({
            title: "No new records to create",
            description: `All students already have fee records for this academic year. Found ${recordsSkipped} existing records.`,
          });
        } else {
          toast({
            title: "No fee records created",
            description: "No matching fee structures found for the current students' classes.",
            variant: "destructive",
          });
        }
        return;
      }

      // Insert the fee records
      const { error: insertError } = await supabase
        .from('student_fee_records')
        .insert(feeRecordsToCreate);

      if (insertError) {
        console.error('Error inserting fee records:', insertError);
        throw insertError;
      }

      toast({
        title: "Fee records created successfully",
        description: `Created ${feeRecordsToCreate.length} fee record(s) for ${studentsProcessed} student(s).`,
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
