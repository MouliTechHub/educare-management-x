
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Search, Receipt, History, Undo2, AlertTriangle } from "lucide-react";
import { Fee } from "@/types/database";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PaymentReversalDialog } from "../fee-management/PaymentReversalDialog";

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
      
      // Fetch payment history filtered by academic year
      let query = supabase
        .from('payment_history')
        .select(`
          *,
          fees!inner(academic_year_id)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (currentAcademicYear) {
        query = query.eq('fees.academic_year_id', currentAcademicYear);
      }

      const { data: historyData, error: historyError } = await query;

      if (historyError) {
        console.error('Payment history fetch error:', historyError);
        setPaymentHistory([]);
      } else {
        setPaymentHistory((historyData || []) as PaymentHistory[]);
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

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getPaymentReversals = (paymentId: string) => {
    return paymentReversals.filter(reversal => reversal.payment_history_id === paymentId);
  };

  const getNetPaymentAmount = (payment: PaymentHistory) => {
    const reversals = getPaymentReversals(payment.id);
    const totalReversed = reversals.reduce((sum, reversal) => sum + reversal.reversal_amount, 0);
    return payment.amount_paid - totalReversed;
  };

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
            <div className="flex items-center justify-between space-x-4">
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search by fee type, status, payment method, or receipt number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              {academicYears.length > 0 && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">Academic Year:</span>
                  <Select value={currentAcademicYear} onValueChange={setCurrentAcademicYear}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Years</SelectItem>
                      {academicYears.map((year) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.year_name} {year.is_current && "(Current)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <Tabs defaultValue="fees" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="fees">Fee Records</TabsTrigger>
                <TabsTrigger value="payments">Payment History</TabsTrigger>
              </TabsList>
              
              <TabsContent value="fees" className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Original Amount</TableHead>
                      <TableHead>Discount</TableHead>
                      <TableHead>Final Amount</TableHead>
                      <TableHead>Paid Amount</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFees.map((fee) => {
                      const finalAmount = fee.actual_amount - fee.discount_amount;
                      const balance = finalAmount - fee.total_paid;
                      return (
                        <TableRow key={fee.id}>
                          <TableCell className="font-medium">{fee.fee_type}</TableCell>
                          <TableCell>₹{Number(fee.actual_amount).toLocaleString()}</TableCell>
                          <TableCell>
                            {fee.discount_amount > 0 ? (
                              <span className="text-green-600 font-medium">₹{fee.discount_amount.toLocaleString()}</span>
                            ) : (
                              <span className="text-gray-400">₹0</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">₹{finalAmount.toLocaleString()}</TableCell>
                          <TableCell className="font-medium text-blue-600">₹{fee.total_paid.toLocaleString()}</TableCell>
                          <TableCell className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            ₹{balance.toLocaleString()}
                          </TableCell>
                          <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge variant={getStatusVariant(fee.status)}>
                              {fee.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TabsContent>
              
              <TabsContent value="payments" className="space-y-4">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount Paid</TableHead>
                        <TableHead>Net Amount</TableHead>
                        <TableHead>Payment Method</TableHead>
                        <TableHead>Receipt No.</TableHead>
                        <TableHead>Received By</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPaymentHistory.length > 0 ? (
                        filteredPaymentHistory.map((payment) => {
                          const reversals = getPaymentReversals(payment.id);
                          const netAmount = getNetPaymentAmount(payment);
                          const hasReversals = reversals.length > 0;
                          
                          return (
                            <TableRow key={payment.id}>
                              <TableCell>{new Date(payment.payment_date).toLocaleDateString()}</TableCell>
                              <TableCell className="font-medium">{payment.fee_type}</TableCell>
                              <TableCell className="font-medium text-green-600">
                                ₹{Number(payment.amount_paid).toLocaleString()}
                                {hasReversals && (
                                  <div className="text-xs text-gray-500">
                                    Original Amount
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className={`font-medium ${hasReversals ? 'text-amber-600' : 'text-green-600'}`}>
                                ₹{netAmount.toLocaleString()}
                                {hasReversals && (
                                  <div className="text-xs text-gray-500">
                                    After reversals
                                  </div>
                                )}
                              </TableCell>
                              <TableCell>{payment.payment_method}</TableCell>
                              <TableCell>{payment.receipt_number}</TableCell>
                              <TableCell>{payment.payment_receiver}</TableCell>
                              <TableCell>{payment.notes || '-'}</TableCell>
                              <TableCell>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openReversalDialog(payment)}
                                    disabled={netAmount <= 0}
                                    title={netAmount <= 0 ? "Payment fully reversed" : "Record reversal/refund"}
                                  >
                                    <Undo2 className="w-4 h-4" />
                                  </Button>
                                  {hasReversals && (
                                    <Badge variant="secondary" className="text-xs">
                                      <AlertTriangle className="w-3 h-3 mr-1" />
                                      {reversals.length} reversal{reversals.length > 1 ? 's' : ''}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                            No payment history found for the selected academic year
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
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
