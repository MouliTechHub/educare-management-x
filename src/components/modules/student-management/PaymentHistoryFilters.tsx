
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface PaymentHistoryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  academicYears: AcademicYear[];
  currentAcademicYear: string;
  onYearChange: (year: string) => void;
}

export function PaymentHistoryFilters({
  searchTerm,
  onSearchChange,
  academicYears,
  currentAcademicYear,
  onYearChange
}: PaymentHistoryFiltersProps) {
  return (
    <div className="flex items-center justify-between space-x-4">
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by fee type, status, payment method, or receipt number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="max-w-md"
        />
      </div>
      
      {academicYears.length > 0 && (
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Academic Year:</span>
          <Select value={currentAcademicYear} onValueChange={onYearChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select academic year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Years</SelectItem>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.year_name} {year.is_current && "(Current)"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
