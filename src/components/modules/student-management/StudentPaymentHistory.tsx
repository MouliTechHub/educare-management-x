
import { Dialog, DialogContent, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Fee } from "@/types/database";
import { PaymentReversalDialog } from "../fee-management/PaymentReversalDialog";
import { PaymentHistoryFilters } from "./PaymentHistoryFilters";
import { FeeRecordsTab } from "./FeeRecordsTab";
import { PaymentHistoryTab } from "./PaymentHistoryTab";
import { PaymentHistoryDialogHeader } from "./PaymentHistoryDialogHeader";
import { PaymentHistoryEmptyState } from "./PaymentHistoryEmptyState";
import { useStudentPaymentHistory } from "./useStudentPaymentHistory";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Loader2 } from "lucide-react";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

interface StudentPaymentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  fees: Fee[];
  academicYears?: AcademicYear[];
  selectedAcademicYear?: string;
}

export function StudentPaymentHistory({ 
  open, 
  onOpenChange, 
  studentName, 
  fees,
  academicYears = [],
  selectedAcademicYear 
}: StudentPaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentAcademicYear, setCurrentAcademicYear] = useState(selectedAcademicYear || "all");

  const {
    paymentHistory,
    paymentReversals,
    loading,
    error,
    reversalDialogOpen,
    setReversalDialogOpen,
    selectedPayment,
    openReversalDialog,
    fetchPaymentHistory
  } = useStudentPaymentHistory(fees, currentAcademicYear === "all" ? "" : currentAcademicYear);

  useEffect(() => {
    if (open && fees && fees.length > 0) {
      console.log('📖 Payment history dialog opened, fetching data...');
      fetchPaymentHistory();
    }
  }, [open, fees, currentAcademicYear]);

  // Handle case where no student name is provided
  const displayStudentName = studentName || 'Unknown Student';

  // Handle case where no fees are provided
  if (!fees || fees.length === 0) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">
            Payment history for student with no fee records
          </DialogDescription>
          <PaymentHistoryDialogHeader 
            studentName={displayStudentName} 
            currentYear={academicYears.find(year => year.id === currentAcademicYear)} 
          />
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No fee records found for this student. Please check if the student has been assigned any fees.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    );
  }

  const currentYear = academicYears.find(year => year.id === currentAcademicYear);
  const yearFilteredFees = currentAcademicYear && currentAcademicYear !== "all"
    ? fees.filter(fee => fee.academic_year_id === currentAcademicYear)
    : fees;

  const filteredFees = yearFilteredFees.filter(fee => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      fee.fee_type?.toLowerCase().includes(searchLower) ||
      fee.status?.toLowerCase().includes(searchLower) ||
      (fee.receipt_number && fee.receipt_number.toLowerCase().includes(searchLower))
    );
  });

  const filteredPaymentHistory = paymentHistory.filter(payment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      payment.fee_type?.toLowerCase().includes(searchLower) ||
      payment.payment_method?.toLowerCase().includes(searchLower) ||
      payment.payment_receiver?.toLowerCase().includes(searchLower) ||
      payment.receipt_number?.toLowerCase().includes(searchLower)
    );
  });

  const showEmptyState = !loading && !error && filteredFees.length === 0 && filteredPaymentHistory.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <DialogDescription className="sr-only">
            Complete payment history and fee records for {displayStudentName}
          </DialogDescription>
          <PaymentHistoryDialogHeader 
            studentName={displayStudentName} 
            currentYear={currentYear} 
          />
          
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-6">
              <h3 className="font-semibold text-amber-900 mb-3 text-lg">🏫 Management Overview Dashboard</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <p className="text-amber-800">
                    <strong>📈 Strategic Analysis:</strong> Complete financial overview for leadership decisions
                  </p>
                  <p className="text-amber-800">
                    <strong>⏰ Time-based Insights:</strong> Track payment patterns throughout the day
                  </p>
                  <p className="text-amber-800">
                    <strong>🔍 Detailed Auditing:</strong> Every transaction with exact timestamps
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-amber-800">
                    <strong>💼 Executive Summary:</strong> High-level view of student financial status
                  </p>
                  <p className="text-amber-800">
                    <strong>📊 Compliance Tracking:</strong> Full audit trail for regulatory requirements
                  </p>
                  <p className="text-amber-800">
                    <strong>🎯 Performance Metrics:</strong> Data for operational improvements
                  </p>
                </div>
              </div>
            </div>

            <PaymentHistoryFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              academicYears={academicYears}
              currentAcademicYear={currentAcademicYear}
              onYearChange={setCurrentAcademicYear}
            />

            {/* Show loading state */}
            {loading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading payment history...</span>
              </div>
            )}

            {/* Show error state */}
            {error && !loading && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {error}. Please try refreshing or contact support if the issue persists.
                </AlertDescription>
              </Alert>
            )}

            {/* Show content when not loading and no error */}
            {!loading && !error && (
              <Tabs defaultValue="payments" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="payments" className="flex items-center space-x-2">
                    <span>🕐 Detailed Payment Timeline ({filteredPaymentHistory.length})</span>
                  </TabsTrigger>
                  <TabsTrigger value="fees" className="flex items-center space-x-2">
                    <span>📋 Fee Structure Summary ({filteredFees.length})</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="payments" className="space-y-4">
                  <PaymentHistoryTab
                    paymentHistory={filteredPaymentHistory}
                    paymentReversals={paymentReversals}
                    loading={loading}
                    onReversalClick={openReversalDialog}
                  />
                </TabsContent>
                
                <TabsContent value="fees" className="space-y-4">
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h3 className="font-medium text-yellow-900 mb-2">Fee Structure Overview</h3>
                    <p className="text-sm text-yellow-700">
                      This shows the consolidated fee structure and payment status. 
                      For detailed transaction history with timestamps, use the "Detailed Payment Timeline" tab.
                    </p>
                  </div>
                  <FeeRecordsTab fees={filteredFees} />
                </TabsContent>
              </Tabs>
            )}

            {showEmptyState && <PaymentHistoryEmptyState />}
          </div>
        </DialogContent>
      </Dialog>

      <PaymentReversalDialog
        open={reversalDialogOpen}
        onOpenChange={setReversalDialogOpen}
        payment={selectedPayment}
        onReversalRecorded={fetchPaymentHistory}
      />
    </>
  );
}
