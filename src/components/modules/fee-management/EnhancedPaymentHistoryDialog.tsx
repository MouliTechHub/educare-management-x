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

interface PaymentHistoryRecord {
  payment_id: string;
  student_id: string;
  fee_record_id: string;
  fee_type: string;
  amount: number;
  payment_date: string;
  method: string;
  reference_no: string | null;
  notes: string | null;
  entry_type: 'PAYMENT' | 'DISCOUNT';
  created_at: string;
  processed_by: string;
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
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistoryRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchEnhancedPaymentHistory = async () => {
    if (!student?.id) {
      console.log('⚠️ Missing student for enhanced payment history');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Fetching unified payment history for student:', student.id);

      // Fetch from unified payment history view
      const { data, error } = await supabase
        .from('v_payment_history')
        .select('*')
        .eq('student_id', student.id)
        .order('payment_date', { ascending: false });

      if (error) {
        console.error('❌ Error fetching payment history:', error);
        throw error;
      }

      console.log('✅ Payment history fetched:', data?.length || 0);
      // Type assertion to handle the string type from the database
      const typedData = (data || []).map(record => ({
        ...record,
        entry_type: record.entry_type as 'PAYMENT' | 'DISCOUNT'
      }));
      setPaymentHistory(typedData);

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
  }, [open, student?.id]);

  // Filter records by type and date
  const allRecords = paymentHistory;
  const currentYearRecords = paymentHistory.filter(record => {
    // Check if this record belongs to current year tuition fees
    // Since we unified the view, we need a different approach to determine this
    return record.fee_type === 'Tuition Fee';
  });
  const previousDuesRecords = paymentHistory.filter(record => 
    record.fee_type === 'Previous Year Dues'
  );

  // Group records by reference number for payments, show individual entries for discounts
  const groupedRecords = allRecords.reduce((groups, record) => {
    if (record.entry_type === 'PAYMENT' && record.reference_no) {
      const key = record.reference_no;
      if (!groups[key]) {
        groups[key] = {
          type: 'PAYMENT',
          record_info: {
            payment_id: record.payment_id,
            amount: record.amount,
            payment_date: record.payment_date,
            method: record.method,
            reference_no: record.reference_no
          },
          records: []
        };
      }
      groups[key].records.push(record);
    } else {
      // Create individual entries for discounts
      const key = `${record.entry_type}_${record.payment_id}_${Date.now()}`;
      groups[key] = {
        type: record.entry_type,
        record_info: {
          payment_id: record.payment_id,
          amount: record.amount,
          payment_date: record.payment_date,
          method: record.method,
          reference_no: record.reference_no
        },
        records: [record]
      };
    }
    return groups;
  }, {} as Record<string, any>);

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
              {Object.entries(groupedRecords).map(([key, group]) => (
                <Card key={key} className={`border-l-4 ${group.type === 'PAYMENT' ? 'border-l-blue-500' : 'border-l-purple-500'}`}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {new Date(group.record_info.payment_date).toLocaleDateString()}
                        </span>
                        <Badge variant={group.type === 'PAYMENT' ? 'default' : 'secondary'}>
                          {group.record_info.method}
                        </Badge>
                        {group.record_info.reference_no && (
                          <Badge variant="outline">{group.record_info.reference_no}</Badge>
                        )}
                        <Badge variant={group.type === 'PAYMENT' ? 'default' : 'secondary'}>
                          {group.type}
                        </Badge>
                      </div>
                      <div className={`text-lg font-bold ${group.type === 'PAYMENT' ? 'text-green-600' : 'text-purple-600'}`}>
                        ₹{group.record_info.amount.toLocaleString()}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-muted-foreground">
                        {group.type === 'PAYMENT' ? 'Payment Applied To:' : 'Discount Details:'}
                      </h4>
                      {group.records.map((record: PaymentHistoryRecord, index: number) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                          <div className="flex items-center gap-2">
                            <ArrowRight className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">{record.fee_type}</span>
                            {record.fee_type === 'Previous Year Dues' && (
                              <Badge variant="destructive" className="text-xs">Previous Year</Badge>
                            )}
                          </div>
                          <span className="text-sm font-medium">₹{record.amount.toLocaleString()}</span>
                        </div>
                      ))}
                      {group.records[0]?.notes && (
                        <div className="text-xs text-muted-foreground mt-2">
                          Note: {group.records[0].notes}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="current" className="space-y-4">
            <div className="space-y-4">
              {currentYearRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments made to current year fees
                </div>
              ) : (
                currentYearRecords.map((record, index) => (
                  <Card key={`${record.payment_id}_${index}`}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{record.fee_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.payment_date).toLocaleDateString()} • {record.method}
                          </p>
                          <Badge variant={record.entry_type === 'PAYMENT' ? 'default' : 'secondary'} className="mt-1">
                            {record.entry_type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${record.entry_type === 'PAYMENT' ? 'text-green-600' : 'text-purple-600'}`}>
                            ₹{record.amount.toLocaleString()}
                          </p>
                          {record.reference_no && (
                            <p className="text-xs text-muted-foreground">{record.reference_no}</p>
                          )}
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
              {previousDuesRecords.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payments made to previous year dues
                </div>
              ) : (
                previousDuesRecords.map((record, index) => (
                  <Card key={`${record.payment_id}_${index}`} className="border-l-4 border-l-red-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{record.fee_type}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(record.payment_date).toLocaleDateString()} • {record.method}
                          </p>
                          <Badge variant={record.entry_type === 'PAYMENT' ? 'default' : 'secondary'} className="mt-1">
                            {record.entry_type}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${record.entry_type === 'PAYMENT' ? 'text-green-600' : 'text-purple-600'}`}>
                            ₹{record.amount.toLocaleString()}
                          </p>
                          {record.reference_no && (
                            <p className="text-xs text-muted-foreground">{record.reference_no}</p>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{paymentHistory.filter(p => p.entry_type === 'PAYMENT').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paymentHistory.filter(p => p.entry_type === 'PAYMENT').length} payment(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Total Discounts</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-600">
                    ₹{paymentHistory.filter(p => p.entry_type === 'DISCOUNT').reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paymentHistory.filter(p => p.entry_type === 'DISCOUNT').length} discount(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Current Year</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    ₹{currentYearRecords.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {currentYearRecords.length} transaction(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium">Previous Dues</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ₹{previousDuesRecords.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {previousDuesRecords.length} transaction(s)
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