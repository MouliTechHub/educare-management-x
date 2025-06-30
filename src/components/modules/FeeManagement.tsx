
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
  console.log('FeeManagement component rendering...');
  
  const { 
    fees, 
    academicYears, 
    selectedAcademicYear, 
    setSelectedAcademicYear, 
    loading 
  } = useFeeData();
  
  console.log('Fee data:', { fees: fees.length, academicYears: academicYears.length, loading });
  
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

  console.log('Fee management data:', { classes: classes.length, searchTerm, filters });

  // Get year-wise summary
  const yearWiseSummary = useYearWiseSummary(fees, academicYears, selectedAcademicYear);
  console.log('Year wise summary:', yearWiseSummary);

  const handleHistoryClick = (student: Fee['student']) => {
    console.log('History clicked for student:', student);
    openHistoryDialog(student, fees);
  };

  const handlePaymentClick = (fee: Fee) => {
    console.log('Payment clicked for fee:', fee);
    // TODO: Implement payment dialog
  };

  const handleDiscountClick = (fee: Fee) => {
    console.log('Discount clicked for fee:', fee);
    // TODO: Implement discount dialog
  };

  if (loading) {
    console.log('Fee Management is loading...');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading fee management data...</p>
      </div>
    );
  }

  const currentYear = academicYears.find(year => year.id === selectedAcademicYear);
  const filteredFees = applyFilters(fees);
  
  console.log('Rendering Fee Management with:', {
    currentYear: currentYear?.year_name,
    filteredFeesCount: filteredFees.length,
    totalFeesCount: fees.length
  });

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-900 font-semibold mb-2">🔍 Debug Information</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>Total Fees: {fees.length}</p>
          <p>Filtered Fees: {filteredFees.length}</p>
          <p>Academic Years: {academicYears.length}</p>
          <p>Classes: {classes.length}</p>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
          <p>Current Year: {currentYear?.year_name || 'None selected'}</p>
        </div>
      </div>

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
        onPaymentClick={handlePaymentClick}
        onDiscountClick={handleDiscountClick}
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
