import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { TeacherSalary, Teacher } from "@/types/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calculator } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface TeacherSalaryFormProps {
  selectedSalary: TeacherSalary | null;
  teachers: Teacher[];
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

export function TeacherSalaryForm({ selectedSalary, teachers, onSubmit, onCancel }: TeacherSalaryFormProps) {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [calculatedSalary, setCalculatedSalary] = useState<number>(0);

  const form = useForm({
    defaultValues: {
      teacher_id: selectedSalary?.teacher_id || "",
      month: selectedSalary?.month || new Date().getMonth() + 1,
      year: selectedSalary?.year || new Date().getFullYear(),
      academic_year_id: selectedSalary?.academic_year_id || "",
      salary_rate: selectedSalary?.salary_rate || 0,
      attended_days: selectedSalary?.attended_days || 26,
      working_days: selectedSalary?.working_days || 26,
      bonus: selectedSalary?.bonus || 0,
      deductions: selectedSalary?.deductions || 0,
      payment_date: selectedSalary?.payment_date || "",
      payment_method: selectedSalary?.payment_method || "Bank Transfer",
      status: selectedSalary?.status || "Pending",
      notes: selectedSalary?.notes || ""
    },
  });

  const watchedValues = form.watch(['salary_rate', 'attended_days', 'working_days', 'bonus', 'deductions']);

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (form.watch('teacher_id')) {
      const teacher = teachers.find(t => t.id === form.watch('teacher_id'));
      setSelectedTeacher(teacher || null);
      if (teacher && teacher.salary) {
        form.setValue('salary_rate', teacher.salary);
      }
    }
  }, [form.watch('teacher_id'), teachers, form]);

  useEffect(() => {
    const [salaryRate, attendedDays, workingDays, bonus, deductions] = watchedValues;
    if (salaryRate && workingDays && attendedDays !== undefined) {
      const calculated = (Number(salaryRate) / Number(workingDays)) * Number(attendedDays);
      const final = calculated + (Number(bonus) || 0) - (Number(deductions) || 0);
      setCalculatedSalary(final);
    }
  }, [watchedValues]);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
      
      // Auto-select current academic year if not editing
      if (!selectedSalary && data?.length > 0) {
        const current = data.find(year => year.is_current);
        if (current) {
          form.setValue('academic_year_id', current.id);
        }
      }
    } catch (error) {
      console.error("Error fetching academic years:", error);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      // Ensure calculated_salary and final_salary are included
      data.calculated_salary = (Number(data.salary_rate) / Number(data.working_days)) * Number(data.attended_days);
      data.final_salary = data.calculated_salary + (Number(data.bonus) || 0) - (Number(data.deductions) || 0);
      
      // Add id if editing
      if (selectedSalary) {
        data.id = selectedSalary.id;
      }
      
      await onSubmit(data);
    } catch (error: any) {
      console.error("Error saving salary:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="teacher_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teacher *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select teacher" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {teachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name} ({teacher.employee_id || 'No ID'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="month"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Month *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 12 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {new Date(0, i).toLocaleString('default', { month: 'long' })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="year"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Year *</FormLabel>
                  <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Array.from({ length: 5 }, (_, i) => {
                        const year = new Date().getFullYear() - 2 + i;
                        return (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="academic_year_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Academic Year *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select academic year" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.year_name} {year.is_current && '(Current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Salary Calculation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calculator className="w-4 h-4 mr-2" />
              Salary Calculation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="salary_rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Salary *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="working_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Working Days *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="1" 
                        max="31"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 26)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="attended_days"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Attendance Days *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        min="0" 
                        max="31"
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bonus"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bonus</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deductions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deductions</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01" 
                        min="0"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="text-sm space-y-1">
                <div>Calculated Salary: ₹{((form.watch('salary_rate') || 0) / (form.watch('working_days') || 26) * (form.watch('attended_days') || 0)).toLocaleString()}</div>
                <div className="font-semibold text-lg">Final Salary: ₹{calculatedSalary.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Information</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Date</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="payment_method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value || ""}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Additional notes..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {selectedSalary ? "Update" : "Create"} Salary Record
          </Button>
        </div>
      </form>
    </Form>
  );
}