
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, DollarSign, AlertTriangle, CheckCircle, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StudentBasic } from "@/types/database";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  fee_type: string;
  due_date: string;
  payment_date?: string;
  status: string;
  receipt_number?: string;
  created_at: string;
  student?: StudentBasic;
}

interface FeeFormData {
  student_id: string;
  amount: number;
  fee_type: string;
  due_date: string;
}

interface PaymentFormData {
  payment_date: string;
  receipt_number: string;
}

export function FeeManagement() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<StudentBasic[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const { toast } = useToast();

  const feeForm = useForm<FeeFormData>({
    defaultValues: {
      student_id: "",
      amount: 0,
      fee_type: "Tuition",
      due_date: "",
    },
  });

  const paymentForm = useForm<PaymentFormData>({
    defaultValues: {
      payment_date: new Date().toISOString().split('T')[0],
      receipt_number: "",
    },
  });

  useEffect(() => {
    fetchFees();
    fetchStudents();
  }, []);

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select(`
          *,
          students!inner(id, first_name, last_name, admission_number)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const feesWithStudents = (data || []).map(fee => ({
        ...fee,
        student: fee.students
      }));

      setFees(feesWithStudents);
    } catch (error: any) {
      toast({
        title: "Error fetching fees",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, admission_number")
        .eq("status", "Active")
        .order("first_name");

      if (error) throw error;
      setStudents(data || []);
    } catch (error: any) {
      console.error("Error fetching students:", error);
    }
  };

  const onSubmitFee = async (data: FeeFormData) => {
    try {
      const { error } = await supabase
        .from("fees")
        .insert([{
          ...data,
          status: "Pending"
        }]);

      if (error) throw error;

      toast({ title: "Fee record created successfully" });
      fetchFees();
      setDialogOpen(false);
      feeForm.reset();
    } catch (error: any) {
      toast({
        title: "Error creating fee record",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const onSubmitPayment = async (data: PaymentFormData) => {
    if (!selectedFee) return;

    try {
      const { error } = await supabase
        .from("fees")
        .update({
          status: "Paid",
          payment_date: data.payment_date,
          receipt_number: data.receipt_number
        })
        .eq("id", selectedFee.id);

      if (error) throw error;

      toast({ title: "Payment recorded successfully" });
      fetchFees();
      setPaymentDialogOpen(false);
      setSelectedFee(null);
      paymentForm.reset();
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openPaymentDialog = (fee: Fee) => {
    setSelectedFee(fee);
    paymentForm.reset({
      payment_date: new Date().toISOString().split('T')[0],
      receipt_number: `RCP-${Date.now()}`
    });
    setPaymentDialogOpen(true);
  };

  const filteredFees = fees.filter((fee) => {
    const matchesSearch = fee.student && 
      `${fee.student.first_name} ${fee.student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student?.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || fee.status.toLowerCase() === statusFilter.toLowerCase();
    
    return matchesSearch && matchesStatus;
  });

  const feeStats = {
    total: fees.reduce((sum, fee) => sum + fee.amount, 0),
    collected: fees.filter(f => f.status === "Paid").reduce((sum, fee) => sum + fee.amount, 0),
    pending: fees.filter(f => f.status === "Pending").reduce((sum, fee) => sum + fee.amount, 0),
    overdue: fees.filter(f => f.status === "Pending" && new Date(f.due_date) < new Date()).length
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Pending":
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      case "Overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string, dueDate: string) => {
    if (status === "Paid") return "default";
    if (status === "Pending" && new Date(dueDate) < new Date()) return "destructive";
    return "secondary";
  };

  const getDisplayStatus = (status: string, dueDate: string) => {
    if (status === "Paid") return "Paid";
    if (status === "Pending" && new Date(dueDate) < new Date()) return "Overdue";
    return status;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-2">Track and manage student fee payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => feeForm.reset()}>
              <Plus className="w-4 h-4 mr-2" />
              Add Fee Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Fee Record</DialogTitle>
              <DialogDescription>
                Create a fee record for a student
              </DialogDescription>
            </DialogHeader>
            <Form {...feeForm}>
              <form onSubmit={feeForm.handleSubmit(onSubmitFee)} className="space-y-4">
                <FormField
                  control={feeForm.control}
                  name="student_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a student" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {students.map((student) => (
                            <SelectItem key={student.id} value={student.id}>
                              {student.first_name} {student.last_name} ({student.admission_number})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feeForm.control}
                  name="fee_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fee Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Tuition">Tuition Fee</SelectItem>
                          <SelectItem value="Library">Library Fee</SelectItem>
                          <SelectItem value="Lab">Laboratory Fee</SelectItem>
                          <SelectItem value="Sports">Sports Fee</SelectItem>
                          <SelectItem value="Transport">Transport Fee</SelectItem>
                          <SelectItem value="Exam">Exam Fee</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feeForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount (₹)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          step="0.01"
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                          required 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={feeForm.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input {...field} type="date" required />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Fee Record</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{feeStats.total.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{feeStats.collected.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{feeStats.pending.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{feeStats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Records</CardTitle>
              <CardDescription>Manage student fee payments and records</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center space-x-2">
                <Search className="w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search fees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "Unknown"}
                      </div>
                      <div className="text-sm text-gray-500">
                        {fee.student?.admission_number}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{fee.fee_type}</TableCell>
                  <TableCell className="font-medium">₹{fee.amount.toLocaleString()}</TableCell>
                  <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(fee.status, fee.due_date)}>
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(getDisplayStatus(fee.status, fee.due_date))}
                        <span>{getDisplayStatus(fee.status, fee.due_date)}</span>
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {fee.status === "Pending" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openPaymentDialog(fee)}
                      >
                        <Receipt className="w-4 h-4 mr-1" />
                        Record Payment
                      </Button>
                    )}
                    {fee.status === "Paid" && fee.receipt_number && (
                      <span className="text-sm text-gray-500">
                        Receipt: {fee.receipt_number}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record payment for {selectedFee?.student ? 
                `${selectedFee.student.first_name} ${selectedFee.student.last_name}` : 
                "student"} - {selectedFee?.fee_type} (₹{selectedFee?.amount.toLocaleString()})
            </DialogDescription>
          </DialogHeader>
          <Form {...paymentForm}>
            <form onSubmit={paymentForm.handleSubmit(onSubmitPayment)} className="space-y-4">
              <FormField
                control={paymentForm.control}
                name="payment_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Date</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={paymentForm.control}
                name="receipt_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Receipt Number</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Enter receipt number" required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setPaymentDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Record Payment</Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
