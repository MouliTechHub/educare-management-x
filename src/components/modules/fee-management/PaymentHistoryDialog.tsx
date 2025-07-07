import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Receipt, 
  Download, 
  Calendar, 
  CreditCard,
  ArrowRight,
  Clock
} from "lucide-react";
import { format } from "date-fns";

interface PaymentRecord {
  id: string;
  amount_paid: number;
  payment_date: string;
  payment_time?: string;
  payment_method: string;
  receipt_number: string;
  payment_receiver: string;
  notes?: string;
  late_fee?: number;
  payment_allocations?: Array<{
    allocated_amount: number;
    allocation_order: number;
    student_fee_records: {
      fee_type: string;
      academic_years: {
        year_name: string;
      };
    };
  }>;
}

interface PaymentHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  payments: PaymentRecord[];
  loading?: boolean;
}

export function PaymentHistoryDialog({
  open,
  onOpenChange,
  studentName,
  payments,
  loading = false
}: PaymentHistoryDialogProps) {
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount_paid, 0);
  const totalLateFees = payments.reduce((sum, payment) => sum + (payment.late_fee || 0), 0);

  const downloadReceipt = (payment: PaymentRecord) => {
    // Create receipt content
    const receiptContent = `
      SCHOOL FEE RECEIPT
      ==================
      
      Student: ${studentName}
      Receipt No: ${payment.receipt_number}
      Date: ${format(new Date(payment.payment_date), 'dd/MM/yyyy')}
      Time: ${payment.payment_time || 'N/A'}
      
      Payment Details:
      ---------------
      Amount Paid: ₹${payment.amount_paid.toLocaleString()}
      Late Fee: ₹${(payment.late_fee || 0).toLocaleString()}
      Total: ₹${(payment.amount_paid + (payment.late_fee || 0)).toLocaleString()}
      
      Payment Method: ${payment.payment_method}
      Received By: ${payment.payment_receiver}
      
      ${payment.notes ? `Notes: ${payment.notes}` : ''}
      
      Fee Allocation:
      ${payment.payment_allocations?.map((allocation, index) => 
        `${index + 1}. ${allocation.student_fee_records.fee_type} (${allocation.student_fee_records.academic_years.year_name}): ₹${allocation.allocated_amount.toLocaleString()}`
      ).join('\n') || 'No allocation details available'}
      
      Thank you for your payment!
    `;

    // Create and download file
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Receipt-${payment.receipt_number}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method.toLowerCase()) {
      case 'cash': return 'bg-green-100 text-green-800';
      case 'card': return 'bg-blue-100 text-blue-800';
      case 'online': return 'bg-purple-100 text-purple-800';
      case 'upi': case 'phonepe': case 'gpay': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment History - {studentName}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Payments</p>
                      <p className="text-xl font-bold">{payments.length}</p>
                    </div>
                    <Receipt className="h-6 w-6 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Paid</p>
                      <p className="text-xl font-bold text-green-600">₹{totalPaid.toLocaleString()}</p>
                    </div>
                    <CreditCard className="h-6 w-6 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Late Fees</p>
                      <p className="text-xl font-bold text-red-600">₹{totalLateFees.toLocaleString()}</p>
                    </div>
                    <Clock className="h-6 w-6 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment List */}
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {payments.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No payment records found</p>
                  </div>
                ) : (
                  payments.map((payment, index) => (
                    <Card key={payment.id}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-full">
                              <Receipt className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <CardTitle className="text-lg">₹{payment.amount_paid.toLocaleString()}</CardTitle>
                              <p className="text-sm text-muted-foreground">
                                Receipt: {payment.receipt_number}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadReceipt(payment)}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        {/* Payment Details */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Date</p>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>{format(new Date(payment.payment_date), 'dd/MM/yyyy')}</span>
                            </div>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Time</p>
                            <span>{payment.payment_time || 'N/A'}</span>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Method</p>
                            <Badge className={getPaymentMethodColor(payment.payment_method)}>
                              {payment.payment_method}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Received By</p>
                            <span>{payment.payment_receiver}</span>
                          </div>
                        </div>

                        {payment.late_fee && payment.late_fee > 0 && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <Clock className="h-3 w-3" />
                            <span>Late Fee: ₹{payment.late_fee.toLocaleString()}</span>
                          </div>
                        )}

                        {payment.notes && (
                          <div className="text-sm">
                            <p className="text-muted-foreground">Notes:</p>
                            <p className="bg-muted/50 p-2 rounded text-sm">{payment.notes}</p>
                          </div>
                        )}

                        {/* Payment Allocations */}
                        {payment.payment_allocations && payment.payment_allocations.length > 0 && (
                          <>
                            <Separator />
                            <div>
                              <p className="text-sm font-medium mb-2">Fee Allocation:</p>
                              <div className="space-y-2">
                                {payment.payment_allocations
                                  .sort((a, b) => a.allocation_order - b.allocation_order)
                                  .map((allocation, allocIndex) => (
                                    <div 
                                      key={allocIndex}
                                      className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded"
                                    >
                                      <div className="flex items-center gap-2">
                                        <span className="bg-primary/20 text-primary px-2 py-1 rounded-full text-xs">
                                          {allocation.allocation_order}
                                        </span>
                                        <div>
                                          <span className="font-medium">
                                            {allocation.student_fee_records.fee_type}
                                          </span>
                                          <span className="text-muted-foreground ml-2">
                                            ({allocation.student_fee_records.academic_years.year_name})
                                          </span>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                                        <span className="font-medium text-green-600">
                                          ₹{allocation.allocated_amount.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                              </div>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}