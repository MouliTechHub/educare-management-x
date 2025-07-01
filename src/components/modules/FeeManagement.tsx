
import React from "react";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { FeeStats } from "./fee-management/FeeStats";
import { FeeManagementContent } from "./fee-management/FeeManagementContent";
import { DiscountDialog } from "./fee-management/DiscountDialog";
import { StudentPaymentHistory } from "./student-management/StudentPaymentHistory";
import { useFeeData } from "./fee-management/useFeeData";
import { useFeeManagement } from "./fee-management/useFeeManagement";

export default function FeeManagement() {
  const {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    loading,
    refetchFees
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

  const [discountDialogOpen, setDiscountDialogOpen] = React.useState(false);
  const [selectedFee, setSelectedFee] = React.useState(null);

  // Apply filters to fees
  const filteredFees = applyFilters(fees).filter(fee => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      fee.student?.first_name?.toLowerCase().includes(searchLower) ||
      fee.student?.last_name?.toLowerCase().includes(searchLower) ||
      fee.student?.admission_number?.toLowerCase().includes(searchLower) ||
      fee.fee_type?.toLowerCase().includes(searchLower)
    );
  });

  const handleDiscountClick = (fee) => {
    setSelectedFee(fee);
    setDiscountDialogOpen(true);
  };

  const handlePaymentClick = (fee) => {
    console.log('Payment clicked for fee:', fee.id);
    // Payment functionality to be implemented
  };

  const handleHistoryClick = (student) => {
    console.log('History clicked for student:', student);
    if (!student) {
      console.warn('No student data provided for history');
      return;
    }
    
    // Get all fees for this student across all fee systems
    const studentFees = fees.filter(fee => fee.student_id === student.id);
    console.log('Student fees found:', studentFees.length);
    
    // Create a comprehensive fee list for history
    const studentName = `${student.first_name} ${student.last_name}`;
    
    // Open history dialog with comprehensive fee data
    setSelectedStudentName(studentName);
    openHistoryDialog(student, studentFees);
  };

  const currentYear = academicYears.find(year => year.is_current);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <FeeManagementHeader
        academicYears={academicYears}
        currentAcademicYear={currentAcademicYear}
        onYearChange={setCurrentAcademicYear}
        onRefresh={refetchFees}
      />

      <FeeStats fees={filteredFees} />

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

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        selectedFee={selectedFee}
        onSuccess={refetchFees}
      />

      <StudentPaymentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        studentName={selectedStudentName}
        fees={selectedStudentFees}
        academicYears={academicYears}
        selectedAcademicYear={currentAcademicYear}
      />
    </div>
  );
}
