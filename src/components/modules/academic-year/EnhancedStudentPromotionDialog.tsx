import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { AcademicYear } from "@/types/database";
import { AlertTriangle, CheckCircle, Users, ArrowUp, IndianRupee, Clock, FileText } from "lucide-react";
import { useOutstandingFees, OutstandingFee, FeeAction } from "./hooks/useOutstandingFees";

interface EnhancedStudentPromotionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetAcademicYear: AcademicYear;
  currentAcademicYear: AcademicYear;
  allAcademicYears: AcademicYear[];
}

interface PromotionSummary {
  totalStudents: number;
  missingFeeStructures: string[];
  readyForPromotion: boolean;
  isSequentialYear: boolean;
}

export function EnhancedStudentPromotionDialog({ 
  open, 
  onOpenChange, 
  targetAcademicYear, 
  currentAcademicYear,
  allAcademicYears
}: EnhancedStudentPromotionDialogProps) {
  const [promotionSummary, setPromotionSummary] = useState<PromotionSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [currentStep, setCurrentStep] = useState<'validation' | 'outstanding' | 'confirmation'>('validation');
  const { toast } = useToast();

  const {
    outstandingFees,
    loading: feesLoading,
    feeActions,
    setFeeAction,
    processOutstandingFees
  } = useOutstandingFees(currentAcademicYear.id);

  useEffect(() => {
    if (open) {
      checkPromotionReadiness();
      setCurrentStep('validation');
    }
  }, [open, targetAcademicYear.id]);

  const checkSequentialYear = () => {
    // Sort academic years by start date
    const sortedYears = [...allAcademicYears].sort((a, b) => 
      new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
    );
    
    const currentIndex = sortedYears.findIndex(year => year.id === currentAcademicYear.id);
    const targetIndex = sortedYears.findIndex(year => year.id === targetAcademicYear.id);
    
    // Target should be exactly the next year in sequence
    return targetIndex === currentIndex + 1;
  };

  const checkPromotionReadiness = async () => {
    setLoading(true);
    try {
      const isSequentialYear = checkSequentialYear();
      
      // Get total active students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, class_id, classes(name, section)')
        .eq('status', 'Active');

      if (studentsError) throw studentsError;

      // Get all classes that have active students
      const classIds = [...new Set(studentsData?.map(s => s.class_id) || [])];

      // Check fee structures for target academic year
      const { data: feeStructuresData, error: feeError } = await supabase
        .from('fee_structures')
        .select('class_id, classes(name, section)')
        .eq('academic_year_id', targetAcademicYear.id)
        .eq('is_active', true)
        .in('class_id', classIds);

      if (feeError) throw feeError;

      const feeStructureClassIds = feeStructuresData?.map(fs => fs.class_id) || [];
      const missingFeeStructureClasses = classIds.filter(classId => 
        !feeStructureClassIds.includes(classId)
      );

      // Get class names for missing fee structures
      const { data: missingClassesData, error: missingClassesError } = await supabase
        .from('classes')
        .select('name, section')
        .in('id', missingFeeStructureClasses);

      if (missingClassesError) throw missingClassesError;

      const missingFeeStructures = missingClassesData?.map(cls => 
        `${cls.name}${cls.section ? ` (${cls.section})` : ''}`
      ) || [];

      setPromotionSummary({
        totalStudents: studentsData?.length || 0,
        missingFeeStructures,
        readyForPromotion: missingFeeStructures.length === 0 && isSequentialYear,
        isSequentialYear
      });
    } catch (error: any) {
      console.error('Error checking promotion readiness:', error);
      toast({
        title: "Error",
        description: "Failed to check promotion readiness",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFeeActionChange = (studentId: string, action: FeeAction['action'], additionalData?: any) => {
    setFeeAction(studentId, {
      studentId,
      action,
      ...additionalData
    });
  };

  const proceedToOutstandingFees = () => {
    setCurrentStep('outstanding');
  };

  const proceedToConfirmation = () => {
    // Check if all students with outstanding fees have actions assigned
    const studentsNeedingAction = outstandingFees.filter(fee => !feeActions.has(fee.studentId));
    
    if (studentsNeedingAction.length > 0) {
      toast({
        title: "Action Required",
        description: `Please assign actions for all ${studentsNeedingAction.length} students with outstanding fees.`,
        variant: "destructive",
      });
      return;
    }

    setCurrentStep('confirmation');
  };

  const executePromotion = async () => {
    setPromoting(true);
    try {
      // Step 1: Process outstanding fees
      const feeResults = await processOutstandingFees(targetAcademicYear.id);
      
      // Step 2: Get students to promote (exclude blocked ones)
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, class_id, classes(name)')
        .eq('status', 'Active');

      if (studentsError) throw studentsError;

      // Filter out blocked students
      const blockedStudents = feeActions instanceof Map 
        ? Array.from(feeActions.entries())
            .filter(([_, action]) => action.action === 'block')
            .map(([studentId]) => studentId)
        : [];

      const studentsToPromote = studentsData?.filter(student => 
        !blockedStudents.includes(student.id)
      ) || [];

      // Step 3: Prepare promotion data
      const promotionData = studentsToPromote.map(student => ({
        student_id: student.id,
        from_academic_year_id: currentAcademicYear.id,
        from_class_id: student.class_id,
        to_class_id: student.class_id, // This would need proper class mapping logic
        promotion_type: 'promoted',
        reason: 'Automatic bulk promotion with outstanding fee handling',
        notes: `Promoted from ${currentAcademicYear.year_name} to ${targetAcademicYear.year_name}`
      }));

      // Step 4: Execute promotion
      const { data: result, error: promotionError } = await supabase
        .rpc('promote_students_with_fees', {
          promotion_data: promotionData,
          target_academic_year_id: targetAcademicYear.id,
          promoted_by_user: 'Admin'
        });

      if (promotionError) throw promotionError;

      // Step 5: Log promotion audit
      await supabase.from('student_promotions').insert({
        student_id: '00000000-0000-0000-0000-000000000000', // System record
        from_academic_year_id: currentAcademicYear.id,
        to_academic_year_id: targetAcademicYear.id,
        from_class_id: '00000000-0000-0000-0000-000000000000',
        to_class_id: null,
        promotion_type: 'bulk_promotion_audit',
        reason: 'Bulk promotion audit log',
        notes: `Bulk promotion executed. Fee processing: ${feeResults.payments} payments, ${feeResults.waivers} waivers, ${feeResults.carriedForward} carried forward, ${feeResults.blocked} blocked`,
        promoted_by: 'Admin'
      });

      toast({
        title: "Promotion Complete",
        description: `Successfully promoted ${studentsToPromote.length} students. Fee processing: ${feeResults.payments} payments, ${feeResults.waivers} waivers, ${feeResults.carriedForward} carried forward, ${feeResults.blocked} blocked.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('Error executing promotion:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to execute promotion",
        variant: "destructive",
      });
    } finally {
      setPromoting(false);
    }
  };

  if (loading || !promotionSummary) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowUp className="w-5 h-5" />
            Student Promotion to {targetAcademicYear.year_name}
          </DialogTitle>
          <DialogDescription>
            Enhanced promotion workflow with outstanding fee handling
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Step 1: Validation */}
          {currentStep === 'validation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Promotion Validation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sequential Year Check */}
                {!promotionSummary.isSequentialYear && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Invalid Promotion Sequence</div>
                      <div className="mt-1">
                        Students can only be promoted to the immediate next academic year in sequence. 
                        Please ensure you're promoting to the correct year.
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Fee Structure Check */}
                {promotionSummary.missingFeeStructures.length > 0 && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="font-medium">Missing Fee Structures</div>
                      <div className="mt-1">
                        Please define fee structures for {targetAcademicYear.year_name} for the following classes:
                      </div>
                      <ul className="mt-2 list-disc list-inside">
                        {promotionSummary.missingFeeStructures.map((className, index) => (
                          <li key={index}>{className}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {promotionSummary.totalStudents}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Students</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      <Badge variant={promotionSummary.isSequentialYear ? "default" : "destructive"}>
                        {promotionSummary.isSequentialYear ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mr-1" />
                        )}
                        {promotionSummary.isSequentialYear ? "Sequential" : "Out of Order"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Year Sequence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      <Badge variant={promotionSummary.readyForPromotion ? "default" : "destructive"}>
                        {promotionSummary.readyForPromotion ? (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 mr-1" />
                        )}
                        {promotionSummary.readyForPromotion ? "Ready" : "Not Ready"}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">Promotion Status</div>
                  </div>
                </div>

                {promotionSummary.readyForPromotion && (
                  <div className="flex justify-end">
                    <Button onClick={proceedToOutstandingFees}>
                      Check Outstanding Fees
                      <ArrowUp className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 2: Outstanding Fees */}
          {currentStep === 'outstanding' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <IndianRupee className="w-5 h-5" />
                  Outstanding Fee Management
                </CardTitle>
                <CardDescription>
                  {outstandingFees.length > 0 
                    ? `${outstandingFees.length} students have outstanding fees that need to be resolved`
                    : "No outstanding fees found. All students are clear for promotion."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                {feesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : outstandingFees.length > 0 ? (
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Total Outstanding</TableHead>
                          <TableHead>Fee Details</TableHead>
                          <TableHead>Action Required</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {outstandingFees.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.studentName}</div>
                                <div className="text-sm text-muted-foreground">{student.admissionNumber}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="destructive">
                                ₹{student.totalOutstanding.toFixed(2)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {student.feeDetails.slice(0, 2).map((fee, index) => (
                                  <div key={index} className="text-sm">
                                    {fee.academicYearName}: ₹{fee.balanceAmount.toFixed(2)}
                                  </div>
                                ))}
                                {student.feeDetails.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{student.feeDetails.length - 2} more
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Select
                                value={feeActions.get(student.studentId)?.action || undefined}
                                onValueChange={(value) => handleFeeActionChange(student.studentId, value as FeeAction['action'])}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select action" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="block">Block Promotion</SelectItem>
                                  <SelectItem value="payment">Record Payment</SelectItem>
                                  <SelectItem value="waiver">Grant Waiver</SelectItem>
                                  <SelectItem value="carry_forward">Carry Forward</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 mx-auto text-green-500 mb-4" />
                    <h3 className="text-lg font-medium">All Clear!</h3>
                    <p className="text-muted-foreground">No outstanding fees found. Students are ready for promotion.</p>
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('validation')}>
                    Back to Validation
                  </Button>
                  <Button onClick={proceedToConfirmation}>
                    Proceed to Confirmation
                    <ArrowUp className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Confirmation */}
          {currentStep === 'confirmation' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Promotion Confirmation
                </CardTitle>
                <CardDescription>
                  Review and confirm the promotion details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium mb-2">Promotion Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div>From: {currentAcademicYear.year_name}</div>
                      <div>To: {targetAcademicYear.year_name}</div>
                      <div>Total Students: {promotionSummary.totalStudents}</div>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Fee Actions Summary</h4>
                    <div className="space-y-2 text-sm">
                      <div>Students with Outstanding Fees: {outstandingFees.length}</div>
                      <div>Blocked: {Array.from(feeActions.values()).filter(a => a.action === 'block').length}</div>
                      <div>Payments: {Array.from(feeActions.values()).filter(a => a.action === 'payment').length}</div>
                      <div>Waivers: {Array.from(feeActions.values()).filter(a => a.action === 'waiver').length}</div>
                      <div>Carried Forward: {Array.from(feeActions.values()).filter(a => a.action === 'carry_forward').length}</div>
                    </div>
                  </div>
                </div>

                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    This action will promote all eligible students and process outstanding fees according to your selections. 
                    This action cannot be undone. Please review carefully before proceeding.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setCurrentStep('outstanding')}>
                    Back to Outstanding Fees
                  </Button>
                  <Button onClick={executePromotion} disabled={promoting}>
                    {promoting ? (
                      <>
                        <Clock className="w-4 h-4 mr-2 animate-spin" />
                        Promoting Students...
                      </>
                    ) : (
                      'Execute Promotion'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}