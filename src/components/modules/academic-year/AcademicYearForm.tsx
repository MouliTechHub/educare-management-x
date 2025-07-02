import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { AcademicYear } from "@/types/database";

interface AcademicYearFormProps {
  selectedYear: AcademicYear | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function AcademicYearForm({ selectedYear, onSubmit, onCancel }: AcademicYearFormProps) {
  const form = useForm({
    defaultValues: {
      year_name: selectedYear?.year_name || "",
      start_date: selectedYear?.start_date || "",
      end_date: selectedYear?.end_date || "",
      is_current: selectedYear?.is_current || false,
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      // Add id if editing
      if (selectedYear) {
        data.id = selectedYear.id;
      }
      
      await onSubmit(data);
    } catch (error: any) {
      console.error("Error saving academic year:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Academic Year Information</h3>
          
          <FormField
            control={form.control}
            name="year_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year Name *</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="e.g., 2024-2025" required />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="start_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Start Date *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="end_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>End Date *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="is_current"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Current Academic Year</FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Mark this as the current active academic year
                  </div>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {selectedYear ? "Update" : "Create"} Academic Year
          </Button>
        </div>
      </form>
    </Form>
  );
}