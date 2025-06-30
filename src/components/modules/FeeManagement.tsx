
import React from "react";
import { StudentPaymentHistory } from "./student-management/StudentPaymentHistory";
import { YearWiseSummaryCards } from "./fee-management/YearWiseSummaryCards";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { FeeManagementContent } from "./fee-management/FeeManagementContent";
import { useFeeData } from "./fee-management/useFeeData";
import { useYearWiseSummary } from "./fee-management/useYearWiseSummary";
import { useFeeManagement } from "./fee-management/useFeeManagement";

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

export function FeeManagement() {
  const { 
    fees, 
    academicYears, 
    selectedAcademicYear, 
    setSelectedAcademicYear, 
    loading 
  } = useFeeData();
  
  const {
    classes,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedStudentFees,
    selectedStudentName,
    openHistoryDialog,
    applyFilters
  } = useFeeManagement();

  // Get year-wise summary
  const yearWiseSummary = useYearWiseSummary(fees, academicYears, selectedAcademicYear);

  const handleHistoryClick = (student: Fee['student']) => {
    openHistoryDialog(student, fees);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentYear = academicYears.find(year => year.id === selectedAcademicYear);
  const filteredFees = applyFilters(fees);

  return (
    <div className="space-y-6">
      <FeeManagementHeader
        academicYears={academicYears}
        selectedAcademicYear={selectedAcademicYear}
        onYearChange={setSelectedAcademicYear}
      />

      <YearWiseSummaryCards summary={yearWiseSummary} />

      <FeeManagementContent
        currentYear={currentYear}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        classes={classes}
        filteredFees={filteredFees}
        onPaymentClick={() => {}} // Removed payment functionality
        onDiscountClick={() => {}} // Removed discount functionality
        onHistoryClick={handleHistoryClick}
      />

      <StudentPaymentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        studentName={selectedStudentName}
        fees={selectedStudentFees}
        academicYears={academicYears}
        selectedAcademicYear={selectedAcademicYear}
      />
    </div>
  );
}
