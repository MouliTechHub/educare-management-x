
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { supabase } from "@/integrations/supabase/client";
import { Student, Class } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

interface StudentFormData {
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: string;
  class_id?: string;
  address_line1?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  status: string;
}

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  classes: Class[];
  onStudentSaved: () => void;
}

export function StudentForm({ open, onOpenChange, selectedStudent, classes, onStudentSaved }: StudentFormProps) {
  const { toast } = useToast();

  const form = useForm<StudentFormData>({
    defaultValues: {
      first_name: "",
      last_name: "",
      admission_number: "",
      date_of_birth: "",
      gender: "Male",
      class_id: undefined,
      address_line1: "",
      city: "",
      state: "",
      pin_code: "",
      status: "Active",
    },
  });

  const resetForm = () => {
    console.log('Resetting form...');
    form.reset({
      first_name: "",
      last_name: "",
      admission_number: "",
      date_of_birth: "",
      gender: "Male",
      class_id: undefined,
      address_line1: "",
      city: "",
      state: "",
      pin_code: "",
      status: "Active",
    });
  };

  const onSubmit = async (data: StudentFormData) => {
    try {
      console.log('Form submission started with data:', data);
      
      // Validate required fields
      if (!data.first_name?.trim()) {
        toast({
          title: "Validation Error",
          description: "First name is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.last_name?.trim()) {
        toast({
          title: "Validation Error",
          description: "Last name is required",
          variant: "destructive",
        });
        return;
      }
      
      if (!data.admission_number?.trim()) {
        toast({
          title: "Validation Error",
          description: "Admission number is required",
          variant: "destructive",
        });
        return;
      }

      const studentData = {
        ...data,
        class_id: data.class_id && data.class_id !== "" ? data.class_id : null,
      };

      console.log('Processed student data for submission:', studentData);

      if (selectedStudent) {
        console.log('Updating existing student:', selectedStudent.id);
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", selectedStudent.id);

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        toast({ title: "Student updated successfully" });
      } else {
        console.log('Creating new student...');
        const { data: insertedData, error } = await supabase
          .from("students")
          .insert([studentData])
          .select();

        if (error) {
          console.error('Insert error:', error);
          throw error;
        }
        
        console.log('Student created successfully:', insertedData);
        toast({ title: "Student created successfully" });
      }

      onStudentSaved();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('onSubmit error:', error);
      toast({
        title: "Error saving student",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  // When dialog opens with a selected student, populate the form
  if (selectedStudent && open) {
    form.reset({
      first_name: selectedStudent.first_name,
      last_name: selectedStudent.last_name,
      admission_number: selectedStudent.admission_number,
      date_of_birth: selectedStudent.date_of_birth,
      gender: selectedStudent.gender,
      class_id: selectedStudent.class_id || undefined,
      address_line1: selectedStudent.address_line1 || "",
      city: selectedStudent.city || "",
      state: selectedStudent.state || "",
      pin_code: selectedStudent.pin_code || "",
      status: selectedStudent.status,
    });
  }

  // Filter out invalid classes and ensure proper values
  const validClasses = classes.filter(classItem => {
    if (!classItem || !classItem.id) {
      console.log('Class missing or no ID:', classItem);
      return false;
    }
    
    const classId = String(classItem.id).trim();
    if (classId === "" || classId.length === 0) {
      console.log('Class ID is empty after trimming:', classItem.id);
      return false;
    }
    
    return true;
  });

  console.log('Valid classes count:', validClasses.length);
  console.log('Valid classes:', validClasses);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{selectedStudent ? "Edit Student" : "Add New Student"}</DialogTitle>
          <DialogDescription>
            {selectedStudent ? "Update student information" : "Enter student details to add to the system"}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name *</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name *</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="admission_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Admission Number *</FormLabel>
                    <FormControl>
                      <Input {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date_of_birth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth *</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="class_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Class</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        console.log('Class selection changed to:', value);
                        field.onChange(value === "no-class-assigned" ? undefined : value);
                      }} 
                      value={field.value || "no-class-assigned"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a class" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="no-class-assigned">No class assigned</SelectItem>
                        {validClasses.length > 0 ? (
                          validClasses.map((classItem) => {
                            const classId = String(classItem.id).trim();
                            console.log('About to render SelectItem for class ID:', classId);
                            
                            if (!classId || classId === "" || classId.length === 0) {
                              console.error('CRITICAL: Prevented rendering SelectItem with empty class value:', classItem);
                              return null;
                            }
                            
                            return (
                              <SelectItem key={classId} value={classId}>
                                {classItem.name} {classItem.section && `- ${classItem.section}`}
                              </SelectItem>
                            );
                          }).filter(Boolean)
                        ) : (
                          <SelectItem value="no-classes-available" disabled>
                            No classes available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="address_line1"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>State</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pin_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Alumni">Alumni</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {selectedStudent ? "Update" : "Create"} Student
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
