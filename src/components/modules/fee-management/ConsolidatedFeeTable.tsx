import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fee } from "./types/feeTypes";
import { Eye, CreditCard, Receipt, Bell, History, Percent } from "lucide-react";

interface ConsolidatedFeeTableProps {
  fees: Fee[];
  selectedFees: Set<string>;
  onSelectionChange: (feeIds: Set<string>) => void;
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
  onReminderClick: (fee: Fee) => void;
  onDiscountHistoryClick: (fee: Fee) => void;
}

export function ConsolidatedFeeTable({ 
  fees, 
  selectedFees, 
  onSelectionChange, 
  onPaymentClick, 
  onDiscountClick, 
  onHistoryClick,
  onReminderClick,
  onDiscountHistoryClick
}: ConsolidatedFeeTableProps) {
  
  if (fees.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No fee records found</p>
      </div>
    );
  }

  // Group fees by student to consolidate display
  const studentGroups = fees.reduce((groups, fee) => {
    if (!fee.student) return groups;
    
    const studentId = fee.student.id;
    if (!groups[studentId]) {
      groups[studentId] = {
        student: fee.student,
        fees: [],
        totalActual: 0,
        totalDiscount: 0,
        totalFinal: 0,
        totalPaid: 0,
        totalBalance: 0,
        hasPreviousYearDues: false,
        hasCurrentYearFees: false,
        allPaid: true
      };
    }
    
    groups[studentId].fees.push(fee);
    groups[studentId].totalActual += fee.actual_fee;
    groups[studentId].totalDiscount += fee.discount_amount;
    groups[studentId].totalFinal += fee.final_fee;
    groups[studentId].totalPaid += fee.paid_amount;
    groups[studentId].totalBalance += fee.balance_fee;
    
    if (fee.fee_type === 'Previous Year Dues' && fee.balance_fee > 0) {
      groups[studentId].hasPreviousYearDues = true;
    }
    if (fee.fee_type !== 'Previous Year Dues') {
      groups[studentId].hasCurrentYearFees = true;
    }
    if (fee.balance_fee > 0) {
      groups[studentId].allPaid = false;
    }
    
    return groups;
  }, {} as Record<string, {
    student: Fee['student'];
    fees: Fee[];
    totalActual: number;
    totalDiscount: number;
    totalFinal: number;
    totalPaid: number;
    totalBalance: number;
    hasPreviousYearDues: boolean;
    hasCurrentYearFees: boolean;
    allPaid: boolean;
  }>);

  const consolidatedData = Object.values(studentGroups);

  const handleGroupSelection = (studentId: string, checked: boolean) => {
    const group = Object.values(studentGroups).find(g => g.student?.id === studentId);
    if (!group) return;

    const newSelection = new Set(selectedFees);
    group.fees.forEach(fee => {
      if (checked) {
        newSelection.add(fee.id);
      } else {
        newSelection.delete(fee.id);
      }
    });
    onSelectionChange(newSelection);
  };

  const isGroupSelected = (studentId: string) => {
    const group = Object.values(studentGroups).find(g => g.student?.id === studentId);
    if (!group) return false;
    return group.fees.every(fee => selectedFees.has(fee.id));
  };

  const getPaymentButtonFee = (group: any) => {
    // For payment, prioritize Previous Year Dues if they exist
    const previousYearDue = group.fees.find((f: Fee) => f.fee_type === 'Previous Year Dues' && f.balance_fee > 0);
    if (previousYearDue) return previousYearDue;
    
    // Otherwise, return the first unpaid fee
    const unpaidFee = group.fees.find((f: Fee) => f.balance_fee > 0);
    return unpaidFee || group.fees[0];
  };

  const totals = consolidatedData.reduce((acc, group) => ({
    actualAmount: acc.actualAmount + group.totalActual,
    discountAmount: acc.discountAmount + group.totalDiscount,
    finalAmount: acc.finalAmount + group.totalFinal,
    paidAmount: acc.paidAmount + group.totalPaid,
    balanceAmount: acc.balanceAmount + group.totalBalance
  }), { actualAmount: 0, discountAmount: 0, finalAmount: 0, paidAmount: 0, balanceAmount: 0 });

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={consolidatedData.length > 0 && consolidatedData.every(group => 
                  group.fees.every(fee => selectedFees.has(fee.id))
                )}
                onCheckedChange={(checked) => {
                  if (checked) {
                    const allFeeIds = consolidatedData.flatMap(group => group.fees.map(fee => fee.id));
                    onSelectionChange(new Set(allFeeIds));
                  } else {
                    onSelectionChange(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Fee Types</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Total Actual</TableHead>
            <TableHead>Total Discount</TableHead>
            <TableHead>Total Final</TableHead>
            <TableHead>Total Paid</TableHead>
            <TableHead>Total Balance</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consolidatedData.map((group) => {
            const student = group.student!;
            const isSelected = isGroupSelected(student.id);
            
            return (
              <TableRow key={student.id} className={group.hasPreviousYearDues ? "bg-red-50" : ""}>
                <TableHead>
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={(checked) => handleGroupSelection(student.id, !!checked)}
                  />
                </TableHead>
                <TableHead>
                  <div>
                    <div className="font-medium">{student.first_name} {student.last_name}</div>
                    <div className="text-sm text-muted-foreground">{student.admission_number}</div>
                  </div>
                </TableHead>
                <TableHead>
                  <div className="text-sm">
                    <div>{student.class_name}</div>
                    {student.section && <div className="text-muted-foreground">Section {student.section}</div>}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="space-y-1">
                    {group.fees.map((fee, index) => (
                      <Badge key={index} variant={fee.fee_type === 'Previous Year Dues' ? 'destructive' : 'default'} className="text-xs mr-1">
                        {fee.fee_type}
                      </Badge>
                    ))}
                  </div>
                </TableHead>
                <TableHead>
                  <div className="space-y-1">
                    {group.hasPreviousYearDues && (
                      <Badge variant="destructive" className="text-xs block w-fit">
                        Previous Dues
                      </Badge>
                    )}
                    {group.hasCurrentYearFees && group.hasPreviousYearDues && (
                      <Badge variant="secondary" className="text-xs block w-fit">
                        Payment Blocked
                      </Badge>
                    )}
                    {group.allPaid && (
                      <Badge variant="default" className="text-xs block w-fit bg-green-100 text-green-800">
                        All Paid
                      </Badge>
                    )}
                  </div>
                </TableHead>
                <TableHead>₹{group.totalActual.toLocaleString()}</TableHead>
                <TableHead className="text-green-600">₹{group.totalDiscount.toLocaleString()}</TableHead>
                <TableHead>₹{group.totalFinal.toLocaleString()}</TableHead>
                <TableHead className="text-blue-600">₹{group.totalPaid.toLocaleString()}</TableHead>
                <TableHead className={group.totalBalance > 0 ? "text-red-600 font-medium" : "text-green-600"}>
                  ₹{group.totalBalance.toLocaleString()}
                </TableHead>
                <TableHead>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onHistoryClick(student)}
                      className="h-8 w-8 p-0"
                      title="View History"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {group.totalBalance > 0 && (
                      <Button
                        size="sm"
                        onClick={() => onPaymentClick(getPaymentButtonFee(group))}
                        className="h-8 w-8 p-0"
                        title="Record Payment"
                      >
                        <CreditCard className="h-3 w-3" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onDiscountClick(getPaymentButtonFee(group))}
                      className="h-8 w-8 p-0"
                      title="Apply Discount"
                    >
                      <Percent className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onReminderClick(getPaymentButtonFee(group))}
                      className="h-8 w-8 p-0"
                      title="Send Reminder"
                    >
                      <Bell className="h-3 w-3" />
                    </Button>
                  </div>
                </TableHead>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead colSpan={5}>Total ({consolidatedData.length} students)</TableHead>
            <TableHead>₹{totals.actualAmount.toLocaleString()}</TableHead>
            <TableHead className="text-green-600">₹{totals.discountAmount.toLocaleString()}</TableHead>
            <TableHead>₹{totals.finalAmount.toLocaleString()}</TableHead>
            <TableHead className="text-blue-600">₹{totals.paidAmount.toLocaleString()}</TableHead>
            <TableHead className={totals.balanceAmount > 0 ? "text-red-600 font-medium" : "text-green-600"}>
              ₹{totals.balanceAmount.toLocaleString()}
            </TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
