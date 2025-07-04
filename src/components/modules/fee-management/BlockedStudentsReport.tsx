import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertTriangle, Users, DollarSign, FileText } from "lucide-react";
import { usePreviousYearDues } from "./hooks/usePreviousYearDues";
import { Fee } from "./types/feeTypes";

interface BlockedStudentsReportProps {
  fees: Fee[];
  currentAcademicYear: string;
}

export function BlockedStudentsReport({ fees, currentAcademicYear }: BlockedStudentsReportProps) {
  const { previousYearDues, getStudentDues, hasOutstandingDues } = usePreviousYearDues(currentAcademicYear);
  const [open, setOpen] = useState(false);

  // Get unique students who have current year fees and previous year dues
  const blockedStudents = fees
    .filter(fee => hasOutstandingDues(fee.student_id))
    .reduce((acc, fee) => {
      if (!acc.find(s => s.studentId === fee.student_id)) {
        const dues = getStudentDues(fee.student_id);
        if (dues) {
          acc.push({
            studentId: fee.student_id,
            studentName: `${fee.student?.first_name} ${fee.student?.last_name}`,
            admissionNumber: fee.student?.admission_number || '',
            className: fee.student?.class_name || '',
            section: fee.student?.section || '',
            totalDues: dues.totalDues,
            duesDetails: dues.duesDetails,
            currentYearFees: fees.filter(f => f.student_id === fee.student_id)
          });
        }
      }
      return acc;
    }, [] as any[]);

  const totalBlockedAmount = blockedStudents.reduce((sum, student) => sum + student.totalDues, 0);

  if (blockedStudents.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-orange-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-800">
          <AlertTriangle className="w-5 h-5" />
          Payment Blocked Students
        </CardTitle>
        <CardDescription>
          Students with outstanding previous year dues who cannot pay current year fees
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-orange-600" />
            <div>
              <p className="text-sm text-gray-600">Blocked Students</p>
              <p className="text-lg font-semibold text-orange-800">{blockedStudents.length}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-red-600" />
            <div>
              <p className="text-sm text-gray-600">Total Outstanding</p>
              <p className="text-lg font-semibold text-red-800">₹{totalBlockedAmount.toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <div>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-auto">
                  <DialogHeader>
                    <DialogTitle>Blocked Students Report</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded">
                      <div>
                        <p className="text-sm text-gray-600">Total Blocked Students</p>
                        <p className="text-xl font-bold text-orange-800">{blockedStudents.length}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Outstanding Amount</p>
                        <p className="text-xl font-bold text-red-800">₹{totalBlockedAmount.toLocaleString()}</p>
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Class</TableHead>
                          <TableHead>Outstanding Dues</TableHead>
                          <TableHead>Due Details</TableHead>
                          <TableHead>Current Year Fees</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {blockedStudents.map((student) => (
                          <TableRow key={student.studentId}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{student.studentName}</div>
                                <div className="text-sm text-gray-500">{student.admissionNumber}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {student.className}
                              {student.section && ` - ${student.section}`}
                            </TableCell>
                            <TableCell>
                              <span className="font-semibold text-red-600">
                                ₹{student.totalDues.toLocaleString()}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {student.duesDetails.map((due: any, index: number) => (
                                  <div key={index} className="text-xs">
                                    <Badge variant="outline" className="text-xs">
                                      {due.academicYear}
                                    </Badge>
                                    <span className="ml-1">{due.feeType}: ₹{due.balanceAmount.toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="space-y-1">
                                {student.currentYearFees.map((fee: Fee, index: number) => (
                                  <div key={index} className="text-xs">
                                    <Badge variant="secondary" className="text-xs">
                                      {fee.fee_type}
                                    </Badge>
                                    <span className="ml-1">
                                      ₹{(fee.actual_amount - fee.discount_amount - fee.total_paid).toLocaleString()}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="text-sm text-orange-700 bg-orange-100 p-3 rounded">
          <strong>Note:</strong> These students cannot pay current year fees until their previous year dues are cleared.
          Previous year dues are calculated automatically from unpaid balances in prior academic years.
        </div>
      </CardContent>
    </Card>
  );
}