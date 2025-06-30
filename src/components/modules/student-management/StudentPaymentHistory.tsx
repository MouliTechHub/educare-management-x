
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { Receipt, History } from "lucide-react";
import { Fee } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentReversalDialog } from "../fee-management/PaymentReversalDialog";
import { PaymentHistoryFilters } from "./PaymentHistoryFilters";
import { FeeRecordsTab } from "./FeeRecordsTab";
import { PaymentHistoryTab } from "./PaymentHistoryTab";

interface PaymentHistory {
  id: string;
  fee_id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  receipt_number: string;
  payment_receiver: string;
  payment_method: string;
  notes: string | null;
  fee_type: string;
  created_at: string;
}

interface PaymentReversal {
  id: string;
  payment_history_id: string;
  reversal_type: 'reversal' | 'refund';
  reversal_amount: number;
  reversal_date: string;
  reason: string;
  notes: string | null;
  authorized_by: string;
  created_at: string;
}

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
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [paymentReversals, setPaymentReversals] = useState<PaymentReversal[]>([]);
  const [loading, setLoading] = useState(false);
  const [reversalDialogOpen, setReversalDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
  const [currentAcademicYear, setCurrentAcademicYear] = useState(selectedAcademicYear || "");
  const { toast } = useToast();

  const fetchPaymentHistory = async () => {
    if (!fees.length) return;
    
    setLoading(true);
    try {
      const studentId = fees[0].student_id;
      
      // Get all payment history for the student
      const { data: historyData, error: historyError } = await supabase
        .from('payment_history')
        .select('*')
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (historyError) {
        console.error('Payment history fetch error:', historyError);
        setPaymentHistory([]);
      } else {
        // Filter by academic year if selected
        let filteredHistory = historyData || [];
        if (currentAcademicYear) {
          // Get fee IDs for the selected academic year
          const yearFeeIds = fees
            .filter(fee => fee.academic_year_id === currentAcademicYear)
            .map(fee => fee.id);
          
          filteredHistory = filteredHistory.filter(payment => 
            yearFeeIds.includes(payment.fee_id)
          );
        }
        
        setPaymentHistory(filteredHistory as PaymentHistory[]);
      }

      // Fetch payment reversals
      const { data: reversalData, error: reversalError } = await supabase
        .from('payment_reversals')
        .select('*')
        .order('created_at', { ascending: false });

      if (reversalError) {
        console.error('Payment reversals fetch error:', reversalError);
        setPaymentReversals([]);
      } else {
        setPaymentReversals((reversalData || []) as PaymentReversal[]);
      }
    } catch (error: any) {
      console.error('Unexpected error fetching payment history:', error);
      toast({
        title: "Error fetching payment history",
        description: "Could not load payment history. Please try again.",
        variant: "destructive",
      });
      setPaymentHistory([]);
      setPaymentReversals([]);
    } finally {
      setLoading(false);
    }
  };

  const openReversalDialog = (payment: PaymentHistory) => {
    setSelectedPayment(payment);
    setReversalDialogOpen(true);
  };

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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Receipt className="w-5 h-5" />
                <span>Payment Records - {studentName}</span>
              </div>
              {currentYear && (
                <Badge variant="outline" className="text-sm">
                  Academic Year: {currentYear.year_name}
                  {currentYear.is_current && " (Current)"}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>
          
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
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                <TabsTrigger value="fees">Fee Records</TabsTrigger>
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
                <FeeRecordsTab fees={filteredFees} />
              </TabsContent>
            </Tabs>

            {filteredFees.length === 0 && filteredPaymentHistory.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No records found for the selected academic year and search criteria.</p>
              </div>
            )}
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
