import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  AlertTriangle, 
  Calculator, 
  RefreshCw,
  Bug,
  Search
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CalculationIssue {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  issueType: 'incorrect_balance' | 'missing_record' | 'duplicate_record' | 'calculation_error';
  description: string;
  expected: number;
  actual: number;
  academicYear: string;
  feeType: string;
}

interface DuesCalculationVerifierProps {
  currentAcademicYearId: string;
  onIssuesFound: (issues: CalculationIssue[]) => void;
}

export function DuesCalculationVerifier({
  currentAcademicYearId,
  onIssuesFound
}: DuesCalculationVerifierProps) {
  const [verifying, setVerifying] = useState(false);
  const [issues, setIssues] = useState<CalculationIssue[]>([]);
  const [lastVerified, setLastVerified] = useState<Date | null>(null);
  const { toast } = useToast();

  const verifyCalculations = async () => {
    if (!currentAcademicYearId) return;
    
    setVerifying(true);
    const foundIssues: CalculationIssue[] = [];

    try {
      // Fetch all previous year dues records
      const { data: duesData, error: duesError } = await supabase
        .from('student_fee_records')
        .select(`
          id,
          student_id,
          actual_fee,
          discount_amount,
          paid_amount,
          balance_fee,
          final_fee,
          fee_type,
          academic_year_id,
          students!fk_sfr_student(
            first_name,
            last_name,
            admission_number
          ),
          academic_years!fk_sfr_year(year_name)
        `)
        .neq('academic_year_id', currentAcademicYearId)
        .gt('balance_fee', 0);

      if (duesError) throw duesError;

      // Verify calculations for each record
      for (const record of duesData || []) {
        const studentName = `${record.students.first_name} ${record.students.last_name}`;
        
        // Calculate expected values
        const expectedFinalFee = record.actual_fee - record.discount_amount;
        const expectedBalanceFee = expectedFinalFee - record.paid_amount;

        // Check final_fee calculation
        if (Math.abs(record.final_fee - expectedFinalFee) > 0.01) {
          foundIssues.push({
            studentId: record.student_id,
            studentName,
            admissionNumber: record.students.admission_number,
            issueType: 'calculation_error',
            description: 'Final fee calculation is incorrect',
            expected: expectedFinalFee,
            actual: record.final_fee,
            academicYear: record.academic_years.year_name,
            feeType: record.fee_type
          });
        }

        // Check balance_fee calculation
        if (Math.abs(record.balance_fee - expectedBalanceFee) > 0.01) {
          foundIssues.push({
            studentId: record.student_id,
            studentName,
            admissionNumber: record.students.admission_number,
            issueType: 'incorrect_balance',
            description: 'Balance fee calculation is incorrect',
            expected: expectedBalanceFee,
            actual: record.balance_fee,
            academicYear: record.academic_years.year_name,
            feeType: record.fee_type
          });
        }

        // Check for negative balances (should not happen)
        if (record.balance_fee < 0) {
          foundIssues.push({
            studentId: record.student_id,
            studentName,
            admissionNumber: record.students.admission_number,
            issueType: 'calculation_error',
            description: 'Negative balance fee detected',
            expected: 0,
            actual: record.balance_fee,
            academicYear: record.academic_years.year_name,
            feeType: record.fee_type
          });
        }
      }

      // Check for duplicate records
      const duplicateCheck = await supabase
        .from('student_fee_records')
        .select('student_id, academic_year_id, fee_type, count(*)')
        .neq('academic_year_id', currentAcademicYearId)
        .gt('balance_fee', 0);

      // This would need to be implemented with proper SQL grouping
      // For now, we'll check in JavaScript
      const recordGroups = new Map<string, any[]>();
      (duesData || []).forEach(record => {
        const key = `${record.student_id}_${record.academic_year_id}_${record.fee_type}`;
        if (!recordGroups.has(key)) {
          recordGroups.set(key, []);
        }
        recordGroups.get(key)!.push(record);
      });

      recordGroups.forEach((records, key) => {
        if (records.length > 1) {
          const record = records[0];
          foundIssues.push({
            studentId: record.student_id,
            studentName: `${record.students.first_name} ${record.students.last_name}`,
            admissionNumber: record.students.admission_number,
            issueType: 'duplicate_record',
            description: `${records.length} duplicate records found`,
            expected: 1,
            actual: records.length,
            academicYear: record.academic_years.year_name,
            feeType: record.fee_type
          });
        }
      });

      setIssues(foundIssues);
      setLastVerified(new Date());
      onIssuesFound(foundIssues);

      if (foundIssues.length === 0) {
        toast({
          title: "Verification Complete",
          description: "All previous year dues calculations are correct!",
        });
      } else {
        toast({
          title: "Issues Found",
          description: `Found ${foundIssues.length} calculation issues that need attention.`,
          variant: "destructive",
        });
      }

    } catch (error: any) {
      console.error('Error verifying calculations:', error);
      toast({
        title: "Verification Failed",
        description: "Failed to verify calculations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  const getIssueIcon = (type: CalculationIssue['issueType']) => {
    switch (type) {
      case 'incorrect_balance': return <Calculator className="h-4 w-4" />;
      case 'calculation_error': return <Bug className="h-4 w-4" />;
      case 'duplicate_record': return <AlertTriangle className="h-4 w-4" />;
      case 'missing_record': return <Search className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const getIssueColor = (type: CalculationIssue['issueType']) => {
    switch (type) {
      case 'incorrect_balance': return 'destructive';
      case 'calculation_error': return 'destructive';
      case 'duplicate_record': return 'secondary';
      case 'missing_record': return 'secondary';
      default: return 'secondary';
    }
  };

  useEffect(() => {
    if (currentAcademicYearId) {
      verifyCalculations();
    }
  }, [currentAcademicYearId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {issues.length === 0 ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-red-600" />
            )}
            <span>Calculation Verification</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={verifyCalculations}
            disabled={verifying}
          >
            <RefreshCw className={`h-3 w-3 mr-1 ${verifying ? 'animate-spin' : ''}`} />
            {verifying ? 'Verifying...' : 'Verify Now'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {lastVerified && (
          <div className="text-sm text-muted-foreground">
            Last verified: {lastVerified.toLocaleString()}
          </div>
        )}

        {issues.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              All previous year dues calculations are accurate. No issues detected.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Found {issues.length} calculation issues that require attention.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              {issues.map((issue, index) => (
                <div key={index} className="p-3 border rounded-lg bg-red-50 border-red-200">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getIssueIcon(issue.issueType)}
                      <span className="font-medium">{issue.studentName}</span>
                      <span className="text-sm text-muted-foreground">
                        ({issue.admissionNumber})
                      </span>
                    </div>
                    <Badge variant={getIssueColor(issue.issueType) as any}>
                      {issue.issueType.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-700">
                    <p className="mb-1">{issue.description}</p>
                    <div className="flex gap-4 text-xs">
                      <span>Expected: ₹{issue.expected.toFixed(2)}</span>
                      <span>Actual: ₹{issue.actual.toFixed(2)}</span>
                      <span>{issue.academicYear} - {issue.feeType}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}