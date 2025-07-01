
import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, FileText, BarChart3, Search, RefreshCw, AlertCircle } from "lucide-react";
import { useEnhancedFeeData } from "./fee-management/useEnhancedFeeData";
import { EnhancedFeeTable } from "./fee-management/EnhancedFeeTable";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { YearWiseSummaryCards } from "./fee-management/YearWiseSummaryCards";
import { FeeManagementFilters } from "./fee-management/FeeManagementFilters";
import { DiscountDialog } from "./fee-management/DiscountDialog";
import { EnhancedPaymentDialog } from "./fee-management/EnhancedPaymentDialog";
import { FeeHistoryDialog } from "./fee-management/FeeHistoryDialog";
import { ExportDialog } from "./fee-management/ExportDialog";
import { CreateFeeRecordsButton } from "./fee-management/CreateFeeRecordsButton";
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
    getPaymentHistory,
    refetchFeeRecords
  } = useEnhancedFeeData();
  
  // Create a simple filter system for the enhanced fee records
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    status: '',
    feeType: '',
    class: ''
  });

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

  const handleRefreshClick = () => {
    console.log('Manual refresh triggered');
    refetchFeeRecords();
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
  
  // Apply simple filters to fee records
  const filteredFeeRecords = feeRecords.filter(record => {
    const matchesSearch = searchTerm === '' || 
      (record.student?.first_name + ' ' + record.student?.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.student?.class_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filters.status === '' || record.status === filters.status;
    const matchesFeeType = filters.feeType === '' || record.fee_type === filters.feeType;
    const matchesClass = filters.class === '' || record.student?.class_name === filters.class;
    
    return matchesSearch && matchesStatus && matchesFeeType && matchesClass;
  });
  
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
          
          {feeRecords.length === 0 && selectedAcademicYear && (
            <div className="bg-orange-100 border border-orange-300 rounded p-4 mt-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-orange-800 font-medium mb-2">⚠️ No fee records found for your students!</p>
                  <div className="text-orange-700 text-sm space-y-2">
                    <p><strong>This could mean:</strong></p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Students have been added but fee records haven't been created yet</li>
                      <li>Fee structures haven't been set up for this academic year</li>
                      <li>There's a mismatch between student classes and fee structure classes</li>
                    </ul>
                    <p><strong>To fix this:</strong></p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>First, ensure fee structures are set up in <strong>Fee Structure Management</strong></li>
                      <li>Then use the button below to create fee records for all students</li>
                    </ol>
                  </div>
                  <div className="mt-4">
                    <CreateFeeRecordsButton 
                      academicYearId={selectedAcademicYear} 
                      onRecordsCreated={refetchFeeRecords}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FeeManagementHeader
        academicYears={academicYears}
        selectedAcademicYear={selectedAcademicYear}
        onYearChange={setSelectedAcademicYear}
      />

      <YearWiseSummaryCards summary={{
        academicYear: currentYear?.year_name || 'Unknown Year',
        totalCollected: feeRecords.reduce((sum, record) => sum + record.paid_amount, 0),
        totalPending: feeRecords.reduce((sum, record) => sum + record.balance_fee, 0),
        totalDiscount: feeRecords.reduce((sum, record) => sum + record.discount_amount, 0),
        totalStudents: feeRecords.length,
        collectionRate: feeRecords.length > 0 ? 
          (feeRecords.reduce((sum, record) => sum + record.paid_amount, 0) / 
           feeRecords.reduce((sum, record) => sum + record.actual_fee, 0)) * 100 : 0,
        overdueCount: feeRecords.filter(r => r.status === 'Overdue').length
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
              {selectedAcademicYear && feeRecords.length === 0 && (
                <CreateFeeRecordsButton 
                  academicYearId={selectedAcademicYear} 
                  onRecordsCreated={refetchFeeRecords}
                />
              )}
              <Button
                variant="outline"
                onClick={handleRefreshClick}
                className="bg-gray-50 hover:bg-gray-100"
                title="Refresh fee records"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
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
          <div className="flex space-x-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Paid">Paid</option>
              <option value="Overdue">Overdue</option>
              <option value="Partial">Partial</option>
            </select>
            
            <select
              value={filters.feeType}
              onChange={(e) => setFilters(prev => ({ ...prev, feeType: e.target.value }))}
              className="px-3 py-2 border rounded-md"
            >
              <option value="">All Fee Types</option>
              <option value="Tuition Fee">Tuition Fee</option>
              <option value="Transport Fee">Transport Fee</option>
              <option value="Exam Fee">Exam Fee</option>
            </select>
          </div>

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
