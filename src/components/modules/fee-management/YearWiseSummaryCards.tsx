
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Percent, Users } from "lucide-react";

interface YearWiseSummary {
  academicYear: string;
  totalCollected: number;
  totalPending: number;
  totalDiscount: number;
  totalStudents: number;
  collectionRate: number;
  overdueCount: number;
}

interface YearWiseSummaryCardsProps {
  summary: YearWiseSummary;
}

export function YearWiseSummaryCards({ summary }: YearWiseSummaryCardsProps) {
  const totalExpected = (summary.totalCollected || 0) + (summary.totalPending || 0) + (summary.totalDiscount || 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expected</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{(totalExpected || 0).toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Academic Year {summary.academicYear}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collected</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            ₹{(summary.totalCollected || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {(summary.collectionRate || 0).toFixed(1)}% collection rate
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">
            ₹{(summary.totalPending || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {summary.overdueCount || 0} overdue records
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Discount</CardTitle>
          <Percent className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            ₹{(summary.totalDiscount || 0).toLocaleString()}
          </div>
          <p className="text-xs text-muted-foreground">
            {totalExpected > 0 ? (((summary.totalDiscount || 0) / totalExpected) * 100).toFixed(1) : 0}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Students</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">
            {summary.totalStudents || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            Active students
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Efficiency</CardTitle>
          <TrendingUp className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">
            {(summary.collectionRate || 0).toFixed(0)}%
          </div>
          <p className="text-xs text-muted-foreground">
            Collection efficiency
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
