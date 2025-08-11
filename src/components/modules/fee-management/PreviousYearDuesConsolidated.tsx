import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, IndianRupee, Clock, Eye, CreditCard, Percent } from "lucide-react";
import { Fee } from "./types/feeTypes";

interface PreviousYearDuesConsolidatedProps {
  studentFees: Fee[];
  onViewDetails: (student: Fee['student']) => void;
  onMakePayment: (fee: Fee) => void;
  onApplyDiscount: (fee: Fee) => void;
  className?: string;
}

export function PreviousYearDuesConsolidated({
  studentFees,
  onViewDetails,
  onMakePayment,
  onApplyDiscount,
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
    
    const itemBalance = typeof (fee as any).balance_fee === 'number'
      ? (fee as any).balance_fee
      : Math.max(
          ((fee as any).actual_fee ?? (fee as any).actual_amount ?? 0)
          - ((fee as any).discount_amount ?? 0)
          - ((fee as any).paid_amount ?? (fee as any).total_paid ?? 0),
        0);

    groups[studentId].fees.push(fee);
    groups[studentId].totalBalance += itemBalance;
    
    if (fee.fee_type === 'Previous Year Dues') {
      const bal = itemBalance;
      if (bal > 0) {
        groups[studentId].hasPreviousYearDues = true;
      }
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

  // Debug logs for visibility
  React.useEffect(() => {
    console.log('[PYD-Consolidated] received fees:', studentFees?.length || 0);
    const prevDueCount = studentFees?.filter(f => f.fee_type === 'Previous Year Dues').length || 0;
    console.log('[PYD-Consolidated] prev-year-due records:', prevDueCount);
    console.log('[PYD-Consolidated] studentsWithDues:', studentsWithDues.length);
  }, [studentFees, studentsWithDues.length]);

  // Pagination and compact list setup
  const [page, setPage] = React.useState(1);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(studentsWithDues.length / pageSize));
  const start = (page - 1) * pageSize;
  const paginatedStudents = studentsWithDues.slice(start, start + pageSize);
  
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

      {/* Compact scrollable list for better scalability */}
      <div className="rounded-lg border border-red-200 bg-red-50">
        <div className="max-h-[480px] overflow-auto divide-y divide-red-200">
          {paginatedStudents.map((group) => {
            const previousYearDue = group.fees.find(f => f.fee_type === 'Previous Year Dues');
            const otherFees = group.fees.filter(f => f.fee_type !== 'Previous Year Dues' && (f as any).balance_fee > 0);
            const student = group.student!;
            const pydBalance = previousYearDue ? (previousYearDue as any).balance_fee : 0;
            const blockedSum = otherFees.reduce((sum, f: any) => sum + (f.balance_fee ?? 0), 0);

            return (
              <div key={student.id} className="flex items-center justify-between p-3">
                {/* Student Info */}
                <div className="min-w-0 flex-1 pr-4">
                  <div className="flex items-center gap-3">
                    <div className="truncate">
                      <div className="font-semibold text-red-800 truncate">
                        {student.first_name} {student.last_name}
                      </div>
                      <div className="text-xs text-red-600 truncate">
                        {student.admission_number} • {student.class_name}
                      </div>
                    </div>
                    <Badge variant="destructive" className="shrink-0">
                      ₹{group.totalBalance.toLocaleString()}
                    </Badge>
                  </div>
                </div>

                {/* Dues summary */}
                <div className="hidden md:flex items-center gap-4 pr-4">
                  <div className="text-xs text-red-700">
                    <span className="font-medium">Previous Year Dues:</span>{' '}
                    <span className="font-bold">₹{pydBalance.toLocaleString()}</span>
                  </div>
                  {otherFees.length > 0 && (
                    <div className="text-xs text-yellow-700">
                      <span className="font-medium">Blocked:</span>{' '}
                      {otherFees.length} • ₹{blockedSum.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetails(student)}
                    className="border-red-200 text-red-700 hover:bg-red-100 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  {previousYearDue && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onApplyDiscount(previousYearDue)}
                        className="border-red-200 text-red-700 hover:bg-red-100 text-xs"
                        title="Apply discount to Previous Year Dues"
                      >
                        <Percent className="h-3 w-3 mr-1" />
                        Discount
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onMakePayment(previousYearDue)}
                        className="bg-red-600 hover:bg-red-700 text-xs"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        Pay Dues
                      </Button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      {studentsWithDues.length > pageSize && (
        <div className="flex items-center justify-between mt-2 text-xs text-red-700">
          <div>
            Showing {start + 1}–{Math.min(start + pageSize, studentsWithDues.length)} of {studentsWithDues.length}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Prev</Button>
            <span>Page {page} / {totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}