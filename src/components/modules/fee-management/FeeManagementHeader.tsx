
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
          <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-2">View comprehensive payment history and fee records for management review</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Management Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>📊 Complete Overview:</strong> View all payment transactions with exact timestamps
            </p>
            <p className="text-blue-700">
              <strong>🔍 Detailed Tracking:</strong> See multiple daily payments separately (morning/evening)
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>💰 Financial Control:</strong> Track all amounts, discounts, and payment methods
            </p>
            <p className="text-blue-700">
              <strong>📝 Full Documentation:</strong> Complete audit trail with receiver details
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>⏰ Time-based Analysis:</strong> Analyze payment patterns by time of day
            </p>
            <p className="text-blue-700">
              <strong>📈 Management Insights:</strong> Data for strategic decision making
            </p>
          </div>
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
