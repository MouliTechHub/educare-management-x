import React from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Users, 
  Receipt, 
  TrendingUp, 
  AlertTriangle,
  History,
  FileText,
  Settings,
  Plus,
  CreditCard,
  Eye
} from "lucide-react";

// Enhanced Components
import { FeeSummarySection } from "./FeeSummarySection";
import { SuperEnhancedFilters } from "./SuperEnhancedFilters";
import { PaymentHistoryDialog } from "./PaymentHistoryDialog";
import { PaymentDialog } from "./PaymentDialog";
import { EnhancedFeeTable } from "./EnhancedFeeTable";
import { EnhancedFeeStats } from "./EnhancedFeeStats";
import { BulkActionsPanel } from "./BulkActionsPanel";
import { ExportButtons } from "./ExportButtons";

// Enhanced Hooks
import { useEnhancedFeeData } from "./hooks/useEnhancedFeeData";
import { usePaymentAllocation } from "./hooks/usePaymentAllocation";
import { useAuditLog } from "./hooks/useAuditLog";
import { useCarryForward } from "./hooks/useCarryForward";
import { useFeeManagement } from "./useFeeManagement";

import { STANDARDIZED_FEE_TYPES } from "@/constants/feeTypes";
import { useToast } from "@/hooks/use-toast";
import { EnhancedFilterState, StudentFeeRecord } from "./types/feeTypes";

export default function EnhancedFeeManagement() {
  const { toast } = useToast();
  
  // Enhanced data management
  const {
    feeRecords,
    loading,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    getStudentFeeHistory,
    getStudentPaymentHistory,
    refetchFees
  } = useEnhancedFeeData();

  // Payment and allocation management
  const {
    simulatePaymentAllocation,
    processPaymentWithAllocation,
    getAllocationsForStudent
  } = usePaymentAllocation();

  // Audit log management
  const { auditLog, logAction } = useAuditLog();

  // Carry forward management
  const { carryForwardFees, bulkCarryForward, waiveCarryForward } = useCarryForward();

  // Basic fee management hooks
  const {
    classes,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    applyFilters
  } = useFeeManagement();

  // State management
  const [selectedStudent, setSelectedStudent] = React.useState<any>(null);
  const [showFeeSummary, setShowFeeSummary] = React.useState(false);
  const [paymentHistoryOpen, setPaymentHistoryOpen] = React.useState(false);
  const [paymentHistory, setPaymentHistory] = React.useState([]);
  const [selectedFees, setSelectedFees] = React.useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = React.useState("overview");
  const [paymentDialogOpen, setPaymentDialogOpen] = React.useState(false);
  const [selectedFeeRecord, setSelectedFeeRecord] = React.useState<any>(null);

  // Enhanced filters with more options
  const enhancedFilters: EnhancedFilterState = React.useMemo(() => ({
    search: searchTerm,
    class_id: filters.classId || '',
    section: filters.section || '',
    status: filters.status || '',
    fee_type: filters.feeType || '',
    due_date_from: filters.dueDateFrom || '',
    due_date_to: filters.dueDateTo || '',
    has_discount: filters.hasDiscount || '',
    payment_status: filters.paymentStatus || '',
    academic_year: currentAcademicYear?.id || '',
    amount_range: '',
    is_carry_forward: '',
    payment_blocked: ''
  }), [searchTerm, filters, currentAcademicYear]);

  // Apply enhanced filters
  const filteredFeeRecords = React.useMemo(() => {
    if (loading || !feeRecords) return [];
    
    return feeRecords.filter(record => {
      // Apply basic search
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const studentMatch = record.student?.first_name?.toLowerCase().includes(searchLower) ||
                            record.student?.last_name?.toLowerCase().includes(searchLower) ||
                            record.student?.admission_number?.toLowerCase().includes(searchLower);
        if (!studentMatch) return false;
      }

      // Apply enhanced filters
      if (enhancedFilters.is_carry_forward) {
        const isCarryForward = record.is_carry_forward;
        if (enhancedFilters.is_carry_forward === 'yes' && !isCarryForward) return false;
        if (enhancedFilters.is_carry_forward === 'no' && isCarryForward) return false;
      }

      if (enhancedFilters.payment_blocked) {
        const isBlocked = record.payment_blocked;
        if (enhancedFilters.payment_blocked === 'yes' && !isBlocked) return false;
        if (enhancedFilters.payment_blocked === 'no' && isBlocked) return false;
      }

      return true;
    });
  }, [feeRecords, searchTerm, enhancedFilters, loading]);

  // Handle student fee summary
  const handleViewStudentSummary = async (student: any) => {
    setSelectedStudent(student);
    setShowFeeSummary(true);
  };

  // Handle payment history
  const handleViewPaymentHistory = async (studentId: string) => {
    try {
      const history = await getStudentPaymentHistory(studentId);
      const allocations = await getAllocationsForStudent(studentId);
      
      // Merge payment history with allocation details
      const enrichedHistory = history.map(payment => ({
        ...payment,
        payment_allocations: allocations.filter(alloc => 
          alloc.fee_payment_records && Array.isArray(alloc.fee_payment_records) && 
          alloc.fee_payment_records.some((fpr: any) => fpr.id === payment.id)
        )
      }));

      setPaymentHistory(enrichedHistory);
      setPaymentHistoryOpen(true);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      toast({
        title: "Error",
        description: "Failed to fetch payment history",
        variant: "destructive",
      });
    }
  };

  // Handle enhanced payment processing
  const handleProcessPayment = async (studentId: string, amount: number, paymentData: any) => {
    try {
      // Show simulation first
      const simulation = await simulatePaymentAllocation(studentId, amount);
      
      if (simulation) {
        console.log('Payment simulation:', simulation);
        
        // Process the actual payment
        const result = await processPaymentWithAllocation(studentId, amount, paymentData);
        
        if (result.success) {
          toast({
            title: "Payment Processed",
            description: `Payment allocated across ${simulation.allocations.length} fee records`,
          });
          
          // Log the action
          await logAction(
            studentId,
            result.payment_record.id,
            'payment',
            currentAcademicYear?.id || '',
            paymentData.payment_receiver,
            null,
            { amount, allocation_details: simulation },
            amount,
            `FIFO payment allocation: ${simulation.allocations.length} records`,
            result.receipt_number
          );
          
          refetchFees();
        }
      }
    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Error",
        description: "Failed to process payment",
        variant: "destructive",
      });
    }
  };

  // Calculate summary statistics
  const summaryStats = React.useMemo(() => {
    const total = filteredFeeRecords.reduce((sum, fee) => sum + fee.actual_fee, 0);
    const paid = filteredFeeRecords.reduce((sum, fee) => sum + fee.paid_amount, 0);
    const outstanding = filteredFeeRecords.reduce((sum, fee) => sum + fee.balance_fee, 0);
    const overdue = filteredFeeRecords.filter(fee => 
      fee.status === 'Overdue' || 
      (fee.balance_fee > 0 && new Date(fee.due_date) < new Date())
    ).length;
    const carryForward = filteredFeeRecords.filter(fee => fee.is_carry_forward).length;
    const blocked = filteredFeeRecords.filter(fee => fee.payment_blocked).length;

    return { total, paid, outstanding, overdue, carryForward, blocked };
  }, [filteredFeeRecords]);

  const activeFiltersCount = Object.values(enhancedFilters).filter(v => v !== '').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-5 gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!currentAcademicYear) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-4">No Academic Year Found</h2>
          <p className="text-gray-600">Please create an academic year first to manage fees.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Fee Management</h1>
          <p className="text-muted-foreground">
            Comprehensive fee management with FIFO allocation and advanced tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline">{currentAcademicYear.year_name}</Badge>
          <Button variant="outline" onClick={refetchFees}>
            <History className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-xl font-bold">₹{summaryStats.total.toLocaleString()}</p>
              </div>
              <Receipt className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Collected</p>
                <p className="text-xl font-bold text-green-600">₹{summaryStats.paid.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-xl font-bold text-red-600">₹{summaryStats.outstanding.toLocaleString()}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-xl font-bold text-orange-600">{summaryStats.overdue}</p>
              </div>
              <AlertTriangle className="h-6 w-6 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Carry Forward</p>
                <p className="text-xl font-bold text-purple-600">{summaryStats.carryForward}</p>
              </div>
              <History className="h-6 w-6 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Blocked</p>
                <p className="text-xl font-bold text-red-600">{summaryStats.blocked}</p>
              </div>
              <Settings className="h-6 w-6 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="students">Student View</TabsTrigger>
          <TabsTrigger value="bulk">Bulk Actions</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Enhanced Filters */}
          <SuperEnhancedFilters
            filters={enhancedFilters}
            onFiltersChange={(newFilters) => {
              setSearchTerm(newFilters.search);
              setFilters({
                classId: newFilters.class_id,
                section: newFilters.section,
                status: newFilters.status,
                feeType: newFilters.fee_type,
                dueDateFrom: newFilters.due_date_from,
                dueDateTo: newFilters.due_date_to,
                hasDiscount: newFilters.has_discount,
                paymentStatus: newFilters.payment_status,
                searchParent: ''
              });
            }}
            classes={classes}
            academicYears={academicYears}
            feeTypes={[...STANDARDIZED_FEE_TYPES]}
            onReset={() => {
              setSearchTerm('');
              setFilters({
                classId: '',
                section: '',
                status: '',
                feeType: '',
                dueDateFrom: '',
                dueDateTo: '',
                hasDiscount: '',
                paymentStatus: '',
                searchParent: ''
              });
            }}
            activeFiltersCount={activeFiltersCount}
          />

          {/* Fee Records Display */}
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">Fee Records</h3>
              {filteredFeeRecords.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">No fee records found</p>
              ) : (
                <div className="space-y-4">
                  {filteredFeeRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {record.student?.first_name} {record.student?.last_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {record.fee_type} - ₹{record.actual_fee.toLocaleString()}
                          </p>
                          <p className="text-sm">Balance: ₹{(record.balance_fee || 0).toLocaleString()}</p>
                          {record.discount_amount > 0 && (
                            <p className="text-sm text-green-600">
                              Discount: ₹{record.discount_amount.toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={record.status === 'Paid' ? 'default' : 'secondary'}>
                            {record.status}
                          </Badge>
                          <div className="flex gap-1">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPaymentHistory(record.student_id)}
                              title="View Payment History"
                            >
                              <Eye className="h-3 w-3" />
                            </Button>
                            {record.balance_fee > 0 && !record.payment_blocked && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedFeeRecord(record);
                                  setPaymentDialogOpen(true);
                                }}
                                title="Record Payment"
                              >
                                <CreditCard className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="students" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Student Fee Summary</h3>
            <p className="text-muted-foreground">Select a student from the overview tab to view their detailed fee summary.</p>
          </div>
        </TabsContent>

        <TabsContent value="bulk" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Bulk Actions</h3>
            <p className="text-muted-foreground">Bulk operations will be available here.</p>
          </div>
        </TabsContent>

        <TabsContent value="reports" className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">Reports</h3>
            <p className="text-muted-foreground">Fee reports and analytics will be available here.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment History Dialog */}
      <PaymentHistoryDialog
        open={paymentHistoryOpen}
        onOpenChange={setPaymentHistoryOpen}
        studentName={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : ''}
        payments={paymentHistory}
      />

      {/* Payment Dialog */}
      <PaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        fee={selectedFeeRecord}
        onPaymentRecorded={() => {
          refetchFees();
          setPaymentDialogOpen(false);
          setSelectedFeeRecord(null);
        }}
        academicYearName={currentAcademicYear?.year_name}
      />
    </div>
  );
}