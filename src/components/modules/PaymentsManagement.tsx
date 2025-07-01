
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { StudentPayment, Class, AcademicYear, FeeStructure, Student } from "@/types/database";
import { PaymentForm } from "./payments-management/PaymentForm";
import { PaymentTable } from "./payments-management/PaymentTable";

export function PaymentsManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch payments with related data
      const { data: paymentsData, error: paymentsError } = await supabase
        .from("student_payments")
        .select(`
          *,
          students:student_id(first_name, last_name, admission_number),
          fee_structures:fee_structure_id(fee_type, amount, classes:class_id(name, section))
        `)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Fetch classes
      const { data: classesData, error: classesError } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (classesError) throw classesError;

      // Fetch academic years
      const { data: yearsData, error: yearsError } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (yearsError) throw yearsError;

      // Fetch students
      const { data: studentsData, error: studentsError } = await supabase
        .from("students")
        .select("*, classes:class_id(id, name, section)")
        .eq("status", "Active")
        .order("first_name");

      if (studentsError) throw studentsError;

      // Transform students data to match Student interface
      const transformedStudents: Student[] = (studentsData || []).map(student => ({
        ...student,
        gender: student.gender as 'Male' | 'Female' | 'Other',
        status: student.status as 'Active' | 'Inactive' | 'Alumni',
        caste_category: student.caste_category as Student['caste_category'],
        classes: student.classes ? {
          id: student.classes.id,
          name: student.classes.name,
          section: student.classes.section
        } : null
      }));

      // Fetch fee structures
      const { data: structuresData, error: structuresError } = await supabase
        .from("fee_structures")
        .select("*, classes:class_id(name, section)")
        .eq("is_active", true)
        .order("fee_type");

      if (structuresError) throw structuresError;

      // Transform fee structures data to match FeeStructure interface
      const transformedStructures: FeeStructure[] = (structuresData || []).map(structure => ({
        ...structure,
        fee_type: structure.fee_type as FeeStructure['fee_type'],
        frequency: structure.frequency as FeeStructure['frequency']
      }));

      setPayments(paymentsData || []);
      setClasses(classesData || []);
      setAcademicYears(yearsData || []);
      setStudents(transformedStudents);
      setFeeStructures(transformedStructures);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      // Validate payment date is not in the past
      const paymentDate = new Date(data.payment_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (paymentDate < today) {
        throw new Error("Payment date cannot be in the past");
      }

      // Get current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from("academic_years")
        .select("id")
        .eq("is_current", true)
        .single();

      if (yearError || !currentYear) {
        throw new Error("No current academic year found");
      }

      // Get fee structure details
      const selectedStructure = feeStructures.find(fs => fs.id === data.fee_structure_id);
      if (!selectedStructure) {
        throw new Error("Fee structure not found");
      }

      // First, find or create fee record in the enhanced fee system
      let feeRecord;
      const { data: existingFeeRecord, error: feeRecordError } = await supabase
        .from("student_fee_records")
        .select("*")
        .eq("student_id", data.student_id)
        .eq("academic_year_id", currentYear.id)
        .eq("fee_type", selectedStructure.fee_type)
        .single();

      if (feeRecordError && feeRecordError.code !== 'PGRST116') {
        throw feeRecordError;
      }

      if (existingFeeRecord) {
        feeRecord = existingFeeRecord;
      } else {
        // Create new fee record
        const { data: newFeeRecord, error: createError } = await supabase
          .from("student_fee_records")
          .insert({
            student_id: data.student_id,
            class_id: data.class_id,
            academic_year_id: currentYear.id,
            fee_type: selectedStructure.fee_type,
            actual_fee: selectedStructure.amount,
            due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            status: 'Pending'
          })
          .select()
          .single();

        if (createError) throw createError;
        feeRecord = newFeeRecord;
      }

      // Generate receipt number
      const receiptNumber = `RCP-${Date.now()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

      // Record payment in both systems
      const [paymentResult, feePaymentResult] = await Promise.all([
        // Record in student_payments table
        supabase.from("student_payments").insert([{
          student_id: data.student_id,
          fee_structure_id: data.fee_structure_id,
          amount_paid: parseFloat(data.amount_paid),
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          late_fee: parseFloat(data.late_fee) || 0,
          reference_number: data.reference_number || receiptNumber,
          payment_received_by: data.payment_received_by,
          notes: data.notes || null,
        }]),

        // Record in fee_payment_records table (enhanced system)
        supabase.from("fee_payment_records").insert([{
          fee_record_id: feeRecord.id,
          student_id: data.student_id,
          amount_paid: parseFloat(data.amount_paid),
          payment_date: data.payment_date,
          payment_method: data.payment_method,
          late_fee: parseFloat(data.late_fee) || 0,
          receipt_number: data.reference_number || receiptNumber,
          payment_receiver: data.payment_received_by,
          notes: data.notes || null,
          created_by: data.payment_received_by
        }])
      ]);

      if (paymentResult.error) throw paymentResult.error;
      if (feePaymentResult.error) throw feePaymentResult.error;

      // Also record in payment_history for timeline tracking
      await supabase.from("payment_history").insert([{
        fee_id: feeRecord.id,
        student_id: data.student_id,
        amount_paid: parseFloat(data.amount_paid),
        payment_date: data.payment_date,
        receipt_number: data.reference_number || receiptNumber,
        payment_receiver: data.payment_received_by,
        payment_method: data.payment_method,
        notes: data.notes || null,
        fee_type: selectedStructure.fee_type
      }]);

      toast({ title: "Payment recorded successfully" });
      setDialogOpen(false);
      fetchData();
    } catch (error: any) {
      toast({
        title: "Error recording payment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleRecordPayment = () => {
    setDialogOpen(true);
  };

  const filteredPayments = payments.filter((payment) =>
    payment.students?.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.students?.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.students?.admission_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.fee_structures?.fee_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.reference_number?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-3xl font-bold text-gray-900">Payments Management</h1>
          <p className="text-gray-600 mt-2">Record and track student fee payments</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleRecordPayment}>
              <Plus className="w-4 h-4 mr-2" />
              Record Payment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Record New Payment</DialogTitle>
              <DialogDescription>
                Record a payment made by a student for their fees
              </DialogDescription>
            </DialogHeader>
            <PaymentForm
              classes={classes}
              students={students}
              feeStructures={feeStructures}
              onSubmit={handleSubmit}
              onCancel={() => setDialogOpen(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Payment Records</CardTitle>
              <CardDescription>View all recorded payments and their details</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <PaymentTable payments={filteredPayments} />
        </CardContent>
      </Card>
    </div>
  );
}
