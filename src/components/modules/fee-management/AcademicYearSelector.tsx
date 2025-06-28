
import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface AcademicYearSelectorProps {
  academicYears: AcademicYear[];
  selectedYear: string;
  onYearChange: (yearId: string) => void;
}

export function AcademicYearSelector({ academicYears, selectedYear, onYearChange }: AcademicYearSelectorProps) {
  return (
    <div className="flex items-center space-x-2">
      <Label htmlFor="academic-year" className="text-sm font-medium">
        Academic Year:
      </Label>
      <Select value={selectedYear} onValueChange={onYearChange}>
        <SelectTrigger id="academic-year" className="w-48">
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
  );
}
