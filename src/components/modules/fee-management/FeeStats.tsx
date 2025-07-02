
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle } from "lucide-react";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue' | 'Partial';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
    gender?: 'Male' | 'Female' | 'Other';
    status?: 'Active' | 'Inactive' | 'Alumni';
  };
}

interface FeeStatsProps {
  fees: Fee[];
}

export function FeeStats({ fees }: FeeStatsProps) {
  const stats = {
    total: fees.reduce((sum, fee) => sum + (fee.actual_amount - fee.discount_amount), 0),
    collected: fees.reduce((sum, fee) => sum + fee.total_paid, 0),
    pending: fees.filter(fee => fee.status === 'Pending' || fee.status === 'Partial').reduce((sum, fee) => sum + (fee.actual_amount - fee.discount_amount - fee.total_paid), 0),
    overdue: fees.filter(fee => fee.status === 'Overdue').length
  };

  const collectionRate = stats.total > 0 ? ((stats.collected / stats.total) * 100).toFixed(1) : "0";

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Fees</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">₹{stats.total.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">All fee records</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Collected</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">₹{stats.collected.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Successfully paid</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending</CardTitle>
          <DollarSign className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">₹{stats.pending.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">Awaiting payment</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
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
  );
}
