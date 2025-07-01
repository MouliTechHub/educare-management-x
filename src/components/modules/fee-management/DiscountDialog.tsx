
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface DiscountFormData {
  type: string;
  amount: number;
  reason: string;
  notes: string;
}

interface DiscountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedFee: any;
  onSuccess: () => void;
}

export function DiscountDialog({ open, onOpenChange, selectedFee, onSuccess }: DiscountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);

  const form = useForm<DiscountFormData>({
    defaultValues: {
      type: "Fixed Amount",
      amount: 0,
      reason: "",
      notes: "",
    },
  });

  // Fetch current academic year
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch fee structures
  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const currentYear = academicYears.find(year => year.is_current);
      if (!currentYear) return [];
      
      const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('academic_year_id', currentYear.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: academicYears.length > 0
  });

  // Fetch existing fees
  const { data: existingFees = [] } = useQuery({
    queryKey: ['existing-fees'],
    queryFn: async () => {
      const currentYear = academicYears.find(year => year.is_current);
      if (!currentYear) return [];
      
      const { data, error } = await supabase
        .from('fees')
        .select('*')
        .eq('academic_year_id', currentYear.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: academicYears.length > 0
  });

  const onSubmit = async (data: DiscountFormData) => {
    if (!selectedFee) return;

    setLoading(true);
    try {
      let discountAmount = 0;
      
      if (data.type === 'Fixed Amount') {
        discountAmount = data.amount;
      } else if (data.type === 'Percentage') {
        discountAmount = (selectedFee.actual_amount * data.amount) / 100;
      }

      const currentYear = academicYears.find(year => year.is_current);
      if (!currentYear) throw new Error('No current academic year found');

      // Check if fee record exists
      const existingFee = existingFees.find(ef => 
        ef.student_id === selectedFee.student_id && 
        ef.fee_type === selectedFee.fee_type
      );

      if (existingFee) {
        // Update existing fee record
        const { error } = await supabase
          .from('fees')
          .update({
            discount_amount: discountAmount,
            discount_notes: data.notes,
            discount_updated_by: 'Admin',
            discount_updated_at: new Date().toISOString()
          })
          .eq('id', existingFee.id);

        if (error) throw error;
      } else {
        // Create new fee record
        const feeStructure = feeStructures.find(fs => 
          fs.class_id === selectedFee.student.class_id && 
          fs.fee_type === selectedFee.fee_type
        );

        if (feeStructure) {
          const { error } = await supabase
            .from('fees')
            .insert({
              student_id: selectedFee.student_id,
              fee_type: selectedFee.fee_type,
              amount: feeStructure.amount,
              actual_amount: feeStructure.amount,
              discount_amount: discountAmount,
              total_paid: 0,
              due_date: selectedFee.due_date,
              status: 'Pending',
              academic_year_id: currentYear.id,
              discount_notes: data.notes,
              discount_updated_by: 'Admin',
              discount_updated_at: new Date().toISOString()
            });

          if (error) throw error;
        }
      }

      toast({
        title: "Discount applied",
        description: `Discount of ₹${discountAmount.toFixed(2)} applied successfully`
      });

      onOpenChange(false);
      form.reset();
      onSuccess();
    } catch (error: any) {
      console.error('Error applying discount:', error);
      toast({
        title: "Error applying discount",
        description: error.message,
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
          <DialogTitle>Apply Discount</DialogTitle>
          <p className="text-sm text-gray-500">
            Apply discount for {selectedFee?.student?.first_name} {selectedFee?.student?.last_name} - {selectedFee?.fee_type}
          </p>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Actual Amount</p>
              <div className="text-xl font-bold">₹{selectedFee?.actual_amount?.toLocaleString()}</div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">Current Discount</p>
              <div className="text-xl font-bold text-green-600">₹{selectedFee?.discount_amount?.toLocaleString()}</div>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discount Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                        <SelectItem value="Percentage">Percentage</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount {form.watch('type') === 'Percentage' ? '(%)' : '(₹)'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        min="0"
                        max={form.watch('type') === 'Fixed Amount' ? selectedFee?.actual_amount : 100}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason for Discount</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Scholarship">Scholarship</SelectItem>
                        <SelectItem value="Financial Hardship">Financial Hardship</SelectItem>
                        <SelectItem value="Sibling Discount">Sibling Discount</SelectItem>
                        <SelectItem value="Merit Based">Merit Based</SelectItem>
                        <SelectItem value="Staff Quota">Staff Quota</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={3}
                        placeholder="Enter any additional notes about this discount..."
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? "Applying..." : "Apply Discount"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
