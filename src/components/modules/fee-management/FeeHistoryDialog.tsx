
import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, CreditCard, Percent, FileText } from "lucide-react";
import { StudentFeeRecord, FeeChangeHistory, FeePaymentRecord } from "@/types/enhanced-fee-types";

interface FeeHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  feeRecord: StudentFeeRecord | null;
  getChangeHistory: (feeRecordId: string) => Promise<FeeChangeHistory[]>;
  getPaymentHistory: (feeRecordId: string) => Promise<FeePaymentRecord[]>;
}

export function FeeHistoryDialog({ 
  open, 
  onOpenChange, 
  feeRecord, 
  getChangeHistory,
  getPaymentHistory
}: FeeHistoryDialogProps) {
  const [changeHistory, setChangeHistory] = useState<FeeChangeHistory[]>([]);
  const [paymentHistory, setPaymentHistory] = useState<FeePaymentRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (feeRecord && open) {
      fetchHistories();
    }
  }, [feeRecord, open]);

  const fetchHistories = async () => {
    if (!feeRecord) return;
    
    setLoading(true);
    try {
      const [changes, payments] = await Promise.all([
        getChangeHistory(feeRecord.id),
        getPaymentHistory(feeRecord.id)
      ]);
      
      setChangeHistory(changes);
      setPaymentHistory(payments);
    } catch (error) {
      console.error('Error fetching histories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!feeRecord) return null;

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;
  const formatDateTime = (dateTime: string) => {
    return new Date(dateTime).toLocaleString();
  };

  const getChangeTypeIcon = (type: string) => {
    switch (type) {
      case 'payment':
        return <CreditCard className="w-4 h-4 text-green-600" />;
      case 'discount':
        return <Percent className="w-4 h-4 text-orange-600" />;
      case 'creation':
        return <FileText className="w-4 h-4 text-blue-600" />;
      default:
        return <Calendar className="w-4 h-4 text-gray-600" />;
    }
  };

  const getChangeTypeBadge = (type: string) => {
    const colors = {
      payment: 'bg-green-100 text-green-800',
      discount: 'bg-orange-100 text-orange-800',
      creation: 'bg-blue-100 text-blue-800',
      status_update: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  const getTimelineItems = () => {
    const combinedItems = [
      ...changeHistory.map(item => ({ ...item, type: 'change', date: item.change_date })),
      ...paymentHistory.map(item => ({ ...item, type: 'payment', date: item.created_at }))
    ];
    
    return combinedItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Calendar className="w-5 h-5" />
            <span>Fee History & Timeline</span>
          </DialogTitle>
          <DialogDescription>
            Complete history and timeline for {feeRecord.student ? 
              `${feeRecord.student.first_name} ${feeRecord.student.last_name}` : 
              "student"} - {feeRecord.fee_type}
          </DialogDescription>
        </DialogHeader>

        {/* Current Fee Summary */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
          <h4 className="font-medium text-gray-900">Current Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Actual Fee:</span>
              <div className="font-medium">{formatCurrency(feeRecord.actual_fee)}</div>
            </div>
            <div>
              <span className="text-gray-600">Discount:</span>
              <div className="font-medium text-green-600">
                -{formatCurrency(feeRecord.discount_amount)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Paid Amount:</span>
              <div className="font-medium text-blue-600">
                {formatCurrency(feeRecord.paid_amount)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Balance:</span>
              <div className={`font-medium ${
                feeRecord.balance_fee > 0 ? 'text-red-600' : 'text-green-600'
              }`}>
                {formatCurrency(feeRecord.balance_fee)}
              </div>
            </div>
          </div>
          <div className="pt-2">
            <Badge className={
              feeRecord.status === 'Paid' ? 'bg-green-100 text-green-800' :
              feeRecord.status === 'Partial' ? 'bg-blue-100 text-blue-800' :
              feeRecord.status === 'Overdue' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }>
              {feeRecord.status}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="timeline" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timeline">Complete Timeline</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="changes">Change Log</TabsTrigger>
          </TabsList>

          <TabsContent value="timeline" className="space-y-4">
            {loading ? (
              <div className="text-center py-8">Loading timeline...</div>
            ) : (
              <div className="space-y-4">
                {getTimelineItems().map((item, index) => {
                  const isPayment = item.type === 'payment';
                  const paymentItem = item as FeePaymentRecord;
                  const changeItem = item as FeeChangeHistory;
                  
                  return (
                    <div key={index} className="flex items-start space-x-3 p-3 bg-white border rounded-lg">
                      {getChangeTypeIcon(isPayment ? 'payment' : changeItem.change_type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge className={getChangeTypeBadge(isPayment ? 'payment' : changeItem.change_type)}>
                            {isPayment ? 'Payment' : changeItem.change_type.charAt(0).toUpperCase() + changeItem.change_type.slice(1)}
                          </Badge>
                          <span className="text-sm text-gray-500">{formatDateTime(item.date)}</span>
                        </div>
                        
                        {isPayment ? (
                          <div className="space-y-1">
                            <div className="font-medium text-green-600">
                              Payment of {formatCurrency(paymentItem.amount_paid)}
                            </div>
                            <div className="text-sm text-gray-600">
                              Method: {paymentItem.payment_method} | Receipt: {paymentItem.receipt_number}
                            </div>
                            <div className="text-sm text-gray-600">
                              Received by: {paymentItem.payment_receiver}
                            </div>
                            {paymentItem.notes && (
                              <div className="text-sm text-gray-500">Notes: {paymentItem.notes}</div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <div className="font-medium">
                              {changeItem.change_type === 'discount' && 
                                `Discount applied: ${formatCurrency(changeItem.amount || 0)}`
                              }
                              {changeItem.change_type === 'creation' && 
                                `Fee record created: ${formatCurrency(changeItem.amount || 0)}`
                              }
                              {changeItem.change_type === 'status_update' && 
                                `Status updated`
                              }
                            </div>
                            <div className="text-sm text-gray-600">
                              By: {changeItem.changed_by}
                            </div>
                            {changeItem.notes && (
                              <div className="text-sm text-gray-500">Notes: {changeItem.notes}</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                
                {changeHistory.length === 0 && paymentHistory.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No history available for this fee record.
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {paymentHistory.length > 0 ? (
              <div className="space-y-3">
                {paymentHistory.map((payment, index) => (
                  <div key={index} className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-green-800">
                        {formatCurrency(payment.amount_paid)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(payment.created_at)}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Payment Date:</span>
                        <div>{new Date(payment.payment_date).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Method:</span>
                        <div>{payment.payment_method}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Receipt:</span>
                        <div>{payment.receipt_number}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Received By:</span>
                        <div>{payment.payment_receiver}</div>
                      </div>
                    </div>
                    {payment.notes && (
                      <div className="mt-2 text-sm">
                        <span className="text-gray-600">Notes:</span>
                        <div>{payment.notes}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No payments recorded for this fee.
              </div>
            )}
          </TabsContent>

          <TabsContent value="changes" className="space-y-4">
            {changeHistory.length > 0 ? (
              <div className="space-y-3">
                {changeHistory.map((change, index) => (
                  <div key={index} className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className={getChangeTypeBadge(change.change_type)}>
                        {change.change_type.charAt(0).toUpperCase() + change.change_type.slice(1)}
                      </Badge>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(change.change_date)}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      {change.amount && (
                        <div>
                          <span className="text-gray-600">Amount:</span>
                          <span className="ml-2 font-medium">
                            {formatCurrency(change.amount)}
                          </span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">Changed By:</span>
                        <span className="ml-2">{change.changed_by}</span>
                      </div>
                      {change.notes && (
                        <div>
                          <span className="text-gray-600">Notes:</span>
                          <div className="mt-1">{change.notes}</div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No change history available for this fee.
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
