
import React from "react";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { FeeStats } from "./fee-management/FeeStats";
import { FeeManagementContent } from "./fee-management/FeeManagementContent";
import { DiscountDialog } from "./fee-management/DiscountDialog";
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
    if (!student) return;
    openHistoryDialog(student, fees);
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
    </div>
  );
}
