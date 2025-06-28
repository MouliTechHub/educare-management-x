
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentBasic } from "@/types/database";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface FeeFormData {
  class_id: string;
  student_id: string;
  amount: number;
  fee_type: string;
  due_date: string;
}

interface FeeFormDialogProps {
  onFeeCreated: () => void;
}

// Valid fee types that match the database constraint
const VALID_FEE_TYPES = [
  { value: 'Tuition', label: 'Tuition Fee' },
  { value: 'Development', label: 'Development Fee' },
  { value: 'Library', label: 'Library Fee' },
  { value: 'Lab', label: 'Laboratory Fee' },
  { value: 'Sports', label: 'Sports Fee' },
  { value: 'Transport', label: 'Transport Fee' },
  { value: 'Exam', label: 'Exam Fee' },
  { value: 'Other', label: 'Other' }
];

export function FeeFormDialog({ onFeeCreated }: FeeFormDialogProps) {
  const [students, setStudents] = useState<StudentBasic[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentBasic[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  const feeForm = useForm<FeeFormData>({
    defaultValues: {
      class_id: "",
      student_id: "",
      amount: 0,
      fee_type: "Tuition",
      due_date: "",
    },
  });

  const selectedClassId = feeForm.watch("class_id");

  useEffect(() => {
    fetchStudents();
    fetchClasses();
    fetchCurrentAcademicYear();
  }, []);

  useEffect(() => {
    if (selectedClassId && selectedClassId !== "") {
      const studentsInClass = students.filter(student => student.class_id === selectedClassId);
      setFilteredStudents(studentsInClass);
    } else {
      setFilteredStudents([]);
    }
    feeForm.setValue("student_id", "");
  }, [selectedClassId, students, feeForm]);

  const fetchCurrentAcademicYear = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_current", true)
        .single();

      if (error) throw error;
      setCurrentAcademicYear(data.id);
    } catch (error: any) {
      console.error("Error fetching current academic year:", error);
      toast({
        title: "Error",
        description: "Failed to fetch current academic year",
        variant: "destructive",
      });
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch classes",
        variant: "destructive",
      });
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number, class_id")
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
      toast({
        title: "Error",
        description: "Failed to fetch students",
        variant: "destructive",
      });
    }
  };

  const onSubmitFee = async (data: FeeFormData) => {
    try {
      if (!currentAcademicYear) {
        toast({
          title: "Error",
          description: "No current academic year found. Please contact administrator.",
          variant: "destructive",
        });
        return;
      }

      // Validate fee type against allowed values
      const validFeeTypes = VALID_FEE_TYPES.map(type => type.value);
      if (!validFeeTypes.includes(data.fee_type)) {
        toast({
          title: "Invalid Fee Type",
          description: "Please select a valid fee type from the dropdown.",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("fees")
        .insert([{
          student_id: data.student_id,
          amount: data.amount,
          actual_amount: data.amount,
          discount_amount: 0,
          total_paid: 0,
          fee_type: data.fee_type,
          due_date: data.due_date,
          status: "Pending",
          academic_year_id: currentAcademicYear
        }]);

      if (error) {
        console.error("Database error:", error);
        if (error.message.includes('fees_fee_type_check')) {
          toast({
            title: "Invalid Fee Type",
            description: "The selected fee type is not valid. Please choose from the available options.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      toast({ title: "Fee record created successfully" });
      onFeeCreated();
      setDialogOpen(false);
      feeForm.reset();
    } catch (error: any) {
      console.error("Error creating fee record:", error);
      toast({
        title: "Error creating fee record",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button onClick={() => feeForm.reset()}>
          <Plus className="w-4 h-4 mr-2" />
          Add Fee Record
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Fee Record</DialogTitle>
          <DialogDescription>
            Create a fee record for a student
          </DialogDescription>
        </DialogHeader>
        <Form {...feeForm}>
          <form onSubmit={feeForm.handleSubmit(onSubmitFee)} className="space-y-4">
            <FormField
              control={feeForm.control}
              name="class_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Class</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a class first" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {classes.map((cls) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.section && `- Section ${cls.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={feeForm.control}
              name="student_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Student</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!selectedClassId}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          !selectedClassId 
                            ? "Select a class first" 
                            : filteredStudents.length === 0 
                              ? "No students in selected class"
                              : "Select a student"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {filteredStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name} ({student.admission_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={feeForm.control}
              name="fee_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fee Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {VALID_FEE_TYPES.map((feeType) => (
                        <SelectItem key={feeType.value} value={feeType.value}>
                          {feeType.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={feeForm.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount (₹)</FormLabel>
                  <FormControl>
                    <Input 
                      {...field} 
                      type="number" 
                      step="0.01"
                      min="0"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      required 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={feeForm.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Fee Record</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
