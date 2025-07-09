import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  IndianRupee, 
  Users, 
  TrendingDown,
  Calendar,
  FileText,
  Send,
  RefreshCw
} from "lucide-react";
import { PreviousYearDues } from "./hooks/usePreviousYearDues";

interface PreviousYearDuesSummaryProps {
  allDues: PreviousYearDues[];
  loading: boolean;
  onRefresh: () => void;
  onSendBulkReminders: () => void;
  onViewAllDetails: () => void;
}

export function PreviousYearDuesSummary({
  allDues,
  loading,
  onRefresh,
  onSendBulkReminders,
  onViewAllDetails
}: PreviousYearDuesSummaryProps) {
  const studentsWithDues = allDues.filter(dues => dues.totalDues > 0);
  const totalOutstanding = studentsWithDues.reduce((sum, dues) => sum + dues.totalDues, 0);
  
  // Calculate by academic year
  const duesByYear = new Map<string, { count: number; amount: number }>();
  studentsWithDues.forEach(studentDues => {
    studentDues.duesDetails.forEach(due => {
      const yearData = duesByYear.get(due.academicYear) || { count: 0, amount: 0 };
      yearData.count += 1;
      yearData.amount += due.balanceAmount;
      duesByYear.set(due.academicYear, yearData);
    });
  });

  // Calculate by fee type
  const duesByType = new Map<string, { count: number; amount: number }>();
  studentsWithDues.forEach(studentDues => {
    studentDues.duesDetails.forEach(due => {
      const typeData = duesByType.get(due.feeType) || { count: 0, amount: 0 };
      typeData.count += 1;
      typeData.amount += due.balanceAmount;
      duesByType.set(due.feeType, typeData);
    });
  });

  const averageDuePerStudent = studentsWithDues.length > 0 
    ? totalOutstanding / studentsWithDues.length 
    : 0;

  // Priority levels based on amount
  const highPriorityStudents = studentsWithDues.filter(d => d.totalDues >= 25000).length;
  const mediumPriorityStudents = studentsWithDues.filter(d => d.totalDues >= 10000 && d.totalDues < 25000).length;
  const lowPriorityStudents = studentsWithDues.filter(d => d.totalDues < 10000).length;

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Summary Card */}
      <Card className={studentsWithDues.length > 0 ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {studentsWithDues.length > 0 ? (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              ) : (
                <IndianRupee className="h-5 w-5 text-green-600" />
              )}
              <span className={studentsWithDues.length > 0 ? "text-red-800" : "text-green-800"}>
                Previous Year Dues Summary
              </span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
              {studentsWithDues.length > 0 && (
                <>
                  <Button variant="outline" size="sm" onClick={onViewAllDetails}>
                    <FileText className="h-3 w-3 mr-1" />
                    View All
                  </Button>
                  <Button variant="outline" size="sm" onClick={onSendBulkReminders}>
                    <Send className="h-3 w-3 mr-1" />
                    Send Reminders
                  </Button>
                </>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {studentsWithDues.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-green-600 text-lg font-semibold">
                🎉 No Previous Year Dues Outstanding!
              </div>
              <p className="text-green-700 mt-2">All students have cleared their previous year dues.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">{studentsWithDues.length}</div>
                  <div className="text-sm text-red-600">Students with Dues</div>
                </div>
                <div className="text-center p-4 bg-red-100 rounded-lg">
                  <div className="text-2xl font-bold text-red-700">₹{totalOutstanding.toLocaleString()}</div>
                  <div className="text-sm text-red-600">Total Outstanding</div>
                </div>
                <div className="text-center p-4 bg-orange-100 rounded-lg">
                  <div className="text-2xl font-bold text-orange-700">₹{Math.round(averageDuePerStudent).toLocaleString()}</div>
                  <div className="text-sm text-orange-600">Average per Student</div>
                </div>
                <div className="text-center p-4 bg-yellow-100 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-700">{duesByYear.size}</div>
                  <div className="text-sm text-yellow-600">Academic Years</div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-red-800 flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Priority Breakdown
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex items-center justify-between p-3 bg-red-200 rounded">
                    <div>
                      <div className="font-semibold text-red-900">High Priority</div>
                      <div className="text-sm text-red-700">≥₹25,000</div>
                    </div>
                    <Badge variant="destructive">{highPriorityStudents}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-200 rounded">
                    <div>
                      <div className="font-semibold text-orange-900">Medium Priority</div>
                      <div className="text-sm text-orange-700">₹10k - ₹25k</div>
                    </div>
                    <Badge className="bg-orange-600">{mediumPriorityStudents}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-yellow-200 rounded">
                    <div>
                      <div className="font-semibold text-yellow-900">Low Priority</div>
                      <div className="text-sm text-yellow-700">&lt;₹10,000</div>
                    </div>
                    <Badge className="bg-yellow-600">{lowPriorityStudents}</Badge>
                  </div>
                </div>
              </div>

              {/* Academic Year Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-red-800 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Academic Year Breakdown
                </h4>
                <div className="space-y-2">
                  {Array.from(duesByYear.entries())
                    .sort(([a], [b]) => b.localeCompare(a))
                    .map(([year, data]) => (
                      <div key={year} className="flex items-center justify-between p-3 bg-red-100 rounded">
                        <div>
                          <span className="font-medium text-red-800">{year}</span>
                          <span className="text-sm text-red-600 ml-2">({data.count} students)</span>
                        </div>
                        <Badge variant="secondary" className="bg-red-200 text-red-800">
                          ₹{data.amount.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>

              {/* Fee Type Breakdown */}
              <div className="space-y-3">
                <h4 className="font-medium text-red-800 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Fee Type Breakdown
                </h4>
                <div className="space-y-2">
                  {Array.from(duesByType.entries())
                    .sort(([, a], [, b]) => b.amount - a.amount)
                    .map(([type, data]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-red-100 rounded">
                        <div>
                          <span className="font-medium text-red-800">{type}</span>
                          <span className="text-sm text-red-600 ml-2">({data.count} instances)</span>
                        </div>
                        <Badge variant="secondary" className="bg-red-200 text-red-800">
                          ₹{data.amount.toLocaleString()}
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}