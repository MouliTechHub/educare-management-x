
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { FeeManagementFilters } from "./FeeManagementFilters";
import { FeeTable } from "./FeeTable";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface FilterState {
  class_id: string;
  section: string;
  status: string;
  fee_type: string;
  due_date_from: string;
  due_date_to: string;
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

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface FeeManagementContentProps {
  currentYear: AcademicYear | undefined;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  classes: Class[];
  filteredFees: Fee[];
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
}

export function FeeManagementContent({
  currentYear,
  searchTerm,
  onSearchChange,
  filters,
  onFiltersChange,
  classes,
  filteredFees,
  onPaymentClick,
  onDiscountClick,
  onHistoryClick
}: FeeManagementContentProps) {
  console.log('FeeManagementContent rendering with:', {
    currentYear: currentYear?.year_name,
    searchTerm,
    classesCount: classes.length,
    filteredFeesCount: filteredFees.length
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Fee Records</CardTitle>
            <CardDescription>
              Comprehensive fee management with detailed payment history and time tracking
              {currentYear && 
                ` - ${currentYear.year_name}${currentYear.is_current ? ' (Current Year)' : ''}`
              }
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by student, class, or fee type..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-900 mb-2">📊 Current Data Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-green-800">
            <div>Classes Available: {classes.length}</div>
            <div>Fee Records: {filteredFees.length}</div>
            <div>Search Term: "{searchTerm || 'None'}"</div>
            <div>Academic Year: {currentYear?.year_name || 'All Years'}</div>
          </div>
        </div>

        <FeeManagementFilters
          searchTerm={searchTerm}
          onSearchChange={onSearchChange}
          filters={filters}
          onFiltersChange={onFiltersChange}
          classes={classes}
        />

        <FeeTable
          fees={filteredFees}
          onPaymentClick={onPaymentClick}
          onDiscountClick={onDiscountClick}
          onHistoryClick={onHistoryClick}
        />
      </CardContent>
    </Card>
  );
}
