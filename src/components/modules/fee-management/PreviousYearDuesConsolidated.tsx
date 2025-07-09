import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, IndianRupee, Clock, Eye, CreditCard } from "lucide-react";
import { Fee } from "./types/feeTypes";

interface PreviousYearDuesConsolidatedProps {
  studentFees: Fee[];
  onViewDetails: (student: Fee['student']) => void;
  onMakePayment: (fee: Fee) => void;
  className?: string;
}

export function PreviousYearDuesConsolidated({
  studentFees,
  onViewDetails,
  onMakePayment,
  className = ""
}: PreviousYearDuesConsolidatedProps) {
  // Group fees by student
  const studentGroups = studentFees.reduce((groups, fee) => {
    if (!fee.student) return groups;
    
    const studentId = fee.student.id;
    if (!groups[studentId]) {
      groups[studentId] = {
        student: fee.student,
        fees: [],
        totalBalance: 0,
        hasPreviousYearDues: false
      };
    }
    
    groups[studentId].fees.push(fee);
    groups[studentId].totalBalance += fee.balance_fee;
    
    if (fee.fee_type === 'Previous Year Dues') {
      groups[studentId].hasPreviousYearDues = true;
    }
    
    return groups;
  }, {} as Record<string, {
    student: Fee['student'];
    fees: Fee[];
    totalBalance: number;
    hasPreviousYearDues: boolean;
  }>);

  // Filter only students with previous year dues
  const studentsWithDues = Object.values(studentGroups).filter(group => group.hasPreviousYearDues && group.totalBalance > 0);

  if (studentsWithDues.length === 0) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-green-700">
            <IndianRupee className="h-5 w-5" />
            <span className="font-semibold">All Previous Year Dues Cleared! 🎉</span>
          </div>
          <p className="text-green-600 mt-2">No outstanding previous year dues found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-red-800 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Students with Previous Year Dues ({studentsWithDues.length})
        </h3>
        <Badge variant="destructive">
          Total: ₹{studentsWithDues.reduce((sum, group) => sum + group.totalBalance, 0).toLocaleString()}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {studentsWithDues.map((group) => {
          const previousYearDue = group.fees.find(f => f.fee_type === 'Previous Year Dues');
          const otherFees = group.fees.filter(f => f.fee_type !== 'Previous Year Dues' && f.balance_fee > 0);
          const student = group.student!;

          return (
            <Card key={student.id} className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div>
                    <div className="font-semibold text-red-800">{student.first_name} {student.last_name}</div>
                    <div className="text-xs text-red-600">{student.admission_number} • {student.class_name}</div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    ₹{group.totalBalance.toLocaleString()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Previous Year Dues */}
                {previousYearDue && (
                  <div className="p-3 bg-red-100 rounded border border-red-200">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-red-600" />
                        <span className="font-medium text-red-800 text-sm">Previous Year Dues</span>
                      </div>
                      <span className="font-bold text-red-800">₹{previousYearDue.balance_fee.toLocaleString()}</span>
                    </div>
                    <div className="text-xs text-red-600">
                      Due: {new Date(previousYearDue.due_date).toLocaleDateString()}
                    </div>
                  </div>
                )}

                {/* Current Year Blocked Fees */}
                {otherFees.length > 0 && (
                  <div className="p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-xs text-yellow-800 font-medium mb-1">🚫 Blocked Current Year Fees:</div>
                    <div className="space-y-1">
                      {otherFees.slice(0, 2).map((fee) => (
                        <div key={fee.id} className="flex justify-between text-xs">
                          <span className="text-yellow-700">{fee.fee_type}</span>
                          <span className="font-medium text-yellow-800">₹{fee.balance_fee.toLocaleString()}</span>
                        </div>
                      ))}
                      {otherFees.length > 2 && (
                        <div className="text-xs text-yellow-600">+{otherFees.length - 2} more blocked fees</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(student)}
                    className="flex-1 border-red-200 text-red-700 hover:bg-red-100 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  {previousYearDue && (
                    <Button
                      size="sm"
                      onClick={() => onMakePayment(previousYearDue)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-xs"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Pay Dues
                    </Button>
                  )}
                </div>

                {/* Warning Message */}
                <div className="bg-yellow-50 border border-yellow-200 p-2 rounded">
                  <div className="text-xs text-yellow-800">
                    <AlertTriangle className="h-3 w-3 inline mr-1" />
                    Clear previous year dues to unblock current year payments
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}