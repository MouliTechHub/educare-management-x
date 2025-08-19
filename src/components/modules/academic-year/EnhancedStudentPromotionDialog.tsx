
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
import { AlertTriangle, CheckCircle, Users, ArrowUp, IndianRupee, Clock, FileText, RefreshCw } from "lucide-react";
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
    processOutstandingFees,
    refetch: refetchOutstandingFees
  } = useOutstandingFees(currentAcademicYear.id);

  useEffect(() => {
    if (open) {
      checkPromotionReadiness();
      setCurrentStep('validation');
    }
  }, [open, targetAcademicYear.id]);

  // Auto-refresh outstanding fees when step changes to 'outstanding'
  useEffect(() => {
    if (currentStep === 'outstanding' && open) {
      refetchOutstandingFees();
    }
  }, [currentStep, open]);

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

      // ✅ CRITICAL FIX: Get ALL classes from Class Management, not just classes with students
      const { data: allClassesData, error: allClassesError } = await supabase
        .from('classes')
        .select('id, name, section')
        .order('name');

      if (allClassesError) throw allClassesError;

      const allClassIds = allClassesData?.map(cls => cls.id) || [];

      // Check fee structures for target academic year - MUST cover ALL classes
      const { data: feeStructuresData, error: feeError } = await supabase
        .from('fee_structures')
        .select('class_id, classes(name, section)')
        .eq('academic_year_id', targetAcademicYear.id)
        .eq('is_active', true);

      if (feeError) throw feeError;

      const feeStructureClassIds = feeStructuresData?.map(fs => fs.class_id) || [];
      
      // Find classes that are missing fee structures for target year
      const missingFeeStructureClassIds = allClassIds.filter(classId => 
        !feeStructureClassIds.includes(classId)
      );

      // Get class names for missing fee structures
      const missingFeeStructures: string[] = [];
      if (missingFeeStructureClassIds.length > 0) {
        const missingClasses = allClassesData?.filter(cls => 
          missingFeeStructureClassIds.includes(cls.id)
        ) || [];
        
        missingFeeStructures.push(...missingClasses.map(cls => 
          `${cls.name}${cls.section ? ` (${cls.section})` : ''}`
        ));
      }

      // Log validation results for debugging
      console.log('🔍 Promotion Validation Results:', {
        targetYear: targetAcademicYear.year_name,
        totalStudents: studentsData?.length || 0,
        totalClasses: allClassIds.length,
        classesWithFeeStructures: feeStructureClassIds.length,
        missingFeeStructures: missingFeeStructures,
        isSequentialYear,
        readyForPromotion: missingFeeStructures.length === 0 && isSequentialYear
      });

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
    
    // ✅ 1) INSTRUMENT THE PROMOTE FLOW - Log inputs
    console.info("[PROMOTE] source=", currentAcademicYear.year_name, "target=", targetAcademicYear.year_name);
    console.info("[PROMOTE] source_id=", currentAcademicYear.id, "target_id=", targetAcademicYear.id);
    
    try {
      // Step 1: Process outstanding fees
      const feeResults = await processOutstandingFees(targetAcademicYear.id);
      
      // ✅ 2) Call the new RPC that accepts year names and handles everything
      const { data: result, error: promotionError } = await (supabase as any).rpc('promote_students_with_fees_by_name', {
        source_year_name: currentAcademicYear.year_name,
        target_year_name: targetAcademicYear.year_name,
        promoted_by_user: 'Admin'
      });

      if (promotionError) {
        console.error("[PROMOTE][ERR]", promotionError);
        // Surface missing fee plans nicely when server returns 409
        const errAny: any = promotionError as any;
        const missing = errAny?.context?.missing as { year: string; class: string }[] | undefined;
        if (errAny?.status === 409 && missing?.length) {
          throw new Error(`Missing fee plans for ${missing.map(m => `${m.class} (${m.year})`).join(', ')}`);
        }
        throw promotionError;
      }

      console.info("[PROMOTE][OK]", result);

      // Cast result to expected type for type safety
      const promotionResult = result as any as {
        promoted_students?: number;
        fee_rows_created?: number;
        target_year_id?: string;
        source_year_id?: string;
        message?: string;
      };

      // ✅ 3) FORCE-REFRESH ALL CACHES - Invalidate caches for Fee Management
      const refreshEvent = new CustomEvent('promotion-completed', {
        detail: {
          targetYearId: targetAcademicYear.id,
          targetYearName: targetAcademicYear.year_name,
          promotedCount: promotionResult?.promoted_students || 0,
          feeRowsCreated: promotionResult?.fee_rows_created || 0,
          timestamp: Date.now()
        }
      });
      window.dispatchEvent(refreshEvent);

      // ✅ 4) RE-QUERY AND LOG COUNTS - Verify fee records using diagnostic RPC
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for DB consistency
      
      const { data: feeRecordsCount, error: feeCheckError } = await (supabase as any).rpc('debug_fee_counts', {
        p_year: targetAcademicYear.id
      });

      if (!feeCheckError) {
        console.info("[PROMOTE] post-refresh counts", { 
          feeRecords: feeRecordsCount || 0,
          targetYear: targetAcademicYear.year_name,
          targetYearId: targetAcademicYear.id,
          expectedStudents: promotionResult?.promoted_students || 0,
          actualFeeRows: promotionResult?.fee_rows_created || 0
        });
        
        // Validation check
        if ((promotionResult?.promoted_students || 0) > 0 && (promotionResult?.fee_rows_created || 0) === 0) {
          console.warn("[PROMOTE] WARNING: Students promoted but no fee rows created - check fee structures");
          toast({
            title: "Warning",
            description: `Promoted ${promotionResult?.promoted_students} students but no fee records were created. Please check fee structures for ${targetAcademicYear.year_name}.`,
            variant: "destructive",
          });
        }
      } else {
        console.error("[PROMOTE] Failed to verify fee records:", feeCheckError);
      }

      // Step 5: Log promotion audit
      await supabase.from('student_promotions').insert({
        student_id: '00000000-0000-0000-0000-000000000000', // System record
        from_academic_year_id: currentAcademicYear.id,
        to_academic_year_id: targetAcademicYear.id,
        from_class_id: '00000000-0000-0000-0000-000000000000',
        to_class_id: null,
        promotion_type: 'bulk_promotion_audit',
        reason: 'Bulk promotion audit log',
        notes: `Bulk promotion executed via promote_students_with_fees_by_name. Promoted: ${promotionResult?.promoted_students || 0}, Fee rows created: ${promotionResult?.fee_rows_created || 0}`,
        promoted_by: 'Admin'
      });

      // ✅ 7) Enhanced success toast
      toast({
        title: "Promotion Complete",
        description: `Promoted ${promotionResult?.promoted_students || 0} students; created ${promotionResult?.fee_rows_created || 0} fee rows for ${targetAcademicYear.year_name}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error('[PROMOTE][ERR] Promotion failed:', error);
      
      // ✅ 8) Enhanced error toast with full error logging
      console.error('[PROMOTE][ERR] Full error payload:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        stack: error.stack
      });
      
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
          <DialogHeader>
            <DialogTitle>Checking promotion readiness…</DialogTitle>
            <DialogDescription>Preparing data required to validate promotion.</DialogDescription>
          </DialogHeader>
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
                      <div className="font-medium">Please define fee structure for all classes in the next academic year before promotion.</div>
                      <div className="mt-1">
                        The following classes are missing fee structures for {targetAcademicYear.year_name}:
                      </div>
                      <ul className="mt-2 list-disc list-inside">
                        {promotionSummary.missingFeeStructures.map((className, index) => (
                          <li key={index}>{className}</li>
                        ))}
                      </ul>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Please go to Fee Structure Management and create fee structures for all missing classes before proceeding with promotion.
                      </div>
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
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refetchOutstandingFees}
                    disabled={feesLoading}
                  >
                    <RefreshCw className={`w-4 h-4 ${feesLoading ? 'animate-spin' : ''}`} />
                  </Button>
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
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="font-medium">Outstanding Fees Detected</div>
                        <div className="mt-1">
                          {outstandingFees.length} students have outstanding fee balances that need to be resolved before promotion.
                        </div>
                      </AlertDescription>
                    </Alert>

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
                                    <span className="font-medium">{fee.feeType}</span> ({fee.academicYearName}): 
                                    <span className="text-red-600 ml-1">₹{fee.balanceAmount.toFixed(2)}</span>
                                  </div>
                                ))}
                                {student.feeDetails.length > 2 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{student.feeDetails.length - 2} more fees
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
