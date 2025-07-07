import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Receipt,
  History,
  Calculator
} from "lucide-react";

interface FeeRecord {
  id: string;
  fee_type: string;
  actual_fee: number;
  discount_amount: number;
  paid_amount: number;
  balance_fee: number;
  status: string;
  due_date: string;
  academic_year: string;
  is_carry_forward?: boolean;
}

interface FeeSummaryProps {
  studentId: string;
  studentName: string;
  feeRecords: FeeRecord[];
  academicYears: Array<{ id: string; year_name: string; is_current: boolean }>;
  onViewDetails: (studentId: string, academicYear: string) => void;
  onRecordPayment: (feeRecord: FeeRecord) => void;
  onViewHistory: (studentId: string) => void;
}

export function FeeSummarySection({ 
  studentId, 
  studentName, 
  feeRecords, 
  academicYears,
  onViewDetails,
  onRecordPayment,
  onViewHistory 
}: FeeSummaryProps) {
  // Group fees by academic year
  const feesByYear = React.useMemo(() => {
    const grouped = feeRecords.reduce((acc, fee) => {
      if (!acc[fee.academic_year]) {
        acc[fee.academic_year] = [];
      }
      acc[fee.academic_year].push(fee);
      return acc;
    }, {} as Record<string, FeeRecord[]>);
    
    return grouped;
  }, [feeRecords]);

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    const total = feeRecords.reduce((sum, fee) => sum + fee.actual_fee, 0);
    const totalDiscount = feeRecords.reduce((sum, fee) => sum + fee.discount_amount, 0);
    const totalPaid = feeRecords.reduce((sum, fee) => sum + fee.paid_amount, 0);
    const totalBalance = feeRecords.reduce((sum, fee) => sum + fee.balance_fee, 0);
    const overdue = feeRecords.filter(fee => 
      fee.status === 'Overdue' || 
      (fee.balance_fee > 0 && new Date(fee.due_date) < new Date())
    ).length;
    const carryForward = feeRecords.filter(fee => fee.is_carry_forward).length;
    
    return {
      total,
      totalDiscount,
      totalPaid,
      totalBalance,
      overdue,
      carryForward,
      paymentProgress: total > 0 ? (totalPaid / total) * 100 : 0
    };
  }, [feeRecords]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'text-green-600 bg-green-50';
      case 'Partial': return 'text-yellow-600 bg-yellow-50';
      case 'Overdue': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Paid': return <CheckCircle className="h-4 w-4" />;
      case 'Overdue': return <AlertCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Student Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{studentName}</h2>
          <p className="text-muted-foreground">Fee Summary & Management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => onViewHistory(studentId)}>
            <History className="h-4 w-4 mr-2" />
            Payment History
          </Button>
        </div>
      </div>

      {/* Overall Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Fees</p>
                <p className="text-2xl font-bold">₹{summary.total.toLocaleString()}</p>
              </div>
              <Calculator className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Paid</p>
                <p className="text-2xl font-bold text-green-600">₹{summary.totalPaid.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Outstanding</p>
                <p className="text-2xl font-bold text-red-600">₹{summary.totalBalance.toLocaleString()}</p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Progress</p>
                <p className="text-2xl font-bold">{Math.round(summary.paymentProgress)}%</p>
              </div>
              <Receipt className="h-8 w-8 text-purple-500" />
            </div>
            <Progress value={summary.paymentProgress} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Status Indicators */}
      {(summary.overdue > 0 || summary.carryForward > 0) && (
        <div className="flex gap-2">
          {summary.overdue > 0 && (
            <Badge variant="destructive">
              <AlertCircle className="h-3 w-3 mr-1" />
              {summary.overdue} Overdue
            </Badge>
          )}
          {summary.carryForward > 0 && (
            <Badge variant="secondary">
              <History className="h-3 w-3 mr-1" />
              {summary.carryForward} Carry Forward
            </Badge>
          )}
        </div>
      )}

      {/* Year-wise Fee Details */}
      <Card>
        <CardHeader>
          <CardTitle>Year-wise Fee Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={academicYears.find(y => y.is_current)?.year_name || academicYears[0]?.year_name}>
            <TabsList className="grid w-full grid-cols-auto">
              {academicYears.map((year) => (
                <TabsTrigger key={year.id} value={year.year_name}>
                  {year.year_name}
                  {year.is_current && <Badge variant="secondary" className="ml-2">Current</Badge>}
                </TabsTrigger>
              ))}
            </TabsList>
            
            {academicYears.map((year) => (
              <TabsContent key={year.id} value={year.year_name} className="space-y-4">
                {feesByYear[year.year_name] ? (
                  <div className="space-y-3">
                    {feesByYear[year.year_name].map((fee) => (
                      <div key={fee.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(fee.status)}
                          <div>
                            <p className="font-medium">{fee.fee_type}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(fee.due_date).toLocaleDateString()}
                            </p>
                          </div>
                          {fee.is_carry_forward && (
                            <Badge variant="outline" className="text-orange-600">
                              Carry Forward
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="font-medium">₹{fee.actual_fee.toLocaleString()}</p>
                            {fee.discount_amount > 0 && (
                              <p className="text-sm text-green-600">-₹{fee.discount_amount.toLocaleString()}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              Paid: ₹{fee.paid_amount.toLocaleString()}
                            </p>
                            {fee.balance_fee > 0 && (
                              <p className="text-sm font-medium text-red-600">
                                Balance: ₹{fee.balance_fee.toLocaleString()}
                              </p>
                            )}
                          </div>
                          
                          <Badge className={getStatusColor(fee.status)}>
                            {fee.status}
                          </Badge>
                          
                          {fee.balance_fee > 0 && (
                            <Button 
                              size="sm" 
                              onClick={() => onRecordPayment(fee)}
                            >
                              Pay Now
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-muted-foreground">
                        {feesByYear[year.year_name].length} fee record(s)
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => onViewDetails(studentId, year.year_name)}
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No fee records found for {year.year_name}</p>
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}