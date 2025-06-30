
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Undo2, AlertTriangle, Clock } from "lucide-react";

interface PaymentHistory {
  id: string;
  fee_id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  payment_time?: string;
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

interface PaymentHistoryTabProps {
  paymentHistory: PaymentHistory[];
  paymentReversals: PaymentReversal[];
  loading: boolean;
  onReversalClick: (payment: PaymentHistory) => void;
}

export function PaymentHistoryTab({ 
  paymentHistory, 
  paymentReversals, 
  loading, 
  onReversalClick 
}: PaymentHistoryTabProps) {
  const getPaymentReversals = (paymentId: string) => {
    return paymentReversals.filter(reversal => reversal.payment_history_id === paymentId);
  };

  const getNetPaymentAmount = (payment: PaymentHistory) => {
    const reversals = getPaymentReversals(payment.id);
    const totalReversed = reversals.reduce((sum, reversal) => sum + reversal.reversal_amount, 0);
    return payment.amount_paid - totalReversed;
  };

  const formatDateTime = (date: string, time?: string) => {
    const dateObj = new Date(date);
    const dateStr = dateObj.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric'
    });
    
    if (time) {
      // Convert 24-hour time to 12-hour format with AM/PM
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${dateStr} at ${hour12}:${minutes} ${ampm}`;
    }
    
    return dateStr;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-blue-900">Detailed Payment Timeline</h3>
        </div>
        <p className="text-sm text-blue-700">
          This shows the complete payment history with exact timestamps. Multiple payments on the same day will show different times, allowing you to track morning and evening payments separately.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Date & Time</TableHead>
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
          {paymentHistory.length > 0 ? (
            paymentHistory.map((payment) => {
              const reversals = getPaymentReversals(payment.id);
              const netAmount = getNetPaymentAmount(payment);
              const hasReversals = reversals.length > 0;
              
              return (
                <TableRow key={payment.id} className="hover:bg-gray-50">
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium text-gray-900">
                        {formatDateTime(payment.payment_date, payment.payment_time)}
                      </div>
                      {payment.payment_time && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          <span>Exact time: {payment.payment_time}</span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{payment.fee_type}</TableCell>
                  <TableCell>
                    <div className="font-medium text-green-600">
                      ₹{Number(payment.amount_paid).toLocaleString()}
                    </div>
                    {hasReversals && (
                      <div className="text-xs text-gray-500">
                        Original Amount
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className={`font-medium ${hasReversals ? 'text-amber-600' : 'text-green-600'}`}>
                      ₹{netAmount.toLocaleString()}
                    </div>
                    {hasReversals && (
                      <div className="text-xs text-gray-500">
                        After reversals
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {payment.payment_method}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{payment.receipt_number}</TableCell>
                  <TableCell>{payment.payment_receiver}</TableCell>
                  <TableCell>{payment.notes || '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onReversalClick(payment)}
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
                <div className="flex flex-col items-center space-y-2">
                  <Clock className="w-8 h-8 opacity-50" />
                  <p>No payment history found for the selected academic year</p>
                  <p className="text-sm">Payment records with exact timestamps will appear here</p>
                </div>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
