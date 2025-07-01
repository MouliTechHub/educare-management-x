
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, BarChart3, Search } from "lucide-react";
import { useEnhancedFeeData } from "./fee-management/useEnhancedFeeData";
import { useFeeManagement } from "./fee-management/useFeeManagement";
import { EnhancedFeeTable } from "./fee-management/EnhancedFeeTable";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { YearWiseSummaryCards } from "./fee-management/YearWiseSummaryCards";
import { FeeManagementFilters } from "./fee-management/FeeManagementFilters";
import { DiscountDialog } from "./fee-management/DiscountDialog";
import { EnhancedPaymentDialog } from "./fee-management/EnhancedPaymentDialog";
import { FeeHistoryDialog } from "./fee-management/FeeHistoryDialog";
import { ExportDialog } from "./fee-management/ExportDialog";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

export function EnhancedFeeManagement() {
  console.log('EnhancedFeeManagement component rendering...');
  
  const { 
    feeRecords, 
    academicYears, 
    selectedAcademicYear, 
    setSelectedAcademicYear, 
    loading,
    updateDiscount,
    recordPayment,
    getChangeHistory,
    getPaymentHistory
  } = useEnhancedFeeData();
  
  const {
    classes,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    applyFilters
  } = useFeeManagement();

  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = useState<StudentFeeRecord | null>(null);

  console.log('Enhanced Fee Management data:', { 
    feeRecords: feeRecords.length, 
    academicYears: academicYears.length, 
    loading 
  });

  const handleDiscountClick = (feeRecord: StudentFeeRecord) => {
    console.log('Discount clicked for fee record:', feeRecord);
    setSelectedFeeRecord(feeRecord);
    setDiscountDialogOpen(true);
  };

  const handlePaymentClick = (feeRecord: StudentFeeRecord) => {
    console.log('Payment clicked for fee record:', feeRecord);
    setSelectedFeeRecord(feeRecord);
    setPaymentDialogOpen(true);
  };

  const handleHistoryClick = (feeRecord: StudentFeeRecord) => {
    console.log('History clicked for fee record:', feeRecord);
    setSelectedFeeRecord(feeRecord);
    setHistoryDialogOpen(true);
  };

  const handleExportClick = () => {
    setExportDialogOpen(true);
  };

  const handleReportsClick = () => {
    // Navigate to reports page (implement later)
    console.log('Navigate to detailed reports page');
  };

  if (loading) {
    console.log('Enhanced Fee Management is loading...');
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading enhanced fee management data...</p>
      </div>
    );
  }

  const currentYear = academicYears.find(year => year.id === selectedAcademicYear);
  const filteredFeeRecords = applyFilters(feeRecords);
  
  console.log('Rendering Enhanced Fee Management with:', {
    currentYear: currentYear?.year_name,
    filteredRecordsCount: filteredFeeRecords.length,
    totalRecordsCount: feeRecords.length
  });

  return (
    <div className="space-y-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <h3 className="text-green-900 font-semibold mb-2">🚀 Enhanced Fee Management System</h3>
        <div className="text-sm text-green-800 space-y-1">
          <p>✅ Automatic tuition fee assignment for new students</p>
          <p>✅ Real-time discount and payment management</p>
          <p>✅ Complete payment history and change tracking</p>
          <p>✅ Export capabilities and detailed reporting</p>
          <p>📊 Total Fee Records: {feeRecords.length} | Filtered: {filteredFeeRecords.length}</p>
        </div>
      </div>

      <FeeManagementHeader
        academicYears={academicYears}
        selectedAcademicYear={selectedAcademicYear}
        onYearChange={setSelectedAcademicYear}
      />

      <YearWiseSummaryCards summary={{
        totalAmount: feeRecords.reduce((sum, record) => sum + record.actual_fee, 0),
        totalPaid: feeRecords.reduce((sum, record) => sum + record.paid_amount, 0),
        totalPending: feeRecords.reduce((sum, record) => sum + record.balance_fee, 0),
        totalDiscounts: feeRecords.reduce((sum, record) => sum + record.discount_amount, 0),
        pendingCount: feeRecords.filter(r => r.status === 'Pending').length,
        paidCount: feeRecords.filter(r => r.status === 'Paid').length,
        overdueCount: feeRecords.filter(r => r.status === 'Overdue').length,
        partialCount: feeRecords.filter(r => r.status === 'Partial').length
      }} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Enhanced Fee Records</CardTitle>
              <CardDescription>
                Complete fee management with automatic assignment, discount tracking, and payment history
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
              <Button
                variant="outline"
                onClick={handleExportClick}
                className="bg-blue-50 hover:bg-blue-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button
                variant="outline"
                onClick={handleReportsClick}
                className="bg-purple-50 hover:bg-purple-100"
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Reports
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeeManagementFilters
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            filters={filters}
            onFiltersChange={setFilters}
            classes={classes}
          />

          <EnhancedFeeTable
            feeRecords={filteredFeeRecords}
            onDiscountClick={handleDiscountClick}
            onPaymentClick={handlePaymentClick}
            onHistoryClick={handleHistoryClick}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        feeRecord={selectedFeeRecord}
        onDiscountUpdate={updateDiscount}
      />

      <EnhancedPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        feeRecord={selectedFeeRecord}
        onPaymentRecord={recordPayment}
        academicYearName={currentYear?.year_name}
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
        feeRecords={filteredFeeRecords}
        academicYear={currentYear}
        filters={filters}
      />
    </div>
  );
}
