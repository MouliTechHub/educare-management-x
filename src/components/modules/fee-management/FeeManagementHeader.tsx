
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw } from "lucide-react";
import { AcademicYear } from "./types/feeTypes";

interface FeeManagementHeaderProps {
  academicYears: AcademicYear[];
  currentAcademicYear: AcademicYear | null;
  onYearChange: (year: AcademicYear) => void;
  onRefresh: () => void;
}

export function FeeManagementHeader({
  academicYears,
  currentAcademicYear,
  onYearChange,
  onRefresh
}: FeeManagementHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
        <p className="text-gray-600 mt-2">
          Manage student fees, payments, and track outstanding balances
        </p>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700">Academic Year:</label>
          <Select 
            value={currentAcademicYear?.id || ''} 
            onValueChange={(value) => {
              const selectedYear = academicYears.find(year => year.id === value);
              if (selectedYear) {
                onYearChange(selectedYear);
              }
            }}
          >
            <SelectTrigger className="w-48">
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

        <Button
          variant="outline"
          onClick={onRefresh}
          className="flex items-center space-x-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Refresh</span>
        </Button>
      </div>
    </div>
  );
}
