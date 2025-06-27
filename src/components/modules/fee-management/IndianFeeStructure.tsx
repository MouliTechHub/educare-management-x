
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
    { key: 'tuition_fee', label: 'Tuition Fee', required: true },
    { key: 'development_fee', label: 'Development Fee', required: true },
    { key: 'library_fee', label: 'Library Fee', required: false },
    { key: 'laboratory_fee', label: 'Laboratory Fee', required: false },
    { key: 'sports_fee', label: 'Sports Fee', required: false },
    { key: 'computer_fee', label: 'Computer Fee', required: false },
    { key: 'transport_fee', label: 'Transport Fee', required: false },
    { key: 'hostel_fee', label: 'Hostel Fee', required: false },
    { key: 'examination_fee', label: 'Examination Fee', required: true },
    { key: 'activity_fee', label: 'Activity Fee', required: false },
    { key: 'uniform_fee', label: 'Uniform Fee', required: false },
    { key: 'book_fee', label: 'Book Fee', required: false },
    { key: 'stationary_fee', label: 'Stationary Fee', required: false },
    { key: 'medical_fee', label: 'Medical Fee', required: false },
    { key: 'caution_deposit', label: 'Caution Deposit', required: false },
  ];

  const updateFee = (key: keyof FeeStructure, value: string) => {
    setFeeStructure(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  const handleSave = async () => {
    if (!selectedClass) {
      toast({
        title: "Error",
        description: "Please select a class",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("fee_structures")
        .upsert({
          class_id: selectedClass,
          ...feeStructure,
          class_id: selectedClass
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Fee structure saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
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
