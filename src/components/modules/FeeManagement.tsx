
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentPaymentHistory } from "./student-management/StudentPaymentHistory";
import { AcademicYearSelector } from "./fee-management/AcademicYearSelector";
import { YearWiseSummaryCards } from "./fee-management/YearWiseSummaryCards";
import { useFeeData } from "./fee-management/useFeeData";
import { useYearWiseSummary } from "./fee-management/useYearWiseSummary";
import { useExportData } from "./fee-management/useExportData";
import { FeeManagementContent } from "./fee-management/FeeManagementContent";

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
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedStudentFees, setSelectedStudentFees] = useState<Fee[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState("");

  // Get year-wise summary
  const yearWiseSummary = useYearWiseSummary(fees, academicYears, selectedAcademicYear);
  const { exportToExcel, exportToPDF } = useExportData();

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

  const handleExport = (format: 'excel' | 'pdf') => {
    const currentYear = academicYears.find(year => year.id === selectedAcademicYear);
    const yearName = currentYear?.year_name || 'Unknown';
    
    if (format === 'excel') {
      exportToExcel(filteredFees, yearName);
    } else {
      exportToPDF(filteredFees, yearName);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const currentYear = academicYears.find(year => year.id === selectedAcademicYear);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Fee Management</h1>
          <p className="text-gray-600 mt-2">View detailed payment history and fee records by academic year</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <AcademicYearSelector
          academicYears={academicYears}
          selectedYear={selectedAcademicYear}
          onYearChange={setSelectedAcademicYear}
        />
      </div>

      <YearWiseSummaryCards summary={yearWiseSummary} />

      <FeeManagementContent
        currentYear={currentYear}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        classes={classes}
        filteredFees={filteredFees}
        onPaymentClick={() => {}} // Empty function since we're removing payment functionality
        onDiscountClick={() => {}} // Empty function since we're removing discount functionality
        onHistoryClick={openHistoryDialog}
      />

      <StudentPaymentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        studentName={selectedStudentName}
        fees={selectedStudentFees}
        academicYears={academicYears}
        selectedAcademicYear={selectedAcademicYear}
      />
    </div>
  );
}
