import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Percent, Users } from "lucide-react";
import { Fee } from "./types/feeTypes";

interface EnhancedFeeStatsProps {
  fees: Fee[];
  filters?: any;
}

export function EnhancedFeeStats({ fees, filters }: EnhancedFeeStatsProps) {
  const stats = {
    total: fees.reduce((sum, fee) => sum + ((fee.actual_fee || 0) - (fee.discount_amount || 0)), 0),
    collected: fees.reduce((sum, fee) => sum + (fee.paid_amount || 0), 0),
    pending: fees.filter(fee => fee.status === 'Pending').reduce((sum, fee) => sum + Math.max(0, ((fee.actual_fee || 0) - (fee.discount_amount || 0) - (fee.paid_amount || 0))), 0),
    overdue: fees.filter(fee => fee.status === 'Overdue').length,
    totalDiscount: fees.reduce((sum, fee) => sum + (fee.discount_amount || 0), 0),
    totalStudents: new Set(fees.map(fee => fee.student_id)).size,
    studentsWithDiscounts: new Set(fees.filter(fee => (fee.discount_amount || 0) > 0).map(fee => fee.student_id)).size
  };

  const collectionRate = stats.total > 0 ? ((stats.collected / stats.total) * 100).toFixed(1) : "0";
  const discountRate = (stats.total + stats.totalDiscount) > 0 ? ((stats.totalDiscount / (stats.total + stats.totalDiscount)) * 100).toFixed(1) : "0";

  return (
    <div className="space-y-4">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{(stats.total || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All fee records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collected</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{(stats.collected || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successfully paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <DollarSign className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">₹{(stats.pending || 0).toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">Total Discount</CardTitle>
            <Percent className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">₹{(stats.totalDiscount || 0).toLocaleString()}</div>
            <p className="text-xs text-orange-700">{discountRate}% of original fees</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue || 0}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collection Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{collectionRate}%</div>
            <p className="text-xs text-muted-foreground">Collection efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Students</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">{stats.totalStudents || 0}</div>
            <p className="text-xs text-blue-700">Total students in current filter</p>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 border-purple-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Discounted Students</CardTitle>
            <Percent className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">{stats.studentsWithDiscounts || 0}</div>
            <p className="text-xs text-purple-700">Students with discounts applied</p>
          </CardContent>
        </Card>

        <Card className="bg-indigo-50 border-indigo-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Average Fee</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-indigo-600">
              ₹{stats.totalStudents > 0 ? Math.round((stats.total || 0) / stats.totalStudents).toLocaleString() : "0"}
            </div>
            <p className="text-xs text-indigo-700">Per student (after discount)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
