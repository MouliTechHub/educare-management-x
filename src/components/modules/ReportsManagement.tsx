
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Download, FileText, Users, DollarSign, Calendar, Filter } from "lucide-react";

interface ReportFilters {
  academicYear: string;
  class: string;
  feeType: string;
  dateFrom: string;
  dateTo: string;
  status: string;
}

export function ReportsManagement() {
  const [loading, setLoading] = useState(false);
  const [academicYears, setAcademicYears] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filters, setFilters] = useState<ReportFilters>({
    academicYear: '',
    class: '',
    feeType: '',
    dateFrom: '',
    dateTo: '',
    status: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [yearsResponse, classesResponse] = await Promise.all([
        supabase.from("academic_years").select("*").order("start_date", { ascending: false }),
        supabase.from("classes").select("*").order("name")
      ]);

      if (yearsResponse.data) setAcademicYears(yearsResponse.data);
      if (classesResponse.data) setClasses(classesResponse.data);

      // Set current academic year as default
      const currentYear = yearsResponse.data?.find(year => year.is_current);
      if (currentYear) {
        setFilters(prev => ({ ...prev, academicYear: currentYear.id }));
      }
    } catch (error) {
      console.error("Error fetching initial data:", error);
    }
  };

  const generateStudentReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("students")
        .select(`
          *,
          classes(name, section),
          parents:student_parent_links(
            parents(first_name, last_name, phone_number, email, relation)
          )
        `);

      if (filters.class) {
        query = query.eq("class_id", filters.class);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query.order("first_name");

      if (error) throw error;

      // Convert to CSV
      const csvContent = convertStudentsToCSV(data || []);
      downloadCSV(csvContent, "students_report.csv");

      toast({
        title: "Student Report Generated",
        description: "Student report has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error generating report",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateFeeReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("student_fee_records")
        .select(`
          *,
          students(first_name, last_name, admission_number, class_id),
          classes:students(classes(name, section))
        `);

      if (filters.academicYear) {
        query = query.eq("academic_year_id", filters.academicYear);
      }

      if (filters.feeType) {
        query = query.eq("fee_type", filters.feeType);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query.order("created_at", { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const csvContent = convertFeesToCSV(data || []);
      downloadCSV(csvContent, "fee_report.csv");

      toast({
        title: "Fee Report Generated",
        description: "Fee report has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error generating report",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generatePaymentReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("fee_payment_records")
        .select(`
          *,
          students(first_name, last_name, admission_number),
          student_fee_records!fee_record_id(fee_type)
        `);

      if (filters.dateFrom) {
        query = query.gte("payment_date", filters.dateFrom);
      }

      if (filters.dateTo) {
        query = query.lte("payment_date", filters.dateTo);
      }

      const { data, error } = await query.order("payment_date", { ascending: false });

      if (error) throw error;

      // Convert to CSV
      const csvContent = convertPaymentsToCSV(data || []);
      downloadCSV(csvContent, "payment_report.csv");

      toast({
        title: "Payment Report Generated",
        description: "Payment report has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error generating report",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const convertStudentsToCSV = (students: any[]) => {
    const headers = [
      "Admission Number", "First Name", "Last Name", "Gender", "Date of Birth", 
      "Class", "Section", "Status", "Phone", "Email", "Address", "Parent Name", 
      "Parent Phone", "Parent Email", "Parent Relation"
    ];

    const rows = students.map(student => {
      const primaryParent = student.parents?.[0]?.parents;
      return [
        student.admission_number,
        student.first_name,
        student.last_name,
        student.gender,
        student.date_of_birth,
        student.classes?.name || '',
        student.classes?.section || '',
        student.status,
        student.emergency_contact_phone || '',
        '', // Student email not in schema
        `${student.address_line1 || ''} ${student.address_line2 || ''} ${student.city || ''} ${student.state || ''} ${student.pin_code || ''}`.trim(),
        primaryParent ? `${primaryParent.first_name} ${primaryParent.last_name}` : '',
        primaryParent?.phone_number || '',
        primaryParent?.email || '',
        primaryParent?.relation || ''
      ];
    });

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const convertFeesToCSV = (fees: any[]) => {
    const headers = [
      "Student Name", "Admission Number", "Class", "Fee Type", "Actual Fee", 
      "Discount Amount", "Final Fee", "Paid Amount", "Balance Fee", "Status", 
      "Due Date", "Created Date"
    ];

    const rows = fees.map(fee => [
      fee.students ? `${fee.students.first_name} ${fee.students.last_name}` : '',
      fee.students?.admission_number || '',
      fee.classes?.classes?.name || '',
      fee.fee_type,
      fee.actual_fee,
      fee.discount_amount,
      fee.final_fee || (fee.actual_fee - fee.discount_amount),
      fee.paid_amount,
      fee.balance_fee || (fee.actual_fee - fee.discount_amount - fee.paid_amount),
      fee.status,
      fee.due_date,
      new Date(fee.created_at).toLocaleDateString()
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const convertPaymentsToCSV = (payments: any[]) => {
    const headers = [
      "Student Name", "Admission Number", "Fee Type", "Amount Paid", 
      "Payment Date", "Payment Method", "Receipt Number", "Payment Receiver", 
      "Payment Time", "Notes"
    ];

    const rows = payments.map(payment => [
      payment.students ? `${payment.students.first_name} ${payment.students.last_name}` : '',
      payment.students?.admission_number || '',
      payment.student_fee_records?.fee_type || '',
      payment.amount_paid,
      payment.payment_date,
      payment.payment_method,
      payment.receipt_number,
      payment.payment_receiver,
      payment.payment_time,
      payment.notes || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  };

  const downloadCSV = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
        <p className="text-gray-600 mt-2">Generate and export comprehensive reports</p>
      </div>
      
      <Tabs defaultValue="filters" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="filters">Filters</TabsTrigger>
          <TabsTrigger value="students">Student Reports</TabsTrigger>
          <TabsTrigger value="fees">Fee Reports</TabsTrigger>
          <TabsTrigger value="payments">Payment Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="filters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Report Filters
              </CardTitle>
              <CardDescription>Configure filters to customize your reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="academic-year">Academic Year</Label>
                  <Select 
                    value={filters.academicYear} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, academicYear: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select academic year" />
                    </SelectTrigger>
                    <SelectContent>
                      {academicYears.map((year: any) => (
                        <SelectItem key={year.id} value={year.id}>
                          {year.year_name} {year.is_current && '(Current)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="class">Class</Label>
                  <Select 
                    value={filters.class} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, class: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Classes</SelectItem>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id}>
                          {cls.name} {cls.section && `- Section ${cls.section}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fee-type">Fee Type</Label>
                  <Select 
                    value={filters.feeType} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, feeType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select fee type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Fee Types</SelectItem>
                      <SelectItem value="Tuition Fee">Tuition Fee</SelectItem>
                      <SelectItem value="Transport Fee">Transport Fee</SelectItem>
                      <SelectItem value="Exam Fee">Exam Fee</SelectItem>
                      <SelectItem value="Library Fee">Library Fee</SelectItem>
                      <SelectItem value="Laboratory Fee">Laboratory Fee</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-from">Date From</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-to">Date To</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={filters.status} 
                    onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                      <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Student Reports
              </CardTitle>
              <CardDescription>Generate comprehensive student information reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Complete Student List</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Includes personal info, class details, and parent information
                  </p>
                  <Button onClick={generateStudentReport} disabled={loading} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Student Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Fee Reports
              </CardTitle>
              <CardDescription>Generate detailed fee structure and collection reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Fee Collection Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete fee records with payment status and balances
                  </p>
                  <Button onClick={generateFeeReport} disabled={loading} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Fee Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Payment Reports
              </CardTitle>
              <CardDescription>Generate detailed payment transaction reports</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-semibold mb-2">Payment History Report</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Complete payment transactions with details and receipts
                  </p>
                  <Button onClick={generatePaymentReport} disabled={loading} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Payment Report
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
