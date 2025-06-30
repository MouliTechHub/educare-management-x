
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FeeStructure {
  class_id: string;
  tuition_fee: number;
  development_fee: number;
  library_fee: number;
  laboratory_fee: number;
  sports_fee: number;
  computer_fee: number;
  transport_fee: number;
  hostel_fee: number;
  examination_fee: number;
  activity_fee: number;
  uniform_fee: number;
  book_fee: number;
  stationary_fee: number;
  medical_fee: number;
  caution_deposit: number;
}

interface IndianFeeStructureProps {
  classes: Array<{id: string; name: string; section: string | null}>;
}

export function IndianFeeStructure({ classes }: IndianFeeStructureProps) {
  const [selectedClass, setSelectedClass] = useState("");
  const [academicYearId, setAcademicYearId] = useState("");
  const [academicYears, setAcademicYears] = useState<Array<{id: string; year_name: string; is_current: boolean}>>([]);
  const [feeStructure, setFeeStructure] = useState<FeeStructure>({
    class_id: "",
    tuition_fee: 0,
    development_fee: 0,
    library_fee: 0,
    laboratory_fee: 0,
    sports_fee: 0,
    computer_fee: 0,
    transport_fee: 0,
    hostel_fee: 0,
    examination_fee: 0,
    activity_fee: 0,
    uniform_fee: 0,
    book_fee: 0,
    stationary_fee: 0,
    medical_fee: 0,
    caution_deposit: 0,
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const feeCategories = [
    { key: 'tuition_fee', label: 'Tuition Fee', required: true, type: 'Tuition' },
    { key: 'development_fee', label: 'Development Fee', required: true, type: 'Other' },
    { key: 'library_fee', label: 'Library Fee', required: false, type: 'Library' },
    { key: 'laboratory_fee', label: 'Laboratory Fee', required: false, type: 'Laboratory' },
    { key: 'sports_fee', label: 'Sports Fee', required: false, type: 'Sports' },
    { key: 'computer_fee', label: 'Computer Fee', required: false, type: 'Other' },
    { key: 'transport_fee', label: 'Transport Fee', required: false, type: 'Transport' },
    { key: 'hostel_fee', label: 'Hostel Fee', required: false, type: 'Other' },
    { key: 'examination_fee', label: 'Examination Fee', required: true, type: 'Other' },
    { key: 'activity_fee', label: 'Activity Fee', required: false, type: 'Activities' },
    { key: 'uniform_fee', label: 'Uniform Fee', required: false, type: 'Uniform' },
    { key: 'book_fee', label: 'Book Fee', required: false, type: 'Books' },
    { key: 'stationary_fee', label: 'Stationary Fee', required: false, type: 'Other' },
    { key: 'medical_fee', label: 'Medical Fee', required: false, type: 'Other' },
    { key: 'caution_deposit', label: 'Caution Deposit', required: false, type: 'Other' },
  ];

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
      
      // Set current academic year as default
      const currentYear = data?.find(year => year.is_current);
      if (currentYear) {
        setAcademicYearId(currentYear.id);
      }
    } catch (error: any) {
      console.error('Error fetching academic years:', error);
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive",
      });
    }
  };

  const updateFee = (key: keyof FeeStructure, value: string) => {
    setFeeStructure(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    if (!selectedClass || !academicYearId) {
      toast({
        title: "Error",
        description: "Please select a class and academic year",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Create individual fee structure entries for each category with amount > 0
      const feeStructuresToCreate = feeCategories
        .filter(category => {
          const amount = feeStructure[category.key as keyof FeeStructure];
          return typeof amount === 'number' && amount > 0;
        })
        .map(category => ({
          class_id: selectedClass,
          academic_year_id: academicYearId,
          fee_type: category.type,
          amount: feeStructure[category.key as keyof FeeStructure] as number,
          frequency: 'Annually' as const,
          description: category.label,
          is_active: true
        }));

      if (feeStructuresToCreate.length === 0) {
        toast({
          title: "Error",
          description: "Please enter at least one fee amount",
          variant: "destructive",
        });
        return;
      }

      // Delete existing fee structures for this class and academic year
      await supabase
        .from("fee_structures")
        .delete()
        .eq("class_id", selectedClass)
        .eq("academic_year_id", academicYearId);

      // Insert new fee structures
      const { error } = await supabase
        .from("fee_structures")
        .insert(feeStructuresToCreate);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee structure saved successfully",
      });

      // Reset form
      setFeeStructure({
        class_id: "",
        tuition_fee: 0,
        development_fee: 0,
        library_fee: 0,
        laboratory_fee: 0,
        sports_fee: 0,
        computer_fee: 0,
        transport_fee: 0,
        hostel_fee: 0,
        examination_fee: 0,
        activity_fee: 0,
        uniform_fee: 0,
        book_fee: 0,
        stationary_fee: 0,
        medical_fee: 0,
        caution_deposit: 0,
      });
      setSelectedClass("");

    } catch (error: any) {
      console.error('Fee structure save error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save fee structure",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalFee = Object.values(feeStructure).reduce((sum, fee) => 
    typeof fee === 'number' ? sum + fee : sum, 0
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Indian School Fee Structure</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Academic Year</Label>
            <Select value={academicYearId} onValueChange={setAcademicYearId}>
              <SelectTrigger>
                <SelectValue placeholder="Select academic year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.year_name} {year.is_current && "(Current)"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Select Class</Label>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger>
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- Section ${cls.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {feeCategories.map((category) => (
            <div key={category.key}>
              <Label htmlFor={category.key}>
                {category.label} {category.required && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id={category.key}
                type="number"
                min="0"
                value={feeStructure[category.key as keyof FeeStructure] || ''}
                onChange={(e) => updateFee(category.key as keyof FeeStructure, e.target.value)}
                placeholder="₹0"
              />
            </div>
          ))}
        </div>

        <div className="flex justify-between items-center pt-4 border-t">
          <div className="text-lg font-semibold">
            Total Annual Fee: ₹{totalFee.toLocaleString()}
          </div>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Fee Structure"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
