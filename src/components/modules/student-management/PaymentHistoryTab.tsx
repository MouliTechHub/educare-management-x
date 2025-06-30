
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Undo2, AlertTriangle } from "lucide-react";

interface PaymentHistory {
  id: string;
  fee_id: string;
  student_id: string;
  amount_paid: number;
  payment_date: string;
  payment_time?: string; // Added payment_time field
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
    const dateStr = dateObj.toLocaleDateString();
    
    if (time) {
      return `${dateStr} at ${time}`;
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date & Time</TableHead>
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
              <TableRow key={payment.id}>
                <TableCell>
                  <div className="font-medium">
                    {formatDateTime(payment.payment_date, payment.payment_time)}
                  </div>
                  {payment.payment_time && (
                    <div className="text-xs text-gray-500">
                      Exact time: {payment.payment_time}
                    </div>
                  )}
                </TableCell>
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
              No payment history found for the selected academic year
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
