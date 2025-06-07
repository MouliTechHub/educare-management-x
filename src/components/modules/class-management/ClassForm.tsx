
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
      homeroom_teacher_id: selectedClass?.homeroom_teacher_id && selectedClass.homeroom_teacher_id.trim() !== "" 
        ? selectedClass.homeroom_teacher_id 
        : undefined,
    },
  });

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
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a teacher" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {teachers
                    .filter((teacher) => teacher.id && teacher.id.trim() !== "")
                    .map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.first_name} {teacher.last_name}
                      </SelectItem>
                    ))}
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
