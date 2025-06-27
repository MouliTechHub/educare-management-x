
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { StudentBasic } from "@/types/database";

interface DiscountReport {
  student_id: string;
  student_name: string;
  admission_number: string;
  total_discount: number;
  discount_count: number;
  class_name?: string;
}

interface YearlyDiscountReport {
  year: number;
  total_discount: number;
  total_fees: number;
  discount_percentage: number;
  discount_count: number;
}

interface DiscountReportsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DiscountReportsDialog({ open, onOpenChange }: DiscountReportsDialogProps) {
  const [reportType, setReportType] = useState<"student" | "yearly">("student");
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedStudent, setSelectedStudent] = useState("all");
  const [students, setStudents] = useState<StudentBasic[]>([]);
  const [studentReport, setStudentReport] = useState<DiscountReport[]>([]);
  const [yearlyReport, setYearlyReport] = useState<YearlyDiscountReport[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchStudents();
    }
  }, [open]);

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

  const generateStudentReport = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("fees")
        .select(`
          student_id,
          discount_amount,
          students!inner(
            first_name,
            last_name,
            admission_number,
            classes(name)
          )
        `)
        .gt("discount_amount", 0);

      if (selectedStudent !== "all") {
        query = query.eq("student_id", selectedStudent);
      }

      if (selectedYear) {
        const startDate = `${selectedYear}-01-01`;
        const endDate = `${selectedYear}-12-31`;
        query = query.gte("created_at", startDate).lte("created_at", endDate);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Group by student
      const studentMap = new Map<string, DiscountReport>();
      
      data?.forEach((fee: any) => {
        const studentId = fee.student_id;
        const existing = studentMap.get(studentId);
        
        if (existing) {
          existing.total_discount += fee.discount_amount;
          existing.discount_count += 1;
        } else {
          studentMap.set(studentId, {
            student_id: studentId,
            student_name: `${fee.students.first_name} ${fee.students.last_name}`,
            admission_number: fee.students.admission_number,
            total_discount: fee.discount_amount,
            discount_count: 1,
            class_name: fee.students.classes?.name,
          });
        }
      });

      setStudentReport(Array.from(studentMap.values()).sort((a, b) => b.total_discount - a.total_discount));
    } catch (error: any) {
      console.error("Error generating student report:", error);
      toast({
        title: "Error",
        description: "Failed to generate student discount report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const generateYearlyReport = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("fees")
        .select("discount_amount, actual_amount, created_at")
        .gt("discount_amount", 0);

      if (error) throw error;

      // Group by year
      const yearMap = new Map<number, YearlyDiscountReport>();
      
      data?.forEach((fee: any) => {
        const year = new Date(fee.created_at).getFullYear();
        const existing = yearMap.get(year);
        
        if (existing) {
          existing.total_discount += fee.discount_amount;
          existing.total_fees += fee.actual_amount;
          existing.discount_count += 1;
        } else {
          yearMap.set(year, {
            year,
            total_discount: fee.discount_amount,
            total_fees: fee.actual_amount,
            discount_percentage: 0,
            discount_count: 1,
          });
        }
      });

      // Calculate discount percentages
      const reports = Array.from(yearMap.values()).map(report => ({
        ...report,
        discount_percentage: (report.total_discount / report.total_fees) * 100,
      }));

      setYearlyReport(reports.sort((a, b) => b.year - a.year));
    } catch (error: any) {
      console.error("Error generating yearly report:", error);
      toast({
        title: "Error",
        description: "Failed to generate yearly discount report.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = () => {
    if (reportType === "student") {
      generateStudentReport();
    } else {
      generateYearlyReport();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Discount Reports</DialogTitle>
          <DialogDescription>
            Generate detailed reports on fee discounts by student or year
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="report_type">Report Type</Label>
              <Select value={reportType} onValueChange={(value: "student" | "yearly") => setReportType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">By Student</SelectItem>
                  <SelectItem value="yearly">By Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {reportType === "student" && (
              <>
                <div>
                  <Label htmlFor="student">Student (Optional)</Label>
                  <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                    <SelectTrigger>
                      <SelectValue placeholder="All students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.first_name} {student.last_name} ({student.admission_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    min="2020"
                    max="2030"
                    value={selectedYear}
                    onChange={(e) => setSelectedYear(e.target.value)}
                  />
                </div>
              </>
            )}

            <div className="flex items-end">
              <Button onClick={handleGenerateReport} disabled={loading}>
                {loading ? "Generating..." : "Generate Report"}
              </Button>
            </div>
          </div>

          {reportType === "student" && studentReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Student Discount Report</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Admission No.</TableHead>
                      <TableHead>Class</TableHead>
                      <TableHead>Total Discount</TableHead>
                      <TableHead>Discount Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentReport.map((report) => (
                      <TableRow key={report.student_id}>
                        <TableCell>{report.student_name}</TableCell>
                        <TableCell>{report.admission_number}</TableCell>
                        <TableCell>{report.class_name || "N/A"}</TableCell>
                        <TableCell className="font-medium">₹{report.total_discount.toLocaleString()}</TableCell>
                        <TableCell>{report.discount_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {reportType === "yearly" && yearlyReport.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Yearly Discount Report</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Year</TableHead>
                      <TableHead>Total Discount</TableHead>
                      <TableHead>Total Fees</TableHead>
                      <TableHead>Discount %</TableHead>
                      <TableHead>Discount Count</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {yearlyReport.map((report) => (
                      <TableRow key={report.year}>
                        <TableCell className="font-medium">{report.year}</TableCell>
                        <TableCell className="font-medium text-red-600">₹{report.total_discount.toLocaleString()}</TableCell>
                        <TableCell>₹{report.total_fees.toLocaleString()}</TableCell>
                        <TableCell>{report.discount_percentage.toFixed(2)}%</TableCell>
                        <TableCell>{report.discount_count}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
