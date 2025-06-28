
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

      if (error) throw error;

      toast({ title: "Fee record created successfully" });
      onFeeCreated();
      setDialogOpen(false);
      feeForm.reset();
    } catch (error: any) {
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
                      <SelectItem value="Tuition">Tuition Fee</SelectItem>
                      <SelectItem value="Library">Library Fee</SelectItem>
                      <SelectItem value="Lab">Laboratory Fee</SelectItem>
                      <SelectItem value="Sports">Sports Fee</SelectItem>
                      <SelectItem value="Transport">Transport Fee</SelectItem>
                      <SelectItem value="Exam">Exam Fee</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
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
