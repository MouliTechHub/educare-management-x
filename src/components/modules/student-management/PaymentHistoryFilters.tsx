
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
  onYearChange: (value: string) => void;
}

export function PaymentHistoryFilters({
  searchTerm,
  onSearchChange,
  academicYears,
  currentAcademicYear,
  onYearChange
}: PaymentHistoryFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search by fee type, payment method, receipt number..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      <div className="w-full sm:w-64">
        <Select value={currentAcademicYear || "all"} onValueChange={onYearChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select Academic Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Academic Years</SelectItem>
            {academicYears && academicYears.length > 0 && academicYears.map((year) => (
              <SelectItem key={year.id} value={year.id}>
                {year.year_name} {year.is_current ? "(Current)" : ""}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
