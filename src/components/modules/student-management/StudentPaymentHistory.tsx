
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
        <DialogContent className="max-w-7xl max-h-[85vh] overflow-y-auto">
          <PaymentHistoryDialogHeader 
            studentName={studentName} 
            currentYear={currentYear} 
          />
          
          <div className="space-y-6">
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
                  <span>📊 Payment Timeline</span>
                </TabsTrigger>
                <TabsTrigger value="fees" className="flex items-center space-x-2">
                  <span>📋 Fee Summary</span>
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="payments" className="space-y-4">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-semibold text-blue-900 mb-3 text-lg">Management Payment Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="text-blue-700">
                        <strong>📅 Complete Timeline:</strong> View all payments with exact dates and times
                      </p>
                      <p className="text-blue-700">
                        <strong>🔍 Multiple Daily Payments:</strong> See separate entries for morning and evening payments
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-blue-700">
                        <strong>💰 Amount Tracking:</strong> Track original amounts and any reversals/refunds
                      </p>
                      <p className="text-blue-700">
                        <strong>📝 Full Documentation:</strong> Complete payment method and receiver details
                      </p>
                    </div>
                  </div>
                </div>
                <PaymentHistoryTab
                  paymentHistory={filteredPaymentHistory}
                  paymentReversals={paymentReversals}
                  loading={loading}
                  onReversalClick={openReversalDialog}
                />
              </TabsContent>
              
              <TabsContent value="fees" className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h3 className="font-medium text-yellow-900 mb-2">Fee Records Summary</h3>
                  <p className="text-sm text-yellow-700">
                    This shows the overall fee structure and payment status for each fee type. 
                    Use the Payment Timeline tab for detailed transaction history.
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
