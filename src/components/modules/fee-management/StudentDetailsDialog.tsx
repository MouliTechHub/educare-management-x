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
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  GraduationCap, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar,
  CreditCard,
  Percent,
  AlertTriangle,
  DollarSign,
  BookOpen
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface StudentDetails {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  gender: string;
  date_of_birth: string;
  date_of_join: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pin_code: string;
  blood_group: string;
  religion: string;
  nationality: string;
  status: string;
  class_name: string;
  section: string;
  parent_phone: string;
  parent_email: string;
  parent_name: string;
}

interface PaymentRecord {
  id: string;
  amount_paid: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  payment_receiver: string;
  notes: string;
  fee_type: string;
  academic_year: string;
}

interface DiscountRecord {
  id: string;
  discount_amount: number;
  discount_type: string;
  reason: string;
  applied_at: string;
  applied_by: string;
  notes: string;
  fee_type: string;
  academic_year: string;
}

interface YearlyFeeRecord {
  academic_year: string;
  fee_type: string;
  actual_fee: number;
  discount_amount: number;
  paid_amount: number;
  balance_fee: number;
  status: string;
  due_date: string;
}

interface StudentDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string | null;
}

export function StudentDetailsDialog({
  open,
  onOpenChange,
  studentId
}: StudentDetailsDialogProps) {
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [discountHistory, setDiscountHistory] = useState<DiscountRecord[]>([]);
  const [yearlyFees, setYearlyFees] = useState<YearlyFeeRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchStudentDetails = async () => {
    if (!studentId) return;

    setLoading(true);
    try {
      // Fetch student basic details with class and parent info
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select(`
          *,
          classes!inner(name, section),
          student_parent_links!inner(
            parents!inner(
              first_name,
              last_name,
              phone_number,
              email
            )
          )
        `)
        .eq('id', studentId)
        .single();

      if (studentError) throw studentError;

      // Transform student data
      const transformedStudent: StudentDetails = {
        ...student,
        class_name: student.classes.name,
        section: student.classes.section || '',
        parent_name: student.student_parent_links[0]?.parents?.first_name + ' ' + student.student_parent_links[0]?.parents?.last_name || '',
        parent_phone: student.student_parent_links[0]?.parents?.phone_number || '',
        parent_email: student.student_parent_links[0]?.parents?.email || ''
      };

      setStudentDetails(transformedStudent);

      // Fetch payment history
      const { data: payments, error: paymentsError } = await supabase
        .from('fee_payment_records')
        .select(`
          *,
          student_fee_records!inner(
            fee_type,
            academic_years!inner(year_name)
          )
        `)
        .eq('student_id', studentId)
        .order('payment_date', { ascending: false });

      if (paymentsError) throw paymentsError;

      const transformedPayments: PaymentRecord[] = (payments || []).map((payment: any) => ({
        ...payment,
        fee_type: payment.student_fee_records?.fee_type || 'Unknown',
        academic_year: payment.student_fee_records?.academic_years?.year_name || 'Unknown'
      }));

      setPaymentHistory(transformedPayments);

      // Fetch discount history
      const { data: discounts, error: discountsError } = await supabase
        .from('discount_history')
        .select(`
          *,
          student_fee_records!inner(
            fee_type,
            academic_years!inner(year_name)
          )
        `)
        .eq('student_id', studentId)
        .order('applied_at', { ascending: false });

      if (discountsError) throw discountsError;

      const transformedDiscounts: DiscountRecord[] = (discounts || []).map((discount: any) => ({
        ...discount,
        fee_type: discount.student_fee_records?.fee_type || 'Unknown',
        academic_year: discount.student_fee_records?.academic_years?.year_name || 'Unknown'
      }));

      setDiscountHistory(transformedDiscounts);

      // Fetch yearly fee records
      const { data: feeRecords, error: feeError } = await supabase
        .from('student_fee_records')
        .select(`
          *,
          academic_years!inner(year_name)
        `)
        .eq('student_id', studentId)
        .order('academic_years.start_date', { ascending: false });

      if (feeError) throw feeError;

      const transformedFeeRecords: YearlyFeeRecord[] = (feeRecords || []).map((record: any) => ({
        academic_year: record.academic_years.year_name,
        fee_type: record.fee_type,
        actual_fee: record.actual_fee,
        discount_amount: record.discount_amount,
        paid_amount: record.paid_amount,
        balance_fee: record.balance_fee || (record.actual_fee - record.discount_amount - record.paid_amount),
        status: record.status,
        due_date: record.due_date
      }));

      setYearlyFees(transformedFeeRecords);

    } catch (error: any) {
      console.error('Error fetching student details:', error);
      toast({
        title: "Error",
        description: "Failed to fetch student details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open && studentId) {
      fetchStudentDetails();
    }
  }, [open, studentId]);

  const getTotalPaid = () => paymentHistory.reduce((sum, payment) => sum + payment.amount_paid, 0);
  const getTotalDiscount = () => discountHistory.reduce((sum, discount) => sum + discount.discount_amount, 0);
  const getTotalOutstanding = () => yearlyFees.reduce((sum, fee) => sum + fee.balance_fee, 0);

  // Group yearly fees by academic year
  const groupedYearlyFees = yearlyFees.reduce((groups, fee) => {
    if (!groups[fee.academic_year]) {
      groups[fee.academic_year] = [];
    }
    groups[fee.academic_year].push(fee);
    return groups;
  }, {} as Record<string, YearlyFeeRecord[]>);

  if (!studentDetails) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Student Details - {studentDetails.first_name} {studentDetails.last_name}
            <Badge variant="outline">{studentDetails.admission_number}</Badge>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="details">Personal Details</TabsTrigger>
            <TabsTrigger value="payments">Payment History</TabsTrigger>
            <TabsTrigger value="discounts">Discount History</TabsTrigger>
            <TabsTrigger value="yearly">Yearly Fees</TabsTrigger>
            <TabsTrigger value="summary">Summary</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Basic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">First Name</p>
                      <p className="font-medium">{studentDetails.first_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Last Name</p>
                      <p className="font-medium">{studentDetails.last_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Admission Number</p>
                      <p className="font-medium">{studentDetails.admission_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Gender</p>
                      <p className="font-medium">{studentDetails.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Birth</p>
                      <p className="font-medium">{new Date(studentDetails.date_of_birth).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Date of Join</p>
                      <p className="font-medium">
                        {studentDetails.date_of_join ? new Date(studentDetails.date_of_join).toLocaleDateString() : 'N/A'}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Academic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    Academic Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Class</p>
                    <p className="font-medium">{studentDetails.class_name}{studentDetails.section && ` - ${studentDetails.section}`}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge variant={studentDetails.status === 'Active' ? 'default' : 'secondary'}>
                      {studentDetails.status}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blood Group</p>
                    <p className="font-medium">{studentDetails.blood_group || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Religion</p>
                    <p className="font-medium">{studentDetails.religion || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Nationality</p>
                    <p className="font-medium">{studentDetails.nationality || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Name</p>
                    <p className="font-medium">{studentDetails.parent_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Phone</p>
                    <p className="font-medium">{studentDetails.parent_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Parent Email</p>
                    <p className="font-medium">{studentDetails.parent_email || 'N/A'}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Address</p>
                    <p className="font-medium">
                      {[
                        studentDetails.address_line1,
                        studentDetails.address_line2,
                        studentDetails.city,
                        studentDetails.state,
                        studentDetails.pin_code
                      ].filter(Boolean).join(', ') || 'N/A'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <div className="space-y-4">
              {paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No payment history found
                </div>
              ) : (
                paymentHistory.map((payment) => (
                  <Card key={payment.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(payment.payment_date).toLocaleDateString()}
                            </span>
                            <Badge variant="outline">{payment.payment_method}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {payment.fee_type} • {payment.academic_year}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Receipt: {payment.receipt_number} • Received by: {payment.payment_receiver}
                          </p>
                          {payment.notes && (
                            <p className="text-xs text-muted-foreground">Note: {payment.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            ₹{payment.amount_paid.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="discounts" className="space-y-4">
            <div className="space-y-4">
              {discountHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No discount history found
                </div>
              ) : (
                discountHistory.map((discount) => (
                  <Card key={discount.id}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Percent className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {new Date(discount.applied_at).toLocaleDateString()}
                            </span>
                            <Badge variant="outline">{discount.discount_type}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {discount.fee_type} • {discount.academic_year}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Reason: {discount.reason} • Applied by: {discount.applied_by}
                          </p>
                          {discount.notes && (
                            <p className="text-xs text-muted-foreground">Note: {discount.notes}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-orange-600">
                            -₹{discount.discount_amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="yearly" className="space-y-4">
            <div className="space-y-6">
              {Object.entries(groupedYearlyFees).map(([year, fees]) => (
                <Card key={year}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {year}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {fees.map((fee, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded">
                          <div>
                            <p className="font-medium">{fee.fee_type}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="flex items-center gap-4 text-sm">
                              <span>Actual: ₹{fee.actual_fee.toLocaleString()}</span>
                              <span className="text-orange-600">Discount: -₹{fee.discount_amount.toLocaleString()}</span>
                              <span className="text-green-600">Paid: ₹{fee.paid_amount.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`font-bold ${fee.balance_fee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                Balance: ₹{fee.balance_fee.toLocaleString()}
                              </span>
                              <Badge variant={
                                fee.status === 'Paid' ? 'default' : 
                                fee.status === 'Overdue' ? 'destructive' : 'secondary'
                              }>
                                {fee.status}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <CreditCard className="h-4 w-4" />
                    Total Payments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-600">
                    ₹{getTotalPaid().toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paymentHistory.length} payment(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Percent className="h-4 w-4" />
                    Total Discounts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    ₹{getTotalDiscount().toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {discountHistory.length} discount(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    Outstanding Fees
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    ₹{getTotalOutstanding().toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {yearlyFees.filter(f => f.balance_fee > 0).length} pending fee(s)
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <DollarSign className="h-4 w-4" />
                    Total Fee Amount
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{yearlyFees.reduce((sum, fee) => sum + fee.actual_fee, 0).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Across {Object.keys(groupedYearlyFees).length} academic year(s)
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Payment vs Outstanding Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Payment Rate</span>
                    <span className="font-bold">
                      {yearlyFees.reduce((sum, fee) => sum + fee.actual_fee, 0) > 0 
                        ? Math.round((getTotalPaid() / yearlyFees.reduce((sum, fee) => sum + fee.actual_fee, 0)) * 100)
                        : 0}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Discount Rate</span>
                    <span className="font-bold">
                      {yearlyFees.reduce((sum, fee) => sum + fee.actual_fee, 0) > 0 
                        ? Math.round((getTotalDiscount() / yearlyFees.reduce((sum, fee) => sum + fee.actual_fee, 0)) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
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