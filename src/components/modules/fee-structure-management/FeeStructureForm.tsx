
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Class, AcademicYear } from "@/types/database";
import { FEE_TYPE_OPTIONS } from "@/constants/feeTypes";

interface FeeStructure {
  id: string;
  class_id: string;
  academic_year_id: string;
  fee_type: string;
  amount: number;
  frequency: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FeeStructureFormProps {
  selectedStructure: FeeStructure | null;
  classes: Class[];
  academicYears: AcademicYear[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

const FREQUENCIES = ['Monthly', 'Quarterly', 'Annually', 'One Time'];

export function FeeStructureForm({ selectedStructure, classes, academicYears, onSubmit, onCancel }: FeeStructureFormProps) {
  const [formData, setFormData] = useState({
    class_id: '',
    academic_year_id: '',
    fee_type: '',
    amount: '',
    frequency: '',
    description: '',
  });

  useEffect(() => {
    if (selectedStructure) {
      setFormData({
        class_id: selectedStructure.class_id,
        academic_year_id: selectedStructure.academic_year_id,
        fee_type: selectedStructure.fee_type,
        amount: selectedStructure.amount.toString(),
        frequency: selectedStructure.frequency,
        description: selectedStructure.description || '',
      });
    } else {
      // Set current academic year as default
      const currentYear = academicYears.find(year => year.is_current);
      setFormData({
        class_id: '',
        academic_year_id: currentYear?.id || '',
        fee_type: '',
        amount: '',
        frequency: '',
        description: '',
      });
    }
  }, [selectedStructure, academicYears]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.class_id || !formData.academic_year_id || !formData.fee_type || !formData.amount || !formData.frequency) {
      alert('Please fill in all required fields');
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      alert('Amount must be greater than 0');
      return;
    }

    onSubmit(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="class_id">Class *</Label>
          <Select
            value={formData.class_id}
            onValueChange={(value) => handleInputChange('class_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
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

        <div className="space-y-2">
          <Label htmlFor="academic_year_id">Academic Year *</Label>
          <Select
            value={formData.academic_year_id}
            onValueChange={(value) => handleInputChange('academic_year_id', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.year_name} {year.is_current && '(Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="fee_type">Fee Type *</Label>
          <Select
            value={formData.fee_type}
            onValueChange={(value) => handleInputChange('fee_type', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select fee type" />
            </SelectTrigger>
            <SelectContent>
              {FEE_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="frequency">Frequency *</Label>
          <Select
            value={formData.frequency}
            onValueChange={(value) => handleInputChange('frequency', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {FREQUENCIES.map((freq) => (
                <SelectItem key={freq} value={freq}>
                  {freq}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            placeholder="Enter amount"
            required
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Optional description for this fee structure"
          rows={3}
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {selectedStructure ? "Update Structure" : "Create Structure"}
        </Button>
      </div>
    </form>
  );
}
