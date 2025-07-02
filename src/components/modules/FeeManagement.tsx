import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { EnhancedFeeStats } from "./fee-management/EnhancedFeeStats";
import { BulkActionsPanel } from "./fee-management/BulkActionsPanel";
import { EnhancedFeeTable } from "./fee-management/EnhancedFeeTable";
import { EnhancedFilters } from "./fee-management/EnhancedFilters";
import { ExportButtons } from "./fee-management/ExportButtons";
import { DiscountDialog } from "./fee-management/DiscountDialog";
import { PaymentRecordDialog } from "./fee-management/PaymentRecordDialog";
import { ReminderDialog } from "./fee-management/ReminderDialog";
import { StudentPaymentHistory } from "./student-management/StudentPaymentHistory";
import { PaymentHistoryErrorBoundary } from "./student-management/PaymentHistoryErrorBoundary";
import { useFeeData } from "./fee-management/useFeeData";
import { useFeeManagement } from "./fee-management/useFeeManagement";
import { FeeTypeValidator } from "./fee-management/FeeTypeValidator";

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
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [selectedFee, setSelectedFee] = React.useState(null);
  const [selectedFees, setSelectedFees] = React.useState<Set<string>>(new Set());

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
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const handleHistoryClick = (student) => {
    console.log('🔍 History clicked for student:', student);
    
    if (!student) {
      console.warn('⚠️ No student data provided for history');
      return;
    }
    
    try {
      // Get all fees for this student across all fee systems
      const studentFees = fees.filter(fee => fee.student_id === student.id);
      console.log('📊 Student fees found:', studentFees.length);
      
      if (studentFees.length === 0) {
        console.warn('⚠️ No fees found for student:', student.id);
        // Still open the dialog to show "no records" message
      }
      
      // Open history dialog with comprehensive fee data
      openHistoryDialog(student, studentFees);
    } catch (error) {
      console.error('❌ Error opening history dialog:', error);
    }
  };

  const handleReminderClick = (fee) => {
    setSelectedFees(new Set([fee.id]));
    setReminderDialogOpen(true);
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

      <EnhancedFeeStats fees={filteredFees} filters={filters} />

      <BulkActionsPanel
        fees={filteredFees}
        selectedFees={selectedFees}
        onSelectionChange={setSelectedFees}
        onRefresh={refetchFees}
        onBulkReminder={(feeIds) => {
          setSelectedFees(new Set(feeIds));
          setReminderDialogOpen(true);
        }}
      />

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Fee Records</h3>
          <ExportButtons fees={filteredFees} filters={filters} />
        </div>

        <EnhancedFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          filters={filters as any}
          onFiltersChange={setFilters as any}
          classes={classes}
        />

        <EnhancedFeeTable
          fees={filteredFees}
          selectedFees={selectedFees}
          onSelectionChange={setSelectedFees}
          onPaymentClick={handlePaymentClick}
          onDiscountClick={handleDiscountClick}
          onHistoryClick={handleHistoryClick}
          onNotesEdit={async (feeId, notes) => {
            try {
              const { error } = await supabase
                .from('fees')
                .update({ notes } as any)
                .eq('id', feeId);
                
              if (error) throw error;
              refetchFees();
            } catch (error) {
              console.error('Error updating notes:', error);
            }
          }}
          onReminderClick={handleReminderClick}
        />
      </div>

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        selectedFee={selectedFee}
        onSuccess={refetchFees}
      />

      <PaymentRecordDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        fee={selectedFee}
        onSuccess={refetchFees}
      />

      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        fees={filteredFees.filter(f => selectedFees.has(f.id))}
        onSuccess={refetchFees}
      />

      <PaymentHistoryErrorBoundary>
        <StudentPaymentHistory
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          studentName={selectedStudentName}
          fees={selectedStudentFees as any}
          academicYears={academicYears}
          selectedAcademicYear={currentAcademicYear}
        />
      </PaymentHistoryErrorBoundary>
    </div>
  );
}
