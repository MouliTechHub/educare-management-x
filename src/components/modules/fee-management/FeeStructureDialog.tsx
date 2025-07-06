
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Class, AcademicYear } from "@/types/database";

interface FeeStructureFormData {
  class_id: string;
  academic_year_id: string;
  fee_type: string;
  amount: number;
  frequency: string;
  description: string;
}

interface FeeStructureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  classes: Class[];
  academicYears: AcademicYear[];
}

const FEE_TYPES = [
  'Tuition Fee',
  'Transport Fee', 
  'Meals Fee',
  'Books Fee',
  'Uniform Fee',
  'Activities Fee',
  'Laboratory Fee',
  'Library Fee',
  'Sports Fee',
  'Development Fee',
  'Exam Fee',
  'Other Fee'
];

const FREQUENCIES = [
  'Monthly',
  'Quarterly', 
  'Annually',
  'One Time'
];

export function FeeStructureDialog({ 
  open, 
  onOpenChange, 
  onSuccess, 
  classes,
  academicYears 
}: FeeStructureDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FeeStructureFormData>({
    defaultValues: {
      class_id: "",
      academic_year_id: "",
      fee_type: "Tuition Fee",
      amount: 0,
      frequency: "Monthly",
      description: "",
    },
  });

  const onSubmit = async (data: FeeStructureFormData) => {
    setLoading(true);
    try {
      // Check if fee structure already exists
      const { data: existing, error: checkError } = await supabase
        .from('fee_structures')
        .select('id')
        .eq('class_id', data.class_id)
        .eq('academic_year_id', data.academic_year_id)
        .eq('fee_type', data.fee_type)
        .eq('is_active', true)
        .maybeSingle();

      if (checkError) throw checkError;

      if (existing) {
        toast({
          title: "Fee structure already exists",
          description: "A fee structure for this class, academic year, and fee type already exists.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Create new fee structure
      const { error } = await supabase
        .from('fee_structures')
        .insert({
          class_id: data.class_id,
          academic_year_id: data.academic_year_id,
          fee_type: data.fee_type,
          amount: data.amount,
          frequency: data.frequency,
          description: data.description || null,
          is_active: true
        });

      if (error) throw error;

      // Auto-assign fees to students in this class for this academic year
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id')
        .eq('class_id', data.class_id)
        .eq('status', 'Active');

      if (studentsError) {
        console.warn('Could not fetch students for auto-assignment:', studentsError);
      } else if (students && students.length > 0) {
        // Check which students already have this fee type assigned
        const { data: existingFees, error: existingError } = await supabase
          .from('student_fee_records')
          .select('student_id')
          .eq('class_id', data.class_id)
          .eq('academic_year_id', data.academic_year_id)
          .eq('fee_type', data.fee_type);

        if (existingError) {
          console.warn('Error checking existing fees:', existingError);
        } else {
          const existingStudentIds = new Set(existingFees?.map(fee => fee.student_id) || []);
          const newStudentFees = students
            .filter(student => !existingStudentIds.has(student.id))
            .map(student => ({
              student_id: student.id,
              class_id: data.class_id,
              academic_year_id: data.academic_year_id,
              fee_type: data.fee_type,
              actual_fee: data.amount,
              discount_amount: 0,
              paid_amount: 0,
              due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
              status: 'Pending'
            }));

          if (newStudentFees.length > 0) {
            const { error: assignError } = await supabase
              .from('student_fee_records')
              .insert(newStudentFees);

            if (assignError) {
              console.warn('Error auto-assigning fees to students:', assignError);
            }
          }
        }
      }

      toast({
        title: "Fee structure created successfully",
        description: `Fee structure created and assigned to ${students?.length || 0} students.`,
      });

      onSuccess();
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Error creating fee structure:', error);
      toast({
        title: "Error creating fee structure",
        description: error.message || "Failed to create fee structure. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create Fee Structure</DialogTitle>
          <DialogDescription>
            Create a new fee structure for a class and academic year
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="class_id">Class</Label>
            <Select
              value={form.watch('class_id')}
              onValueChange={(value) => form.setValue('class_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- ${cls.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="academic_year_id">Academic Year</Label>
            <Select
              value={form.watch('academic_year_id')}
              onValueChange={(value) => form.setValue('academic_year_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="fee_type">Fee Type</Label>
            <Select
              value={form.watch('fee_type')}
              onValueChange={(value) => form.setValue('fee_type', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FEE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount">Amount (₹)</Label>
            <Input
              id="amount"
              type="number"
              min="0"
              step="0.01"
              {...form.register('amount', { valueAsNumber: true })}
            />
          </div>

          <div>
            <Label htmlFor="frequency">Frequency</Label>
            <Select
              value={form.watch('frequency')}
              onValueChange={(value) => form.setValue('frequency', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map((freq) => (
                  <SelectItem key={freq} value={freq}>
                    {freq}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Optional description for this fee structure"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Fee Structure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
