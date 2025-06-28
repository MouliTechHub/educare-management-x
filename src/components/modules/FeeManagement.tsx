
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { FeeFormDialog } from "./fee-management/FeeFormDialog";
import { PaymentDialog } from "./fee-management/PaymentDialog";
import { FeeTable } from "./fee-management/FeeTable";
import { StudentPaymentHistory } from "./student-management/StudentPaymentHistory";
import { FeeManagementFilters } from "./fee-management/FeeManagementFilters";
import { FeeStats } from "./fee-management/FeeStats";
import { DiscountDialog } from "./fee-management/DiscountDialog";
import { DiscountReportsDialog } from "./fee-management/DiscountReportsDialog";
import { AcademicYearSelector } from "./fee-management/AcademicYearSelector";
import { useFeeData } from "./fee-management/useFeeData";

interface Class {
  id: string;
  name: string;
  section: string | null;
}

interface FilterState {
  class_id: string;
  section: string;
  status: string;
  fee_type: string;
  due_date_from: string;
  due_date_to: string;
}

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

export function FeeManagement() {
  const { 
    fees, 
    academicYears, 
    currentAcademicYear, 
    selectedAcademicYear, 
    setSelectedAcademicYear, 
    loading, 
    refetchFees 
  } = useFeeData();
  
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
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [reportsDialogOpen, setReportsDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);
  const [selectedStudentFees, setSelectedStudentFees] = useState<Fee[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState("");

  React.useEffect(() => {
    fetchClasses();
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

  const openPaymentDialog = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const openDiscountDialog = (fee: Fee) => {
    setSelectedFee(fee);
    setDiscountDialogOpen(true);
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

  // Calculate stats with new fee structure
  const feeStats = {
    total: fees.reduce((sum, fee) => sum + fee.actual_amount, 0),
    collected: fees.reduce((sum, fee) => sum + fee.total_paid, 0),
    pending: fees.reduce((sum, fee) => {
      const finalFee = fee.actual_amount - fee.discount_amount;
      const balance = finalFee - fee.total_paid;
      return sum + Math.max(0, balance);
    }, 0),
    overdue: fees.filter(f => f.status === "Pending" && new Date(f.due_date) < new Date()).length
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
          <p className="text-gray-600 mt-2">Academic year-based fee tracking with balance management</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={() => setReportsDialogOpen(true)}>
            <FileText className="w-4 h-4 mr-2" />
            Discount Reports
          </Button>
          <FeeFormDialog onFeeCreated={refetchFees} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AcademicYearSelector
          academicYears={academicYears}
          selectedYear={selectedAcademicYear}
          onYearChange={setSelectedAcademicYear}
        />
      </div>

      <FeeStats stats={feeStats} />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Fee Records</CardTitle>
              <CardDescription>
                Academic year-based fee management with balance tracking
                {currentAcademicYear && selectedAcademicYear === currentAcademicYear.id && 
                  ` - ${currentAcademicYear.year_name} (Current Year)`
                }
              </CardDescription>
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

          <FeeTable
            fees={filteredFees}
            onPaymentClick={openPaymentDialog}
            onDiscountClick={openDiscountDialog}
            onHistoryClick={openHistoryDialog}
          />
        </CardContent>
      </Card>

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        fee={selectedFee}
        onPaymentRecorded={refetchFees}
      />

      <DiscountDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        fee={selectedFee}
        onDiscountApplied={refetchFees}
      />

      <DiscountReportsDialog
        open={reportsDialogOpen}
        onOpenChange={setReportsDialogOpen}
      />

      <StudentPaymentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        studentName={selectedStudentName}
        fees={selectedStudentFees}
      />
    </div>
  );
}
