
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: string;
  classes?: {
    name: string;
    section: string | null;
  };
}

interface FeeStructure {
  id: string;
  class_id: string;
  fee_type: string;
  amount: number;
  frequency: string;
  description: string | null;
}

export function useAutoFeeAssignment() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const assignFeesToStudents = async (academicYearId: string) => {
    if (!academicYearId) {
      toast({
        title: "Error",
        description: "Please select an academic year first",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🔄 Starting automatic fee assignment for academic year:', academicYearId);

      // Check if this is the current academic year
      const { data: currentYear } = await supabase
        .from('academic_years')
        .select('id, is_current')
        .eq('id', academicYearId)
        .single();

      let students = [];

      if (currentYear?.is_current) {
        // For current academic year, get all active students
        const { data: studentsData, error: studentsError } = await supabase
          .from("students")
          .select(`
            id,
            first_name,
            last_name,
            admission_number,
            class_id,
            classes (
              name,
              section
            )
          `)
          .eq("status", "Active");

        if (studentsError) throw studentsError;
        students = studentsData || [];
      } else {
        // For future years, only get students who have been promoted to this academic year
        const { data: promotedStudents, error: promotionError } = await supabase
          .from('student_promotions')
          .select(`
            student_id,
            to_class_id,
            students!inner (
              id,
              first_name,
              last_name,
              admission_number,
              status,
              classes (
                name,
                section
              )
            )
          `)
          .eq('to_academic_year_id', academicYearId)
          .eq('promotion_type', 'promoted')
          .eq('students.status', 'Active');

        if (promotionError) {
          console.warn('No promotions found for academic year:', academicYearId);
          students = [];
        } else {
          // Map promoted students with their new class information
          students = (promotedStudents || []).map(promotion => ({
            id: promotion.students.id,
            first_name: promotion.students.first_name,
            last_name: promotion.students.last_name,
            admission_number: promotion.students.admission_number,
            class_id: promotion.to_class_id, // Use the promoted class
            classes: promotion.students.classes
          }));
        }
      }

      console.log('✅ Students eligible for fee assignment:', students.length);

      // Fetch all active fee structures for the academic year
      const { data: feeStructures, error: feeStructuresError } = await supabase
        .from("fee_structures")
        .select("*")
        .eq("academic_year_id", academicYearId)
        .eq("is_active", true);

      if (feeStructuresError) throw feeStructuresError;

      console.log('✅ Fetched fee structures:', feeStructures?.length || 0);

      // Group fee structures by class_id
      const feeStructuresByClass = feeStructures?.reduce((acc, structure) => {
        if (!acc[structure.class_id]) {
          acc[structure.class_id] = [];
        }
        acc[structure.class_id].push(structure);
        return acc;
      }, {} as Record<string, FeeStructure[]>) || {};

      // Fetch existing fee records to avoid duplicates
      const { data: existingFees, error: existingFeesError } = await supabase
        .from("fees")
        .select("student_id, fee_type")
        .eq("academic_year_id", academicYearId);

      if (existingFeesError) throw existingFeesError;

      // Create a set of existing fee combinations for quick lookup
      const existingFeeSet = new Set(
        existingFees?.map(fee => `${fee.student_id}-${fee.fee_type}`) || []
      );

      console.log('✅ Existing fee records:', existingFees?.length || 0);

      // Prepare fee records to insert
      const feeRecordsToInsert = [];
      let assignmentCount = 0;

      for (const student of students) {
        const classStructures = feeStructuresByClass[student.class_id] || [];
        
        for (const structure of classStructures) {
          const feeKey = `${student.id}-${structure.fee_type}`;
          
          // Skip if fee already exists
          if (existingFeeSet.has(feeKey)) {
            continue;
          }

          // Calculate due date (30 days from now)
          const dueDate = new Date();
          dueDate.setDate(dueDate.getDate() + 30);

          feeRecordsToInsert.push({
            student_id: student.id,
            amount: structure.amount,
            actual_amount: structure.amount,
            discount_amount: 0,
            total_paid: 0,
            fee_type: structure.fee_type,
            due_date: dueDate.toISOString().split('T')[0],
            status: 'Pending',
            academic_year_id: academicYearId
          });

          assignmentCount++;
        }
      }

      console.log('📋 Fee records to insert:', feeRecordsToInsert.length);

      // Insert fee records in batches
      if (feeRecordsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("fees")
          .insert(feeRecordsToInsert);

        if (insertError) throw insertError;
      }

      toast({
        title: "Success",
        description: `Successfully assigned ${assignmentCount} fee records to students`,
      });

      console.log('✅ Auto fee assignment completed successfully');
      return true;

    } catch (error: any) {
      console.error("❌ Error in auto fee assignment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to assign fees automatically",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    assignFeesToStudents,
    loading
  };
}
