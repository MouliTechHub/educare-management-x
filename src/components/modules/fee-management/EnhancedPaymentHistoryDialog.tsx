import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CreditCard, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PaymentAllocationDetail {
  id: string;
  payment_id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  allocated_amount: number;
  fee_type: string;
  academic_year: string;
  paid_to_current_year: boolean;
  paid_to_previous_dues: boolean;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

interface EnhancedPaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: Student | null;
  currentAcademicYearId: string;
}

export function EnhancedPaymentHistoryDialog({
  open,
  onOpenChange,
  student,
  currentAcademicYearId
}: EnhancedPaymentHistoryDialogProps) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentAllocationDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEnhancedPaymentHistory = async () => {
    if (!student?.id || !currentAcademicYearId) {
      console.log('⚠️ Missing student or academic year for enhanced payment history');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Fetching enhanced payment history for student:', student.id, 'academic year:', currentAcademicYearId);

      // Get all payment allocations for this student
      const { data: allocations, error: allocationsError } = await supabase
        .from('payment_allocations')
        .select(`
          id,
          allocated_amount,
          allocation_date,
          fee_payment_records!inner(
            id,
            amount_paid,
            payment_date,
            payment_method,
            receipt_number,
            student_id
          ),
          student_fee_records!inner(
            id,
            fee_type,
            academic_year_id,
            academic_years!inner(year_name)
          )
        `)
        .eq('fee_payment_records.student_id', student.id)
        .order('allocation_date', { ascending: false });

      if (allocationsError) {
        console.error('❌ Error fetching payment allocations:', allocationsError);
        throw allocationsError;
      }

      console.log('✅ Payment allocations fetched:', allocations?.length || 0);

      // Transform the data to show which payments went where
      const transformedHistory: PaymentAllocationDetail[] = (allocations || []).map((allocation: any) => {
        const feeRecord = allocation.student_fee_records;
        const paymentRecord = allocation.fee_payment_records;
        
        return {
          id: allocation.id,
          payment_id: paymentRecord.id,
          amount_paid: paymentRecord.amount_paid,
          payment_date: paymentRecord.payment_date,
          payment_method: paymentRecord.payment_method,
          receipt_number: paymentRecord.receipt_number,
          allocated_amount: allocation.allocated_amount,
          fee_type: feeRecord.fee_type,
          academic_year: feeRecord.academic_years.year_name,
          paid_to_current_year: feeRecord.academic_year_id === currentAcademicYearId && feeRecord.fee_type !== 'Previous Year Dues',
          paid_to_previous_dues: feeRecord.fee_type === 'Previous Year Dues'
        };
      });

      setPaymentHistory(transformedHistory);

    } catch (error: any) {
      console.error('❌ Error fetching enhanced payment history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment history",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && student?.id) {
      fetchEnhancedPaymentHistory();
    }
  }, [open, student?.id, currentAcademicYearId]);

  // Group payments by receipt number
  const groupedPayments = paymentHistory.reduce((groups, payment) => {
    const key = payment.receipt_number;
    if (!groups[key]) {
      groups[key] = {
        payment_info: {
          payment_id: payment.payment_id,
          amount_paid: payment.amount_paid,
          payment_date: payment.payment_date,
          payment_method: payment.payment_method,
          receipt_number: payment.receipt_number
        },
        allocations: []
      };
    }
    groups[key].allocations.push(payment);
    return groups;
  }, {} as Record<string, any>);

  const currentYearPayments = paymentHistory.filter(p => p.paid_to_current_year);
  const previousDuesPayments = paymentHistory.filter(p => p.paid_to_previous_dues);

  if (!student) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Enhanced Payment History - {student.first_name} {student.last_name}
            <Badge variant="outline">{student.admission_number}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All Payments</TabsTrigger>
            <TabsTrigger value="current">Current Year</TabsTrigger>
            <TabsTrigger value="previous">Previous Dues</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="space-y-4">
              {Object.entries(groupedPayments).map(([receiptNumber, group]) => (
                <Card key={receiptNumber} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(group.payment_info.payment_date).toLocaleDateString()}
                        </span>
                        <Badge variant="outline">{group.payment_info.payment_method}</Badge>
                        <Badge variant="secondary">{receiptNumber}</Badge>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ₹{group.payment_info.amount_paid.toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">Payment Allocation:</h4>
                      {group.allocations.map((allocation: PaymentAllocationDetail) => (
                        <div key={allocation.id} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{allocation.fee_type}</span>
                            <span className="text-xs text-muted-foreground">({allocation.academic_year})</span>
                            {allocation.paid_to_previous_dues && (
                              <Badge variant="destructive" className="text-xs">Previous Year</Badge>
                            )}
                          </div>
                          <span className="text-sm font-medium">₹{allocation.allocated_amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            <div className="space-y-4">
              {currentYearPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments made to current year fees
                </div>
              ) : (
                currentYearPayments.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{payment.fee_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{payment.allocated_amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{payment.receipt_number}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="previous" className="space-y-4">
            <div className="space-y-4">
              {previousDuesPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments made to previous year dues
                </div>
              ) : (
                previousDuesPayments.map((payment) => (
                  <Card key={payment.id} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{payment.fee_type}</p>
                          <p className="text-sm text-muted-foreground">
                            Cleared dues from {payment.academic_year}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(payment.payment_date).toLocaleDateString()} • {payment.payment_method}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">₹{payment.allocated_amount.toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{payment.receipt_number}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{paymentHistory.reduce((sum, p) => sum + p.allocated_amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paymentHistory.length} payment(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Current Year Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{currentYearPayments.reduce((sum, p) => sum + p.allocated_amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentYearPayments.length} payment(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Previous Dues Cleared</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ₹{previousDuesPayments.reduce((sum, p) => sum + p.allocated_amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {previousDuesPayments.length} payment(s)
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}