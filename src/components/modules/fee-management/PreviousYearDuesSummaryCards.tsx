import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, DollarSign, TrendingUp, AlertTriangle, Clock, CheckCircle } from "lucide-react";
import { PYDSummaryData } from "./hooks/usePreviousYearDues";

interface PreviousYearDuesSummaryCardsProps {
  summaryData: PYDSummaryData;
  loading?: boolean;
}

export function PreviousYearDuesSummaryCards({ summaryData, loading }: PreviousYearDuesSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return isFinite(num) ? num.toLocaleString('en-IN') : '0';
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="space-y-0 pb-2">
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Students with Outstanding Dues */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Students with Dues
          </CardTitle>
          <Users className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatNumber(summaryData.studentsWithDues)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Students with outstanding previous year dues
          </p>
        </CardContent>
      </Card>

      {/* Total Outstanding */}
      <Card className="border-l-4 border-l-red-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Total Outstanding
          </CardTitle>
          <DollarSign className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(summaryData.totalOutstanding)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Total amount pending collection
          </p>
        </CardContent>
      </Card>

      {/* Average per Student */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Average per Student
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(summaryData.avgPerStudent)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Average outstanding per student
          </p>
        </CardContent>
      </Card>

      {/* High Outstanding (≥25k) */}
      <Card className="border-l-4 border-l-red-600">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            High Outstanding
          </CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-red-700">
              {formatNumber(summaryData.highCount)}
            </div>
            <Badge variant="destructive" className="text-xs">
              ≥₹25,000
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Students with high outstanding amounts
          </p>
        </CardContent>
      </Card>

      {/* Medium Outstanding (10k-25k) */}
      <Card className="border-l-4 border-l-yellow-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Medium Outstanding
          </CardTitle>
          <Clock className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-yellow-600">
              {formatNumber(summaryData.mediumCount)}
            </div>
            <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">
              ₹10k-25k
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Students with moderate outstanding amounts
          </p>
        </CardContent>
      </Card>

      {/* Low Outstanding (<10k) */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Low Outstanding
          </CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(summaryData.lowCount)}
            </div>
            <Badge variant="outline" className="text-xs border-green-200 text-green-700">
              &lt;₹10,000
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Students with low outstanding amounts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}