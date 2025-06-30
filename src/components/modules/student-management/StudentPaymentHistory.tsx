
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [currentAcademicYear, setCurrentAcademicYear] = useState(selectedAcademicYear || "");

  const {
    paymentHistory,
    paymentReversals,
    loading,
    reversalDialogOpen,
    setReversalDialogOpen,
    selectedPayment,
    openReversalDialog,
    fetchPaymentHistory
  } = useStudentPaymentHistory(fees, currentAcademicYear);

  useEffect(() => {
    if (open) {
      fetchPaymentHistory();
    }
  }, [open, fees, currentAcademicYear]);

  const currentYear = academicYears.find(year => year.id === currentAcademicYear);
  const yearFilteredFees = currentAcademicYear 
    ? fees.filter(fee => fee.academic_year_id === currentAcademicYear)
    : fees;

  const filteredFees = yearFilteredFees.filter(fee =>
    fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fee.receipt_number && fee.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredPaymentHistory = paymentHistory.filter(payment =>
    payment.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_method.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.payment_receiver.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.receipt_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const showEmptyState = filteredFees.length === 0 && filteredPaymentHistory.length === 0;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
          <PaymentHistoryDialogHeader 
            studentName={studentName} 
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

            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payments" className="flex items-center space-x-2">
                  <span>🕐 Detailed Payment Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="fees" className="flex items-center space-x-2">
                  <span>📋 Fee Structure Summary</span>
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
