
import { AcademicYearSelector } from "./AcademicYearSelector";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";

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
          <p className="text-gray-600 mt-2">Manage student fees, payments, and fee structures</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Manage Fee Structure
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Fee Record
          </Button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold text-blue-900 mb-3">Fee Management Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>💰 Payment Processing:</strong> Accept and record fee payments with receipts
            </p>
            <p className="text-blue-700">
              <strong>🎯 Discount Management:</strong> Apply and track fee discounts and concessions
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>📊 Financial Tracking:</strong> Monitor payment status and outstanding balances
            </p>
            <p className="text-blue-700">
              <strong>🏗️ Structure Management:</strong> Configure fee structures for different classes
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-blue-700">
              <strong>📈 Payment History:</strong> Complete audit trail of all transactions
            </p>
            <p className="text-blue-700">
              <strong>🔍 Advanced Filtering:</strong> Search and filter by multiple criteria
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
