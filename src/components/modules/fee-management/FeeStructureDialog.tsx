import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Settings } from "lucide-react";
import { useForm } from "react-hook-form";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface FeeStructure {
  id: string;
  class_id: string;
  academic_year_id: string;
  fee_type: string;
  amount: number;
  frequency: string;
  description: string | null;
}

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
  fee?: Fee | null;
  onDiscountApplied: () => void;
  academicYearName?: string;
}

const VALID_FEE_TYPES = [
  { value: 'Tuition', label: 'Tuition Fee' },
  { value: 'Transport', label: 'Transport Fee' },
  { value: 'Meals', label: 'Meals Fee' },
  { value: 'Books', label: 'Books Fee' },
  { value: 'Uniform', label: 'Uniform Fee' },
  { value: 'Activities', label: 'Activities Fee' },
  { value: 'Laboratory', label: 'Laboratory Fee' },
  { value: 'Library', label: 'Library Fee' },
  { value: 'Sports', label: 'Sports Fee' },
  { value: 'Other', label: 'Other' }
];

const FREQUENCY_OPTIONS = [
  { value: 'Monthly', label: 'Monthly' },
  { value: 'Quarterly', label: 'Quarterly' },
  { value: 'Annually', label: 'Annually' },
  { value: 'One Time', label: 'One Time' }
];

export function FeeStructureDialog({ 
  open, 
  onOpenChange, 
  fee, 
  onDiscountApplied, 
  academicYearName 
}: FeeStructureDialogProps) {
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FeeStructureFormData>({
    defaultValues: {
      class_id: "",
      academic_year_id: "",
      fee_type: "Tuition",
      amount: 0,
      frequency: "Monthly",
      description: "",
    },
  });

  useEffect(() => {
    if (open) {
      fetchClasses();
      fetchAcademicYears();
      fetchFeeStructures();
    }
  }, [open]);

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

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
      
      // Set current academic year as default
      const current = data?.find(year => year.is_current);
      if (current) {
        form.setValue("academic_year_id", current.id);
      }
    } catch (error: any) {
      console.error("Error fetching academic years:", error);
    }
  };

  const fetchFeeStructures = async () => {
    try {
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFeeStructures(data || []);
    } catch (error: any) {
      console.error("Error fetching fee structures:", error);
    }
  };

  const onSubmit = async (data: FeeStructureFormData) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("fee_structures")
        .insert([{
          class_id: data.class_id,
          academic_year_id: data.academic_year_id,
          fee_type: data.fee_type,
          amount: data.amount,
          frequency: data.frequency,
          description: data.description || null
        }]);

      if (error) throw error;

      toast({ title: "Fee structure created successfully" });
      onDiscountApplied();
      onOpenChange(false);
      form.reset();
      fetchFeeStructures();
    } catch (error: any) {
      console.error("Error creating fee structure:", error);
      toast({
        title: "Error creating fee structure",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fee Structure Management</DialogTitle>
          <DialogDescription>
            Create and manage fee structures for different classes and academic years
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Create New Fee Structure</h3>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="academic_year_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select academic year" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYears.map((year) => (
                            <SelectItem key={year.id} value={year.id}>
                              {year.year_name} {year.is_current && "(Current)"}
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
                  name="class_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Class</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a class" />
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
                  control={form.control}
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
                          {VALID_FEE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  control={form.control}
                  name="frequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frequency</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {FREQUENCY_OPTIONS.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Additional details about this fee..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? "Creating..." : "Create Fee Structure"}
                </Button>
              </form>
            </Form>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">Existing Fee Structures</h3>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {feeStructures.map((structure) => {
                const className = classes.find(c => c.id === structure.class_id);
                const academicYear = academicYears.find(y => y.id === structure.academic_year_id);
                
                return (
                  <div key={structure.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{structure.fee_type}</p>
                        <p className="text-sm text-gray-600">
                          {className ? `${className.name}${className.section ? ` - ${className.section}` : ''}` : 'Unknown Class'}
                        </p>
                        <p className="text-sm text-gray-600">
                          {academicYear?.year_name || 'Unknown Year'}
                        </p>
                        <p className="text-sm">₹{structure.amount} ({structure.frequency})</p>
                        {structure.description && (
                          <p className="text-xs text-gray-500 mt-1">{structure.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              {feeStructures.length === 0 && (
                <p className="text-gray-500 text-center py-4">No fee structures created yet</p>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
