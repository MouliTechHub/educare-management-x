import React from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, BarChart3, AlertTriangle, Users, PieChart, Filter, Sparkles } from "lucide-react";
import { FeeManagementHeader } from "./fee-management/FeeManagementHeader";
import { EnhancedFeeStats } from "./fee-management/EnhancedFeeStats";
import { BulkActionsPanel } from "./fee-management/BulkActionsPanel";
import { FeeTable } from "./fee-management/FeeTable";
import { EnhancedFilters } from "./fee-management/EnhancedFilters";
import { ExportButtons } from "./fee-management/ExportButtons";
import { DiscountDialog } from "./fee-management/DiscountDialog";
import { PaymentRecordDialog } from "./fee-management/PaymentRecordDialog";
import { ReminderDialog } from "./fee-management/ReminderDialog";
import { DiscountHistoryDialog } from "./fee-management/DiscountHistoryDialog";
import { StudentPaymentHistory } from "./student-management/StudentPaymentHistory";
import { PaymentHistoryErrorBoundary } from "./student-management/PaymentHistoryErrorBoundary";
import { EnhancedPaymentHistoryDialog } from "./fee-management/EnhancedPaymentHistoryDialog";
import { useFeeRecordsWithDues } from "./fee-management/hooks/useFeeRecordsWithDues";
import { useFeeData } from "./fee-management/useFeeData";
import { useFeeManagement } from "./fee-management/useFeeManagement";
import { usePreviousYearDues } from "./fee-management/hooks/usePreviousYearDues";
import { BlockedStudentsReport } from "./fee-management/BlockedStudentsReport";
import { Fee } from "./fee-management/types/feeTypes";
import EnhancedFeeManagement from "./fee-management/EnhancedFeeManagement";
import { PreviousYearDuesSummary } from "./fee-management/PreviousYearDuesSummary";
import { DuesCalculationVerifier } from "./fee-management/DuesCalculationVerifier";
import { PreviousYearDuesConsolidated } from "./fee-management/PreviousYearDuesConsolidated";

export default function FeeManagement() {
  const {
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear
  } = useFeeData();

  const {
    fees,
    loading,
    refetchFees
  } = useFeeRecordsWithDues(currentAcademicYear?.id || '');

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

  const { 
    getStudentDues, 
    hasOutstandingDues, 
    logPaymentBlockage, 
    previousYearDues, 
    refetch: refetchDues 
  } = usePreviousYearDues(currentAcademicYear?.id || '');

  const [discountDialogOpen, setDiscountDialogOpen] = React.useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [reminderDialogOpen, setReminderDialogOpen] = React.useState(false);
  const [discountHistoryDialogOpen, setDiscountHistoryDialogOpen] = React.useState(false);
  const [selectedFee, setSelectedFee] = React.useState<Fee | null>(null);
  const [selectedFees, setSelectedFees] = React.useState<Set<string>>(new Set());
  const [calculationIssues, setCalculationIssues] = React.useState<any[]>([]);
  const [showDuesDetails, setShowDuesDetails] = React.useState(false);
  
  // Toggle states for collapsible sections
  const [showReports, setShowReports] = React.useState(false);
  const [showBlockedStudents, setShowBlockedStudents] = React.useState(false);
  const [showBulkActions, setShowBulkActions] = React.useState(false);
  const [showStats, setShowStats] = React.useState(true);
  const [showFilters, setShowFilters] = React.useState(true);
  const [showDuesManagement, setShowDuesManagement] = React.useState(true);
  const [showCalculationVerifier, setShowCalculationVerifier] = React.useState(false);
  const [showEnhancedHistory, setShowEnhancedHistory] = React.useState(false);

  // Apply filters to fees - ensure we're working with Fee[] type and handle loading state
  const filteredFees = React.useMemo(() => {
    if (loading || !fees) return [];
    
    return fees.filter(fee => {
      if (!searchTerm) return true;
      
      const searchLower = searchTerm.toLowerCase();
      return (
        fee.student?.first_name?.toLowerCase().includes(searchLower) ||
        fee.student?.last_name?.toLowerCase().includes(searchLower) ||
        fee.student?.admission_number?.toLowerCase().includes(searchLower) ||
        fee.fee_type?.toLowerCase().includes(searchLower)
      );
    });
  }, [loading, fees, searchTerm, applyFilters]);

  const handleDiscountClick = (fee: any) => {
    setSelectedFee(fee as Fee);
    setDiscountDialogOpen(true);
  };

  const handlePaymentClick = (fee: any) => {
    setSelectedFee(fee as Fee);
    setPaymentDialogOpen(true);
  };

  const handleHistoryClick = (student: any) => {
    console.log('📋 Opening enhanced payment history for student:', student);
    setShowEnhancedHistory(true);
    
    // Also set for fallback compatibility
    try {
      const studentFees = fees.filter(fee => fee.student_id === student.id);
      openHistoryDialog(student, studentFees as any);
    } catch (error) {
      console.error('❌ Error opening history dialog:', error);
    }
  };

  const handleReminderClick = (fee: Fee) => {
    setSelectedFees(new Set([fee.id]));
    setReminderDialogOpen(true);
  };

  const handleDiscountHistoryClick = (fee: Fee) => {
    setSelectedFee(fee);
    setDiscountHistoryDialogOpen(true);
  };

  const handleSendBulkReminders = () => {
    // Implementation for bulk reminders
    console.log('Sending bulk reminders for previous year dues');
  };

  const handleViewAllDuesDetails = () => {
    setShowDuesDetails(true);
  };

  const handleClearStudentDues = (studentId: string) => {
    console.log('Clearing dues for student:', studentId);
    // Implementation for clearing dues
  };

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

  // Show message if no academic year is selected
  if (!currentAcademicYear) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">No Academic Year Found</h2>
          <p className="text-gray-600">Please create an academic year first to manage fees.</p>
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
        onRefresh={() => {
          refetchFees();
          refetchDues();
        }}
      />

      <Tabs defaultValue="classic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="classic">Classic Fee Management</TabsTrigger>
          <TabsTrigger value="enhanced" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Enhanced Fee Management
          </TabsTrigger>
        </TabsList>

        <TabsContent value="classic" className="space-y-6 mt-6">
          {/* Enhanced Previous Year Dues Management */}
          <Collapsible open={showDuesManagement} onOpenChange={setShowDuesManagement}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between h-12 text-left font-medium border-red-200 bg-red-50 hover:bg-red-100"
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  Previous Year Dues Management
                  {previousYearDues.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {previousYearDues.length} students with dues
                    </Badge>
                  )}
                </div>
                {showDuesManagement ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="space-y-4">
                <PreviousYearDuesSummary
                  allDues={previousYearDues}
                  loading={loading}
                  onRefresh={refetchDues}
                  onSendBulkReminders={handleSendBulkReminders}
                  onViewAllDetails={handleViewAllDuesDetails}
                />
                
                {/* Consolidated Previous Year Dues Display */}
                 <PreviousYearDuesConsolidated
                  studentFees={filteredFees as any}
                  onViewDetails={handleHistoryClick}
                  onMakePayment={handlePaymentClick}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Calculation Verification */}
          <Collapsible open={showCalculationVerifier} onOpenChange={setShowCalculationVerifier}>
            <CollapsibleTrigger asChild>
              <Button 
                variant="outline" 
                className="w-full justify-between h-12 text-left font-medium"
              >
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Calculation Verification & Audit
                  {calculationIssues.length > 0 && (
                    <Badge variant="destructive" className="ml-2">
                      {calculationIssues.length} issues
                    </Badge>
                  )}
                </div>
                {showCalculationVerifier ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <DuesCalculationVerifier
                currentAcademicYearId={currentAcademicYear?.id || ''}
                onIssuesFound={setCalculationIssues}
              />
            </CollapsibleContent>
          </Collapsible>

          {/* Original Content Starts Here */}
          <Collapsible open={showStats} onOpenChange={setShowStats}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 text-left font-medium"
          >
            <div className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Fee Statistics & Overview
            </div>
            {showStats ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <EnhancedFeeStats fees={filteredFees as any} filters={filters} />
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Advanced Reports Section */}
      <Collapsible open={showReports} onOpenChange={setShowReports}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 text-left font-medium"
          >
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Advanced Reports & Export
            </div>
            {showReports ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <div className="space-y-4 p-4 border rounded-lg bg-muted/20">
            <ExportButtons fees={filteredFees as any} filters={filters} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Blocked Students Section */}
      <Collapsible open={showBlockedStudents} onOpenChange={setShowBlockedStudents}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 text-left font-medium"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Payment Blocked Students
            </div>
            {showBlockedStudents ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <BlockedStudentsReport 
            fees={filteredFees as any}
            currentAcademicYear={currentAcademicYear?.id || ''}
          />
        </CollapsibleContent>
      </Collapsible>

      {/* Collapsible Bulk Actions Section */}
      <Collapsible open={showBulkActions} onOpenChange={setShowBulkActions}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-12 text-left font-medium"
          >
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Bulk Actions
            </div>
            {showBulkActions ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-4">
          <BulkActionsPanel
            fees={filteredFees as any}
            selectedFees={selectedFees}
            onSelectionChange={setSelectedFees}
            onRefresh={refetchFees}
            onBulkReminder={(feeIds) => {
              setSelectedFees(new Set(feeIds));
              setReminderDialogOpen(true);
            }}
          />
        </CollapsibleContent>
      </Collapsible>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Fee Records</h3>
        </div>

        {/* Collapsible Search & Filters Section */}
        <Collapsible open={showFilters} onOpenChange={setShowFilters}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="outline" 
              className="w-full justify-between h-12 text-left font-medium"
            >
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Search & Filters
              </div>
              {showFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-4">
            <EnhancedFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              filters={filters as any}
              onFiltersChange={setFilters as any}
              classes={classes}
            />
          </CollapsibleContent>
        </Collapsible>

        <FeeTable
          fees={filteredFees}
          onPaymentClick={handlePaymentClick}
          onDiscountClick={handleDiscountClick}
          onHistoryClick={handleHistoryClick}
        />
      </div>

      {/* Show message if no fee records found */}
      {!loading && filteredFees.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">No Fee Records Found</h3>
          <p className="text-gray-600 mb-4">
            There are no fee records for the current academic year ({currentAcademicYear.year_name}).
          </p>
          <p className="text-sm text-gray-500">
            Fee records are created automatically when students are added or you can create them manually.
          </p>
        </div>
      )}

        </TabsContent>

        <TabsContent value="enhanced" className="mt-6">
          <EnhancedFeeManagement />
        </TabsContent>
      </Tabs>

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
        currentAcademicYear={currentAcademicYear}
      />

      <ReminderDialog
        open={reminderDialogOpen}
        onOpenChange={setReminderDialogOpen}
        fees={filteredFees.filter(f => selectedFees.has(f.id)) as any}
        onSuccess={refetchFees}
      />

      <DiscountHistoryDialog
        open={discountHistoryDialogOpen}
        onOpenChange={setDiscountHistoryDialogOpen}
        feeId={selectedFee?.id || ''}
        studentName={selectedFee ? `${selectedFee.student?.first_name} ${selectedFee.student?.last_name}` : ''}
        feeType={selectedFee?.fee_type || ''}
      />

      <EnhancedPaymentHistoryDialog
        open={showEnhancedHistory}
        onOpenChange={(open) => {
          setShowEnhancedHistory(open);
          if (!open) {
            setHistoryDialogOpen(false);
          }
        }}
        student={selectedStudentFees && selectedStudentFees.length > 0 ? {
          id: selectedStudentFees[0].student_id,
          first_name: selectedStudentName?.split(' ')[0] || '',
          last_name: selectedStudentName?.split(' ').slice(1).join(' ') || '',
          admission_number: selectedStudentFees[0].student?.admission_number || ''
        } : null}
        currentAcademicYearId={currentAcademicYear?.id || ''}
      />

      {!showEnhancedHistory && (
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
      )}
    </div>
  );
}
