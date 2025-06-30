
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { AcademicYearSelector } from "./AcademicYearSelector";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

interface FeeManagementHeaderProps {
  academicYears: AcademicYear[];
  selectedAcademicYear: string;
  onYearChange: (year: string) => void;
  onFeeCreated: () => void;
  onStructureCreated: () => void;
  filteredFees: Fee[];
}

export function FeeManagementHeader({
  academicYears,
  selectedAcademicYear,
  onYearChange,
  filteredFees
}: FeeManagementHeaderProps) {
  const handleExport = (format: 'excel' | 'pdf') => {
    const currentYear = academicYears.find(year => year.id === selectedAcademicYear);
    const yearName = currentYear?.year_name || 'Unknown';
    
    console.log(`Exporting ${format} for ${yearName}:`, filteredFees);
    // Export functionality would be implemented here
  };

  return (
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
        <p className="text-gray-600 mt-2">Manage student fees and payments by academic year</p>
      </div>
      <div className="flex items-center space-x-4">
        <AcademicYearSelector
          academicYears={academicYears}
          selectedYear={selectedAcademicYear}
          onYearChange={onYearChange}
        />
        <Button
          variant="outline"
          onClick={() => handleExport('excel')}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export Excel</span>
        </Button>
        <Button
          variant="outline"
          onClick={() => handleExport('pdf')}
          className="flex items-center space-x-2"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF</span>
        </Button>
      </div>
    </div>
  );
}
