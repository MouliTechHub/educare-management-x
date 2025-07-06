
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Undo2, AlertTriangle, Clock, Calendar, CreditCard } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PaymentHistory {
  id: string;
  fee_record_id: string;
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
    if (!paymentReversals || !Array.isArray(paymentReversals)) return [];
    return paymentReversals.filter(reversal => reversal.payment_history_id === paymentId);
  };

  const getNetPaymentAmount = (payment: PaymentHistory) => {
    if (!payment) return 0;
    const reversals = getPaymentReversals(payment.id);
    const totalReversed = reversals.reduce((sum, reversal) => sum + (Number(reversal.reversal_amount) || 0), 0);
    return (Number(payment.amount_paid) || 0) - totalReversed;
  };

  const formatDateTime = (date: string, time?: string) => {
    if (!date) return 'Invalid Date';
    
    try {
      const dateObj = new Date(date);
      const dateStr = dateObj.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
      
      if (time) {
        const [hours, minutes] = time.split(':');
        const hour = parseInt(hours) || 0;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        return `${dateStr} at ${hour12}:${minutes || '00'} ${ampm}`;
      }
      
      return dateStr;
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid Date';
    }
  };

  const getTimeCategory = (time?: string) => {
    if (!time) return 'Unknown';
    try {
      const [hours] = time.split(':');
      const hour = parseInt(hours) || 0;
      
      if (hour >= 6 && hour < 12) return 'Morning';
      if (hour >= 12 && hour < 17) return 'Afternoon';
      if (hour >= 17 && hour < 21) return 'Evening';
      return 'Night';
    } catch (error) {
      return 'Unknown';
    }
  };

  const getTimeCategoryColor = (time?: string) => {
    const category = getTimeCategory(time);
    switch (category) {
      case 'Morning': return 'bg-yellow-100 text-yellow-800';
      case 'Afternoon': return 'bg-orange-100 text-orange-800';
      case 'Evening': return 'bg-purple-100 text-purple-800';
      case 'Night': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-4">Loading payment timeline...</span>
      </div>
    );
  }

  if (!paymentHistory || paymentHistory.length === 0) {
    return (
      <div className="space-y-4">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-green-900">Consolidated Payment Timeline</h3>
          </div>
          <p className="text-sm text-green-700">
            Complete chronological record of all payments from the consolidated fee management system.
          </p>
        </div>

        <Alert>
          <Clock className="w-4 h-4" />
          <AlertDescription>
            No payment records found for this student in the selected academic year. 
            Payments will automatically appear here once they are recorded.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Group payments by date to show multiple payments per day
  const paymentsByDate = paymentHistory.reduce((acc, payment) => {
    if (!payment || !payment.payment_date) return acc;
    
    const date = payment.payment_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(payment);
    return acc;
  }, {} as Record<string, PaymentHistory[]>);

  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2 mb-2">
          <Clock className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-green-900">Consolidated Payment Timeline</h3>
        </div>
        <p className="text-sm text-green-700 mb-3">
          Complete chronological record from the consolidated fee management system with exact timestamps. Multiple payments on the same day are shown separately with time categorization for management analysis.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <p className="text-green-600"><strong>🌅 Morning Payments:</strong> 6:00 AM - 12:00 PM</p>
            <p className="text-green-600"><strong>🌞 Afternoon Payments:</strong> 12:00 PM - 5:00 PM</p>
          </div>
          <div className="space-y-1">
            <p className="text-green-600"><strong>🌆 Evening Payments:</strong> 5:00 PM - 9:00 PM</p>
            <p className="text-green-600"><strong>🌙 Night Payments:</strong> 9:00 PM - 6:00 AM</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(paymentsByDate)
          .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
          .map(([date, payments]) => {
            if (!payments || payments.length === 0) return null;
            
            return (
              <div key={date} className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-gray-600" />
                      <h4 className="font-semibold text-gray-900">
                        {formatDateTime(date)}
                      </h4>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {payments.length} payment{payments.length > 1 ? 's' : ''} on this day
                    </Badge>
                  </div>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[120px]">Time</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Fee Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Net Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Receiver</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments
                      .sort((a, b) => {
                        if (!a.payment_time || !b.payment_time) return 0;
                        return a.payment_time.localeCompare(b.payment_time);
                      })
                      .map((payment) => {
                        if (!payment) return null;
                        
                        const reversals = getPaymentReversals(payment.id);
                        const netAmount = getNetPaymentAmount(payment);
                        const hasReversals = reversals.length > 0;
                        
                        return (
                          <TableRow key={payment.id} className="hover:bg-gray-50">
                            <TableCell>
                              <div className="font-mono text-sm font-medium">
                                {payment.payment_time ? 
                                  (() => {
                                    try {
                                      const [hours, minutes] = payment.payment_time.split(':');
                                      const hour = parseInt(hours) || 0;
                                      const ampm = hour >= 12 ? 'PM' : 'AM';
                                      const hour12 = hour % 12 || 12;
                                      return `${hour12}:${minutes || '00'} ${ampm}`;
                                    } catch (error) {
                                      return 'Invalid Time';
                                    }
                                  })()
                                  : 'Not recorded'
                                }
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={getTimeCategoryColor(payment.payment_time)} variant="secondary">
                                {getTimeCategory(payment.payment_time)}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">{payment.fee_type || 'Unknown'}</TableCell>
                            <TableCell>
                              <div className="font-medium text-green-600">
                                ₹{(Number(payment.amount_paid) || 0).toLocaleString()}
                              </div>
                              {hasReversals && (
                                <div className="text-xs text-gray-500">Original</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className={`font-medium ${hasReversals ? 'text-amber-600' : 'text-green-600'}`}>
                                ₹{netAmount.toLocaleString()}
                              </div>
                              {hasReversals && (
                                <div className="text-xs text-gray-500">After reversals</div>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-1">
                                <CreditCard className="w-3 h-3 text-gray-400" />
                                <Badge variant="outline" className="text-xs">
                                  {payment.payment_method || 'Unknown'}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="font-mono text-sm">{payment.receipt_number || 'N/A'}</TableCell>
                            <TableCell>{payment.payment_receiver || 'Unknown'}</TableCell>
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
                                    {reversals.length}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
      </div>
    </div>
  );
}
