import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Expense } from "@/types/database";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface ExpenseFormProps {
  selectedExpense: Expense | null;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
}

const EXPENSE_CATEGORIES = [
  'Salaries',
  'Rent',
  'Maintenance',
  'Electricity',
  'Water',
  'Stationery',
  'Toilet Needs',
  'Newspapers',
  'Advertisements',
  'Publicity',
  'Social Media',
  'Activities',
  'Independence Day',
  'Krishna Janmashtami',
  'Christmas',
  'Sankranti',
  'Miscellaneous'
];

const PAYMENT_MODES = [
  'Cash',
  'Cheque',
  'Bank Transfer',
  'Card',
  'PhonePe',
  'GPay',
  'Online'
];

export function ExpenseForm({ selectedExpense, onSubmit, onCancel }: ExpenseFormProps) {
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const form = useForm({
    defaultValues: {
      date: selectedExpense?.date || new Date().toISOString().split('T')[0],
      category: selectedExpense?.category || "",
      description: selectedExpense?.description || "",
      amount: selectedExpense?.amount || "",
      paid_to: selectedExpense?.paid_to || "",
      payment_mode: selectedExpense?.payment_mode || "Cash",
      receipt_url: selectedExpense?.receipt_url || "",
      academic_year_id: selectedExpense?.academic_year_id || "",
      month: selectedExpense?.month || new Date().getMonth() + 1,
      notes: selectedExpense?.notes || ""
    },
  });

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("is_current", { ascending: false })
        .order("start_date", { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
    } catch (error) {
      console.error("Error fetching academic years:", error);
    }
  };

  const handleSubmit = async (data: any) => {
    // Use custom category if selected
    if (showCustomCategory && customCategory) {
      data.category = customCategory;
    }

    // Convert amount to number
    data.amount = parseFloat(data.amount);

    // Validate amount
    if (data.amount <= 0) {
      form.setError('amount', { message: 'Amount must be greater than 0' });
      return;
    }

    try {
      await onSubmit(data);
    } catch (error: any) {
      console.error("Error saving expense:", error);
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
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Date *</FormLabel>
                  <FormControl>
                    <Input {...field} type="date" required />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount *</FormLabel>
                  <FormControl>
                    <Input {...field} type="number" step="0.01" min="0.01" required placeholder="0.00" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category *</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      if (value === 'custom') {
                        setShowCustomCategory(true);
                        field.onChange('');
                      } else {
                        setShowCustomCategory(false);
                        field.onChange(value);
                      }
                    }} 
                    value={showCustomCategory ? 'custom' : field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {EXPENSE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                      <SelectItem value="custom">Custom Category</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {showCustomCategory && (
              <FormItem>
                <FormLabel>Custom Category *</FormLabel>
                <FormControl>
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="Enter custom category"
                    required
                  />
                </FormControl>
              </FormItem>
            )}
            <FormField
              control={form.control}
              name="paid_to"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Paid To *</FormLabel>
                  <FormControl>
                    <Input {...field} required placeholder="Vendor/Person name" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description *</FormLabel>
                <FormControl>
                  <Textarea {...field} required placeholder="Detailed description of the expense" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Payment Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Payment Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="payment_mode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Mode *</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_MODES.map((mode) => (
                        <SelectItem key={mode} value={mode}>
                          {mode}
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
              name="receipt_url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Receipt URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Upload receipt URL (optional)" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Academic Information</h3>
          <div className="grid grid-cols-2 gap-4">
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
        </div>

        {/* Additional Notes */}
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Additional notes or comments" />
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
            {selectedExpense ? "Update" : "Create"} Expense
          </Button>
        </div>
      </form>
    </Form>
  );
}