
import React, { useState } from "react";
import { FeeManagementHeader } from "@/components/modules/fee-management/FeeManagementHeader";
import { FeeStats } from "@/components/modules/fee-management/FeeStats";
import { FeeManagementContent } from "@/components/modules/fee-management/FeeManagementContent";
import { PaymentDialog } from "@/components/modules/fee-management/PaymentDialog";
import { FeeStructureDialog } from "@/components/modules/fee-management/FeeStructureDialog";
import { StudentPaymentHistory } from "@/components/modules/student-management/StudentPaymentHistory";
import { useFeeData } from "@/components/modules/fee-management/useFeeData";
import { useFeeManagement } from "@/components/modules/fee-management/useFeeManagement";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Database, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

export default function FeeManagement() {
  const { toast } = useToast();
  const {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    loading,
    refetchFees
  } = useFeeData();

  const {
    classes,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedStudentFees,
    selectedStudentName,
    openHistoryDialog,
    applyFilters
  } = useFeeManagement();

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [discountDialogOpen, setDiscountDialogOpen] = useState(false);
  const [selectedFee, setSelectedFee] = useState<Fee | null>(null);

  const currentYear = academicYears.find(year => year.id === currentAcademicYear);
  const filteredFees = applyFilters(fees);

  const handlePaymentClick = (fee: Fee) => {
    setSelectedFee(fee);
    setPaymentDialogOpen(true);
  };

  const handleDiscountClick = (fee: Fee) => {
    setSelectedFee(fee);
    setDiscountDialogOpen(true);
  };

  const handleHistoryClick = (student: Fee['student']) => {
    openHistoryDialog(student, fees);
  };

  const handlePaymentRecorded = () => {
    setPaymentDialogOpen(false);
    setSelectedFee(null);
    refetchFees();
  };

  const createSampleFeeData = async () => {
    if (!currentAcademicYear) {
      toast({
        title: "No Academic Year",
        description: "Please select an academic year first",
        variant: "destructive",
      });
      return;
    }

    try {
      // Get some students to create fees for
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number, class_id')
        .limit(5);

      if (studentsError) throw studentsError;

      if (!students || students.length === 0) {
        toast({
          title: "No Students Found",
          description: "Please add some students first before creating fee records",
          variant: "destructive",
        });
        return;
      }

      // Create sample fee records
      const sampleFees = students.map(student => ({
        student_id: student.id,
        academic_year_id: currentAcademicYear,
        fee_type: 'Tuition',
        actual_amount: 50000,
        amount: 50000,
        discount_amount: 0,
        total_paid: 0,
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
        status: 'Pending'
      }));

      const { error: insertError } = await supabase
        .from('fees')
        .insert(sampleFees);

      if (insertError) throw insertError;

      toast({
        title: "Sample Data Created",
        description: `Created ${sampleFees.length} sample fee records`,
      });

      refetchFees();
    } catch (error: any) {
      console.error('Error creating sample data:', error);
      toast({
        title: "Error Creating Sample Data",
        description: error.message,
        variant: "destructive",
      });
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

  // Show empty state with helpful actions when no fees exist
  if (fees.length === 0) {
    return (
      <div className="space-y-6">
        <FeeManagementHeader
          academicYears={academicYears}
          currentAcademicYear={currentAcademicYear}
          onYearChange={setCurrentAcademicYear}
          onRefresh={refetchFees}
        />

        <Card className="border-2 border-dashed border-gray-300">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Database className="w-8 h-8 text-gray-400" />
            </div>
            <CardTitle className="text-xl">No Fee Records Found</CardTitle>
            <CardDescription className="max-w-md mx-auto">
              There are no fee records for the selected academic year. You can create sample fee records to get started or add fee records manually.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left max-w-md mx-auto">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Getting Started:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>Make sure you have students added to the system</li>
                    <li>Create fee structures for different classes</li>
                    <li>Assign fees to students</li>
                    <li>Or use the sample data button to get started quickly</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={createSampleFeeData} className="flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Create Sample Fee Data
              </Button>
              <Button variant="outline" className="flex items-center">
                <Plus className="w-4 h-4 mr-2" />
                Add Fee Record Manually
              </Button>
            </div>

            <div className="text-sm text-gray-500 max-w-lg mx-auto">
              <p className="mb-2"><strong>Current Status:</strong></p>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div>Academic Years: {academicYears.length}</div>
                <div>Classes: {classes.length}</div>
                <div>Selected Year: {currentYear?.year_name || 'None'}</div>
                <div>Fee Records: {fees.length}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FeeManagementHeader
        academicYears={academicYears}
        currentAcademicYear={currentAcademicYear}
        onYearChange={setCurrentAcademicYear}
        onRefresh={refetchFees}
      />

      <FeeStats fees={filteredFees} />

      <FeeManagementContent
        currentYear={currentYear}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        filters={filters}
        onFiltersChange={setFilters}
        classes={classes}
        filteredFees={filteredFees}
        onPaymentClick={handlePaymentClick}
        onDiscountClick={handleDiscountClick}
        onHistoryClick={handleHistoryClick}
      />

      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        fee={selectedFee}
        onPaymentRecorded={handlePaymentRecorded}
        academicYearName={currentYear?.year_name}
      />

      <FeeStructureDialog
        open={discountDialogOpen}
        onOpenChange={setDiscountDialogOpen}
        fee={selectedFee}
        onDiscountApplied={refetchFees}
        academicYearName={currentYear?.year_name}
      />

      <StudentPaymentHistory
        open={historyDialogOpen}
        onOpenChange={setHistoryDialogOpen}
        studentName={selectedStudentName}
        fees={selectedStudentFees}
        academicYears={academicYears}
        selectedAcademicYear={currentAcademicYear}
      />
    </div>
  );
}
