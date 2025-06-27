import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, DollarSign, AlertTriangle, CheckCircle, Receipt, Filter, Eye, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StudentBasic } from "@/types/database";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { StudentPaymentHistory } from "./student-management/StudentPaymentHistory";
import { FeeManagementFilters } from "./fee-management/FeeManagementFilters";
import { FeeStats } from "./fee-management/FeeStats";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  student?: StudentBasic & {
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

interface Class {
  id: string;
  name: string;
  section: string | null;
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

interface FilterState {
  class_id: string;
  section: string;
  status: string;
  fee_type: string;
  due_date_from: string;
  due_date_to: string;
}

export function FeeManagement() {
  const [fees, setFees] = useState<Fee[]>([]);
  const [students, setStudents] = useState<StudentBasic[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    class_id: "all",
    section: "all",
    status: "all",
    fee_type: "all",
    due_date_from: "",
    due_date_to: "",
  });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [selectedStudentFees, setSelectedStudentFees] = useState<Fee[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState("");
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
    fetchClasses();
    
    // Set up real-time subscription for fee updates
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fees'
        },
        () => {
          console.log('Fee data changed, refreshing...');
          fetchFees();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section")
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
    }
  };

  const fetchFees = async () => {
    try {
      const { data, error } = await supabase
        .from("fees")
        .select(`
          *,
          students!inner(
            id, 
            first_name, 
            last_name, 
            admission_number,
            class_id,
            classes(name, section),
            student_parent_links(
              parents(phone_number, email)
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const feesWithStudents = (data || []).map(fee => ({
        ...fee,
        status: fee.status as 'Pending' | 'Paid' | 'Overdue',
        student: {
          ...fee.students,
          class_name: fee.students.classes?.name,
          section: fee.students.classes?.section,
          parent_phone: fee.students.student_parent_links?.[0]?.parents?.phone_number,
          parent_email: fee.students.student_parent_links?.[0]?.parents?.email,
          class_id: fee.students.class_id,
        }
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

  const openHistoryDialog = (student: Fee['student']) => {
    if (!student) return;
    
    const studentFees = fees.filter(fee => fee.student_id === student.id);
    setSelectedStudentFees(studentFees);
    setSelectedStudentName(`${student.first_name} ${student.last_name}`);
    setHistoryDialogOpen(true);
  };

  const applyFilters = (fees: Fee[]) => {
    return fees.filter((fee) => {
      const matchesSearch = fee.student && 
        (`${fee.student.first_name} ${fee.student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (fee.student.class_name && fee.student.class_name.toLowerCase().includes(searchTerm.toLowerCase())));
      
      const matchesClass = filters.class_id === "all" || 
        (fee.student?.class_id === filters.class_id);
      
      const matchesSection = filters.section === "all" || 
        (fee.student?.section === filters.section);
      
      const matchesStatus = filters.status === "all" || 
        fee.status.toLowerCase() === filters.status.toLowerCase();
      
      const matchesFeeType = filters.fee_type === "all" || 
        fee.fee_type === filters.fee_type;
      
      const matchesDueDateFrom = !filters.due_date_from || 
        new Date(fee.due_date) >= new Date(filters.due_date_from);
      
      const matchesDueDateTo = !filters.due_date_to || 
        new Date(fee.due_date) <= new Date(filters.due_date_to);
      
      return matchesSearch && matchesClass && matchesSection && 
             matchesStatus && matchesFeeType && matchesDueDateFrom && matchesDueDateTo;
    });
  };

  const filteredFees = applyFilters(fees);

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
          <p className="text-gray-600 mt-2">Comprehensive fee tracking with real-time updates</p>
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

      <FeeStats stats={feeStats} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Records</CardTitle>
              <CardDescription>Comprehensive fee management with real-time updates</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by student, class, or fee type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FeeManagementFilters
            filters={filters}
            onFiltersChange={setFilters}
            classes={classes}
          />

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Parent Contact</TableHead>
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
                  <TableCell>
                    <div className="text-sm">
                      <div>{fee.student?.class_name || "N/A"}</div>
                      {fee.student?.section && (
                        <div className="text-gray-500">Section {fee.student.section}</div>
                      )}
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
                    <div className="text-sm">
                      {fee.student?.parent_phone && (
                        <div>{fee.student.parent_phone}</div>
                      )}
                      {fee.student?.parent_email && (
                        <div className="text-gray-500">{fee.student.parent_email}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
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
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openHistoryDialog(fee.student)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No fee records found matching your criteria</p>
            </div>
          )}
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

      <StudentPaymentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        studentName={selectedStudentName}
        fees={selectedStudentFees}
      />
    </div>
  );
}
