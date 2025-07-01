
import React, { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { YearWiseSummaryCards } from "./fee-management/YearWiseSummaryCards";
import { FeeRecordsSection } from "./fee-management/components/FeeRecordsSection";
import { DiscountDialog } from "./fee-management/DiscountDialog";
import { EnhancedPaymentDialog } from "./fee-management/EnhancedPaymentDialog";
import { FeeHistoryDialog } from "./fee-management/FeeHistoryDialog";
import { ExportDialog } from "./fee-management/ExportDialog";
import { CreateFeeRecordsButton } from "./fee-management/CreateFeeRecordsButton";
import { useFeeRecords } from "./fee-management/hooks/useFeeRecords";
import { useAcademicYears } from "./fee-management/hooks/useAcademicYears";
import { useFeeActions } from "./fee-management/hooks/useFeeActions";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

export function EnhancedFeeManagement() {
  console.log('EnhancedFeeManagement component rendering...');
  
  // Use the new focused hooks
  const { academicYears, currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useAcademicYears();
  const { feeRecords, loading, refetchFeeRecords } = useFeeRecords(selectedAcademicYear);
  const { updateDiscount, recordPayment, getChangeHistory, getPaymentHistory } = useFeeActions();
  
  // Dialog states
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState<StudentFeeRecord | null>(null);

  console.log('Enhanced Fee Management data:', { 
    feeRecords: feeRecords.length, 
    academicYears: academicYears.length, 
    loading,
    selectedAcademicYear 
  });

  // Dialog handlers
  const handleDiscountClick = (feeRecord: StudentFeeRecord) => {
    setSelectedFeeRecord(feeRecord);
    setDiscountDialogOpen(true);
  };

  const handlePaymentClick = (feeRecord: StudentFeeRecord) => {
    setSelectedFeeRecord(feeRecord);
    setPaymentDialogOpen(true);
  };

  const handleHistoryClick = (feeRecord: StudentFeeRecord) => {
    setSelectedFeeRecord(feeRecord);
    setHistoryDialogOpen(true);
  };

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleReportsClick = () => {
    console.log('Navigate to detailed reports page');
  };

  const handleDiscountUpdate = async (recordId: string, data: any) => {
    await updateDiscount(recordId, data);
    refetchFeeRecords();
  };

  const handlePaymentRecord = async (paymentData: any) => {
    await recordPayment(paymentData);
    refetchFeeRecords();
  };

  const handleRefresh = () => {
    console.log('Refreshing fee records...');
    refetchFeeRecords();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading enhanced fee management data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-blue-900 font-semibold mb-2">🚀 Enhanced Fee Management System</h3>
        <div className="text-sm text-blue-800 space-y-1">
          <p>✅ Automatic fee record creation for students</p>
          <p>✅ Real-time discount and payment management</p>
          <p>✅ Complete payment history and change tracking</p>
          <p>✅ Export capabilities and detailed reporting</p>
          <p>📊 Total Fee Records: {feeRecords.length}</p>
          <p>📚 Academic Years: {academicYears.length}</p>
          <p>📅 Selected Year: {currentAcademicYear?.year_name || 'None'}</p>
        </div>
      </div>

      <FeeManagementHeader
        academicYears={academicYears}
        selectedAcademicYear={selectedAcademicYear}
        onYearChange={setSelectedAcademicYear}
      />

      <YearWiseSummaryCards summary={{
        academicYear: currentAcademicYear?.year_name || 'No Year Selected',
        totalCollected: feeRecords.reduce((sum, record) => sum + record.paid_amount, 0),
        totalPending: feeRecords.reduce((sum, record) => sum + record.balance_fee, 0),
        totalDiscount: feeRecords.reduce((sum, record) => sum + record.discount_amount, 0),
        totalStudents: feeRecords.length,
        collectionRate: feeRecords.length > 0 ? 
          (feeRecords.reduce((sum, record) => sum + record.paid_amount, 0) / 
           feeRecords.reduce((sum, record) => sum + record.actual_fee, 0)) * 100 : 0,
        overdueCount: feeRecords.filter(r => r.status === 'Overdue').length
      }} />

      {feeRecords.length === 0 && selectedAcademicYear && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h3 className="text-yellow-800 font-semibold mb-2">⚠️ No Fee Records Found</h3>
              <div className="text-yellow-700 text-sm space-y-2 mb-4">
                <p><strong>The system couldn't find any fee records for the selected academic year.</strong></p>
                <p>This usually happens when:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Students haven't been assigned fee records yet</li>
                  <li>Fee structures haven't been set up for classes</li>
                  <li>The academic year selection is incorrect</li>
                </ul>
              </div>
              <div className="flex space-x-3">
                <CreateFeeRecordsButton 
                  academicYearId={selectedAcademicYear} 
                  onRecordsCreated={refetchFeeRecords}
                />
                <Button
                  variant="outline"
                  onClick={handleRefresh}
                  className="bg-white hover:bg-gray-50"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <FeeRecordsSection
        feeRecords={feeRecords}
        selectedAcademicYear={selectedAcademicYear}
        currentYear={currentAcademicYear}
        onDiscountClick={handleDiscountClick}
        onPaymentClick={handlePaymentClick}
        onHistoryClick={handleHistoryClick}
        onRefreshClick={handleRefresh}
        onExportClick={handleExportClick}
        onReportsClick={handleReportsClick}
        onRecordsCreated={refetchFeeRecords}
      />

      {/* Dialogs */}
      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        feeRecord={selectedFeeRecord}
        onDiscountUpdate={handleDiscountUpdate}
      />

      <EnhancedPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        feeRecord={selectedFeeRecord}
        onPaymentRecord={handlePaymentRecord}
        academicYearName={currentAcademicYear?.year_name}
      />

      <FeeHistoryDialog
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        feeRecord={selectedFeeRecord}
        getChangeHistory={getChangeHistory}
        getPaymentHistory={getPaymentHistory}
      />

      <ExportDialog
        open={exportDialogOpen}
        onOpenChange={setExportDialogOpen}
        feeRecords={feeRecords}
        academicYear={currentAcademicYear}
        filters={{}}
      />
    </div>
  );
}
