import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Teacher } from "@/types/database";

interface ClassFormData {
  name: string;
  section?: string;
  homeroom_teacher_id?: string;
}

interface ClassFormProps {
  teachers: Teacher[];
  selectedClass: any;
  onSubmit: (data: ClassFormData) => Promise<void>;
  onCancel: () => void;
}

export function ClassForm({ teachers, selectedClass, onSubmit, onCancel }: ClassFormProps) {
  const form = useForm<ClassFormData>({
    defaultValues: {
      name: selectedClass?.name || "",
      section: selectedClass?.section || "",
      homeroom_teacher_id: selectedClass?.homeroom_teacher_id && 
        selectedClass.homeroom_teacher_id.trim() !== "" 
        ? selectedClass.homeroom_teacher_id 
        : undefined,
    },
  });

  // Ultra-robust filtering for valid teachers
  const validTeachers = teachers.filter((teacher) => {
    console.log('Raw teacher data:', teacher);
    
    // Check if teacher exists and has an id property
    if (!teacher || !teacher.id) {
      console.log('Teacher missing or no ID:', teacher);
      return false;
    }
    
    // Ensure ID is a string and not empty after trimming
    const teacherId = String(teacher.id).trim();
    if (teacherId === "" || teacherId.length === 0) {
      console.log('Teacher ID is empty after trimming:', teacher.id);
      return false;
    }
    
    // Check for valid names
    const hasValidName = teacher.first_name && teacher.last_name && 
                        String(teacher.first_name).trim() !== "" && 
                        String(teacher.last_name).trim() !== "";
    
    console.log('Teacher validation result:', {
      id: teacher.id,
      trimmedId: teacherId,
      hasValidName,
      isValid: hasValidName
    });
    
    return hasValidName;
  });

  console.log('Valid teachers count:', validTeachers.length);
  console.log('Valid teachers:', validTeachers);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Class Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., Grade 10, Class XII" required />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="section"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Section</FormLabel>
              <FormControl>
                <Input {...field} placeholder="e.g., A, B, Science" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="homeroom_teacher_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Homeroom Teacher</FormLabel>
              <Select 
                onValueChange={field.onChange} 
                value={field.value || ""}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {validTeachers.length > 0 ? (
                    validTeachers.map((teacher) => {
                      const teacherId = String(teacher.id).trim();
                      console.log('About to render SelectItem for teacher ID:', teacherId);
                      
                      // Final safety check before rendering
                      if (!teacherId || teacherId === "") {
                        console.error('Attempted to render SelectItem with empty ID, skipping:', teacher);
                        return null;
                      }
                      
                      return (
                        <SelectItem key={teacherId} value={teacherId}>
                          {teacher.first_name} {teacher.last_name}
                        </SelectItem>
                      );
                    })
                  ) : (
                    <SelectItem value="no-teachers" disabled>
                      No teachers available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {selectedClass ? "Update" : "Create"} Class
          </Button>
        </div>
      </form>
    </Form>
  );
}
