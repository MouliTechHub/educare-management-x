import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, IndianRupee, Clock, Users, TrendingDown, Eye } from "lucide-react";
import { PreviousYearDues } from "./hooks/usePreviousYearDues";

interface ImprovedPreviousYearDuesCardProps {
  studentId: string;
  studentName: string;
  admissionNumber: string;
  dues: PreviousYearDues | null;
  onViewDetails: () => void;
  onClearDues: () => void;
  className?: string;
}

export function ImprovedPreviousYearDuesCard({
  studentId,
  studentName,
  admissionNumber,
  dues,
  onViewDetails,
  onClearDues,
  className = ""
}: ImprovedPreviousYearDuesCardProps) {
  if (!dues || dues.totalDues <= 0) {
    return (
      <Card className={`border-green-200 bg-green-50 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-green-100 p-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-green-800">{studentName}</p>
                <p className="text-sm text-green-600">{admissionNumber}</p>
              </div>
            </div>
            <Badge variant="default" className="bg-green-100 text-green-800">
              No Previous Dues
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  const oldestDue = dues.duesDetails.reduce((oldest, current) => {
    return new Date(oldest.academicYear) < new Date(current.academicYear) ? oldest : current;
  }, dues.duesDetails[0]);

  const yearsOverdue = new Date().getFullYear() - parseInt(oldestDue.academicYear.split('-')[0]);

  return (
    <Card className={`border-red-200 bg-red-50 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">Previous Year Dues</span>
          </div>
          <Badge variant="destructive">
            ₹{dues.totalDues.toLocaleString()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Student Info */}
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-red-800">{studentName}</p>
            <p className="text-sm text-red-600">{admissionNumber}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-orange-600">
              <Clock className="h-3 w-3" />
              <span className="text-xs font-medium">
                {yearsOverdue} year{yearsOverdue !== 1 ? 's' : ''} overdue
              </span>
            </div>
          </div>
        </div>

        {/* Dues Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-red-700">
            <TrendingDown className="h-3 w-3" />
            <span className="font-medium">Outstanding Breakdown:</span>
          </div>
          <div className="grid gap-1">
            {dues.duesDetails.map((due, index) => (
              <div key={index} className="flex justify-between items-center bg-red-100 p-2 rounded text-sm">
                <div>
                  <span className="font-medium text-red-800">{due.feeType}</span>
                  <span className="text-red-600 ml-1">({due.academicYear})</span>
                </div>
                <span className="font-medium text-red-800">
                  ₹{due.balanceAmount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Impact Warning */}
        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
            <div className="text-xs text-yellow-800">
              <p className="font-medium">Payment Impact:</p>
              <p>Current year fee payments are blocked until previous dues are cleared.</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onViewDetails}
            className="flex-1 border-red-200 text-red-700 hover:bg-red-100"
          >
            <Eye className="h-3 w-3 mr-1" />
            View Details
          </Button>
          <Button
            size="sm"
            onClick={onClearDues}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            <IndianRupee className="h-3 w-3 mr-1" />
            Clear Dues
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-red-200">
          <div className="text-center">
            <div className="text-lg font-bold text-red-700">
              {dues.duesDetails.length}
            </div>
            <div className="text-xs text-red-600">Fee Types</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-red-700">
              {new Set(dues.duesDetails.map(d => d.academicYear)).size}
            </div>
            <div className="text-xs text-red-600">Academic Years</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}