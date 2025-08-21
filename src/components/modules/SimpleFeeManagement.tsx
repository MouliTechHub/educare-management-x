import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FEE_TYPE_OPTIONS } from "@/constants/feeTypes";
import { Plus, CreditCard, Percent, History, RefreshCw, Search, X } from "lucide-react";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  class_id: string;
  classes?: {
    name: string;
    section?: string;
  };
}

interface FeeRecord {
  id: string;
  student_id: string;
  class_id: string;
  fee_type: string;
  actual_fee: number;
  discount_amount: number;
  final_fee: number;
  paid_amount: number;
  balance_fee: number;
  due_date: string;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial';
  student?: Student;
}

interface AcademicYear {
  id: string;
  year_name: string;
  is_current: boolean;
}

export function SimpleFeeManagement() {
  const [feeRecords, setFeeRecords] = useState<FeeRecord[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FeeRecord | null>(null);
  
  // Form states
  const [newFee, setNewFee] = useState({
    student_id: '',
    fee_type: 'Tuition Fee',
    amount: 5000,
    due_date: ''
  });
  
  const [payment, setPayment] = useState({
    amount: 0,
    method: 'Cash',
    receipt: '',
    notes: ''
  });
  
  const [discount, setDiscount] = useState({
    type: 'Fixed Amount',
    amount: 0,
    reason: '',
    notes: ''
  });

  const { toast } = useToast();

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedYear) {
      loadFeeRecords();
    }
  }, [selectedYear]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      
      // Load academic years
      const { data: years, error: yearsError } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (yearsError) throw yearsError;
      
      setAcademicYears(years || []);
      
      // Set current year as default
      const currentYear = years?.find(y => y.is_current);
      if (currentYear) {
        setSelectedYear(currentYear.id);
      }
      
      // Load students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          id, first_name, last_name, admission_number, class_id,
          classes(name, section)
        `)
        .eq('status', 'Active');
      
      if (studentsError) throw studentsError;
      
      setStudents(studentsData || []);
      
    } catch (error: any) {
      console.error('Error loading initial data:', error);
      toast({
        title: "Error loading data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadFeeRecords = async () => {
    if (!selectedYear) return;
    
    try {
      setLoading(true);
      
      const { data: records, error } = await supabase
        .from('student_fee_records')
        .select(`
          *,
          students!fk_sfr_student(
            id, first_name, last_name, admission_number, class_id,
            classes(name, section)
          )
        `)
        .eq('academic_year_id', selectedYear);
      
      if (error) throw error;
      
      // Transform data to match our interface
      const transformedRecords: FeeRecord[] = (records || []).map(record => ({
        id: record.id,
        student_id: record.student_id,
        class_id: record.class_id,
        fee_type: record.fee_type,
        actual_fee: record.actual_fee,
        discount_amount: record.discount_amount,
        final_fee: record.final_fee || (record.actual_fee - record.discount_amount),
        paid_amount: record.paid_amount,
        balance_fee: record.balance_fee || ((record.actual_fee - record.discount_amount) - record.paid_amount),
        due_date: record.due_date,
        status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
        student: record.students ? {
          id: record.students.id,
          first_name: record.students.first_name,
          last_name: record.students.last_name,
          admission_number: record.students.admission_number,
          class_id: record.students.class_id,
          classes: record.students.classes
        } : undefined
      }));
      
      setFeeRecords(transformedRecords);
      
    } catch (error: any) {
      console.error('Error loading fee records:', error);
      toast({
        title: "Error loading fee records",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createFeeRecord = async () => {
    try {
      if (!newFee.student_id || !selectedYear) {
        toast({
          title: "Missing information",
          description: "Please select a student and ensure academic year is selected",
          variant: "destructive",
        });
        return;
      }

      // Get the student's class_id
      const selectedStudent = students.find(s => s.id === newFee.student_id);
      if (!selectedStudent) {
        toast({
          title: "Student not found",
          description: "Please select a valid student",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from('student_fee_records')
        .insert({
          student_id: newFee.student_id,
          class_id: selectedStudent.class_id,
          academic_year_id: selectedYear,
          fee_type: newFee.fee_type,
          actual_fee: newFee.amount,
          discount_amount: 0,
          paid_amount: 0,
          due_date: newFee.due_date,
          status: 'Pending'
        });

      if (error) throw error;

      toast({
        title: "Fee record created",
        description: "New fee record has been created successfully"
      });

      setCreateDialogOpen(false);
      setNewFee({
        student_id: '',
        fee_type: 'Tuition Fee',
        amount: 5000,
        due_date: ''
      });
      loadFeeRecords();

    } catch (error: any) {
      console.error('Error creating fee record:', error);
      toast({
        title: "Error creating fee record",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const recordPayment = async () => {
    if (!selectedRecord) return;

    try {
      // Record payment
      const { error: paymentError } = await supabase
        .from('fee_payment_records')
        .insert({
          fee_record_id: selectedRecord.id,
          student_id: selectedRecord.student_id,
          amount_paid: payment.amount,
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: payment.method,
          receipt_number: payment.receipt || `RCP-${Date.now()}`,
          payment_receiver: 'Admin',
          notes: payment.notes,
          created_by: 'Admin'
        });

      if (paymentError) throw paymentError;

      // Update fee record - only update the fields we can update
      const newPaidAmount = selectedRecord.paid_amount + payment.amount;
      const newBalanceAmount = selectedRecord.final_fee - newPaidAmount;
      const newStatus = newBalanceAmount <= 0 ? 'Paid' : newBalanceAmount < selectedRecord.final_fee ? 'Partial' : 'Pending';

      const { error: updateError } = await supabase
        .from('student_fee_records')
        .update({
          paid_amount: newPaidAmount,
          status: newStatus
        })
        .eq('id', selectedRecord.id);

      if (updateError) throw updateError;

      toast({
        title: "Payment recorded",
        description: `Payment of ₹${payment.amount} recorded successfully`
      });

      setPaymentDialogOpen(false);
      setPayment({ amount: 0, method: 'Cash', receipt: '', notes: '' });
      loadFeeRecords();

    } catch (error: any) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const applyDiscount = async () => {
    if (!selectedRecord) return;

    try {
      let discountAmount = 0;
      
      if (discount.type === 'Fixed Amount') {
        discountAmount = discount.amount;
      } else if (discount.type === 'Percentage') {
        discountAmount = (selectedRecord.actual_fee * discount.amount) / 100;
      }

      // Only update the discount amount - let triggers handle computed columns
      const { error } = await supabase
        .from('student_fee_records')
        .update({
          discount_amount: discountAmount,
          discount_notes: discount.notes,
          discount_updated_by: 'Admin',
          discount_updated_at: new Date().toISOString()
        })
        .eq('id', selectedRecord.id);

      if (error) throw error;

      toast({
        title: "Discount applied",
        description: `Discount of ₹${discountAmount.toFixed(2)} applied successfully`
      });

      setDiscountDialogOpen(false);
      setDiscount({ type: 'Fixed Amount', amount: 0, reason: '', notes: '' });
      loadFeeRecords();

    } catch (error: any) {
      console.error('Error applying discount:', error);
      toast({
        title: "Error applying discount",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const filteredRecords = feeRecords.filter(record => {
    if (!searchTerm) return true;
    const studentName = `${record.student?.first_name} ${record.student?.last_name}`.toLowerCase();
    const admissionNumber = record.student?.admission_number?.toLowerCase() || '';
    const feeType = record.fee_type.toLowerCase();
    const search = searchTerm.toLowerCase();
    return studentName.includes(search) || admissionNumber.includes(search) || feeType.includes(search);
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-4 text-gray-600">Loading fee management...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-2">Manage student fees, payments, and discounts</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Academic Year" />
            </SelectTrigger>
            <SelectContent>
              {academicYears.map((year) => (
                <SelectItem key={year.id} value={year.id}>
                  {year.year_name} {year.is_current && '(Current)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={loadFeeRecords} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Records</CardTitle>
            <div className="text-2xl font-bold">{feeRecords.length}</div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Collected</CardTitle>
            <div className="text-2xl font-bold text-green-600">
              ₹{feeRecords.reduce((sum, record) => sum + record.paid_amount, 0).toLocaleString()}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Pending</CardTitle>
            <div className="text-2xl font-bold text-red-600">
              ₹{feeRecords.reduce((sum, record) => sum + record.balance_fee, 0).toLocaleString()}
            </div>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Discount</CardTitle>
            <div className="text-2xl font-bold text-blue-600">
              ₹{feeRecords.reduce((sum, record) => sum + record.discount_amount, 0).toLocaleString()}
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Fee Records Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Records</CardTitle>
              <CardDescription>Manage student fee records and payments</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  placeholder="Search students or fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Fee Record
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create New Fee Record</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Student</Label>
                      <Select value={newFee.student_id} onValueChange={(value) => setNewFee(prev => ({ ...prev, student_id: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select student" />
                        </SelectTrigger>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.first_name} {student.last_name} ({student.admission_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Fee Type</Label>
                      <Select value={newFee.fee_type} onValueChange={(value) => setNewFee(prev => ({ ...prev, fee_type: value }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FEE_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Amount</Label>
                      <Input
                        type="number"
                        value={newFee.amount}
                        onChange={(e) => setNewFee(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Due Date</Label>
                      <Input
                        type="date"
                        value={newFee.due_date}
                        onChange={(e) => setNewFee(prev => ({ ...prev, due_date: e.target.value }))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                      <Button onClick={createFeeRecord}>Create</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No fee records found</p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Fee Record
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Class</TableHead>
                  <TableHead>Fee Type</TableHead>
                  <TableHead>Actual Fee</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Final Fee</TableHead>
                  <TableHead>Paid Amount</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {record.student?.first_name} {record.student?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {record.student?.admission_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {record.student?.classes?.name}
                      {record.student?.classes?.section && ` - ${record.student.classes.section}`}
                    </TableCell>
                    <TableCell>{record.fee_type}</TableCell>
                    <TableCell>₹{record.actual_fee.toLocaleString()}</TableCell>
                    <TableCell>
                      {record.discount_amount > 0 ? (
                        <span className="text-green-600">₹{record.discount_amount.toLocaleString()}</span>
                      ) : (
                        <span className="text-gray-400">₹0</span>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">₹{record.final_fee.toLocaleString()}</TableCell>
                    <TableCell className="text-blue-600">₹{record.paid_amount.toLocaleString()}</TableCell>
                    <TableCell className={record.balance_fee > 0 ? 'text-red-600' : 'text-green-600'}>
                      ₹{record.balance_fee.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {record.due_date ? new Date(record.due_date).toLocaleDateString() : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedRecord(record);
                            setDiscount({ type: 'Fixed Amount', amount: 0, reason: '', notes: '' });
                            setDiscountDialogOpen(true);
                          }}
                        >
                          <Percent className="w-3 h-3" />
                        </Button>
                        {record.balance_fee > 0 && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRecord(record);
                              setPayment({ amount: record.balance_fee, method: 'Cash', receipt: '', notes: '' });
                              setPaymentDialogOpen(true);
                            }}
                          >
                            <CreditCard className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p><strong>Student:</strong> {selectedRecord.student?.first_name} {selectedRecord.student?.last_name}</p>
                <p><strong>Fee Type:</strong> {selectedRecord.fee_type}</p>
                <p><strong>Balance Amount:</strong> ₹{selectedRecord.balance_fee.toLocaleString()}</p>
              </div>
              <div>
                <Label>Payment Amount</Label>
                <Input
                  type="number"
                  value={payment.amount}
                  onChange={(e) => setPayment(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                  max={selectedRecord.balance_fee}
                />
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={payment.method} onValueChange={(value) => setPayment(prev => ({ ...prev, method: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Card">Card</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                    <SelectItem value="Cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Receipt Number</Label>
                <Input
                  value={payment.receipt}
                  onChange={(e) => setPayment(prev => ({ ...prev, receipt: e.target.value }))}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={payment.notes}
                  onChange={(e) => setPayment(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
                <Button onClick={recordPayment}>Record Payment</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Updated Discount Dialog */}
      <Dialog open={discountDialogOpen} onOpenChange={setDiscountDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Apply Discount</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDiscountDialogOpen(false)}
              className="h-auto p-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {selectedRecord && (
            <div className="space-y-6">
              <div className="text-sm text-gray-600">
                Apply discount for {selectedRecord.student?.first_name} {selectedRecord.student?.last_name} - {selectedRecord.fee_type}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-700">Actual Amount</Label>
                  <div className="text-xl font-bold">₹{selectedRecord.actual_fee.toLocaleString()}</div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-700">Current Discount</Label>
                  <div className="text-xl font-bold text-green-600">₹{selectedRecord.discount_amount.toLocaleString()}</div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-gray-900">Discount Type</Label>
                  <Select value={discount.type} onValueChange={(value) => setDiscount(prev => ({ ...prev, type: value, amount: 0 }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Fixed Amount">Fixed Amount</SelectItem>
                      <SelectItem value="Percentage">Percentage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">
                    Amount {discount.type === 'Percentage' ? '(%)' : '(₹)'}
                  </Label>
                  <Input
                    type="number"
                    value={discount.amount}
                    onChange={(e) => setDiscount(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                    max={discount.type === 'Fixed Amount' ? selectedRecord.actual_fee : 100}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Reason for Discount</Label>
                  <Select value={discount.reason} onValueChange={(value) => setDiscount(prev => ({ ...prev, reason: value }))}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select reason" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Scholarship">Scholarship</SelectItem>
                      <SelectItem value="Financial Hardship">Financial Hardship</SelectItem>
                      <SelectItem value="Sibling Discount">Sibling Discount</SelectItem>
                      <SelectItem value="Merit Based">Merit Based</SelectItem>
                      <SelectItem value="Staff Quota">Staff Quota</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium text-gray-900">Additional Notes</Label>
                  <Textarea
                    value={discount.notes}
                    onChange={(e) => setDiscount(prev => ({ ...prev, notes: e.target.value }))}
                    rows={3}
                    className="mt-1"
                    placeholder="Enter any additional notes about this discount..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setDiscountDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={applyDiscount}
                  className="bg-gray-900 hover:bg-gray-800 text-white"
                >
                  Apply Discount
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
