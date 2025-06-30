
import { AcademicYearSelector } from "./AcademicYearSelector";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface FeeManagementHeaderProps {
  academicYears: AcademicYear[];
  selectedAcademicYear: string;
  onYearChange: (year: string) => void;
}

export function FeeManagementHeader({
  academicYears,
  selectedAcademicYear,
  onYearChange
}: FeeManagementHeaderProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-2">View detailed payment history and fee records by academic year</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AcademicYearSelector
          academicYears={academicYears}
          selectedYear={selectedAcademicYear}
          onYearChange={onYearChange}
        />
      </div>
    </div>
  );
}
