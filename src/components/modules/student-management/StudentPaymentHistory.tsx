
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
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <PaymentHistoryDialogHeader 
            studentName={studentName} 
            currentYear={currentYear} 
          />
          
          <div className="space-y-4">
            <PaymentHistoryFilters
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              academicYears={academicYears}
              currentAcademicYear={currentAcademicYear}
              onYearChange={setCurrentAcademicYear}
            />

            <Tabs defaultValue="payments" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payments">Detailed Payment History</TabsTrigger>
                <TabsTrigger value="fees">Fee Records</TabsTrigger>
              </TabsList>
              
              <TabsContent value="payments" className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">Payment History with Time Details</h3>
                  <p className="text-sm text-blue-700">
                    This shows all payments made by the student with exact date and time information. 
                    Multiple payments on the same day will show different times.
                  </p>
                </div>
                <PaymentHistoryTab
                  paymentHistory={filteredPaymentHistory}
                  paymentReversals={paymentReversals}
                  loading={loading}
                  onReversalClick={openReversalDialog}
                />
              </TabsContent>
              
              <TabsContent value="fees" className="space-y-4">
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
