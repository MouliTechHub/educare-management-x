
import React, { useState } from "react";
import { FeeManagementHeader } from "@/components/modules/fee-management/FeeManagementHeader";
import { FeeStats } from "@/components/modules/fee-management/FeeStats";
import { FeeManagementContent } from "@/components/modules/fee-management/FeeManagementContent";
import { PaymentDialog } from "@/components/modules/fee-management/PaymentDialog";
import { DiscountDialog } from "@/components/modules/fee-management/DiscountDialog";
import { StudentPaymentHistory } from "@/components/modules/student-management/StudentPaymentHistory";
import { useFeeData } from "@/components/modules/fee-management/useFeeData";
import { useFeeManagement } from "@/components/modules/fee-management/useFeeManagement";

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

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  const currentYear = academicYears.find(year => year.id === currentAcademicYear);
  const filteredFees = applyFilters(fees);

  const handlePaymentClick = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const handleDiscountClick = (fee: Fee) => {
    setSelectedFee(fee);
    setDiscountDialogOpen(true);
  };

  const handleHistoryClick = (student: Fee['student']) => {
    openHistoryDialog(student, fees);
  };

  const handlePaymentRecorded = () => {
    setPaymentDialogOpen(false);
    setSelectedFee(null);
    refetchFees(); // Refresh data after payment
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading fee management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        fee={selectedFee}
        onPaymentRecorded={handlePaymentRecorded}
        academicYearName={currentYear?.year_name}
      />

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        fee={selectedFee}
        onDiscountApplied={refetchFees}
        academicYearName={currentYear?.year_name}
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
