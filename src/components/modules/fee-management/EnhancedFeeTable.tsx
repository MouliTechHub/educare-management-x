import React from "react";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { EnhancedFeeTableRow } from "./EnhancedFeeTableRow";
import { Fee } from "./types/feeTypes";

interface EnhancedFeeTableProps {
  fees: Fee[];
  selectedFees: Set<string>;
  onSelectionChange: (feeIds: Set<string>) => void;
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
  onNotesEdit: (feeId: string, notes: string) => void;
}

export function EnhancedFeeTable({ 
  fees, 
  selectedFees, 
  onSelectionChange, 
  onPaymentClick, 
  onDiscountClick, 
  onHistoryClick,
  onNotesEdit 
}: EnhancedFeeTableProps) {
  if (fees.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No fee records found</p>
      </div>
    );
  }

  const handleFeeSelection = (feeId: string, checked: boolean) => {
    const newSelection = new Set(selectedFees);
    if (checked) {
      newSelection.add(feeId);
    } else {
      newSelection.delete(feeId);
    }
    onSelectionChange(newSelection);
  };

  const totals = {
    actualAmount: fees.reduce((sum, fee) => sum + fee.actual_amount, 0),
    discountAmount: fees.reduce((sum, fee) => sum + fee.discount_amount, 0),
    finalAmount: fees.reduce((sum, fee) => sum + (fee.actual_amount - fee.discount_amount), 0),
    paidAmount: fees.reduce((sum, fee) => sum + fee.total_paid, 0),
    balanceAmount: fees.reduce((sum, fee) => sum + (fee.actual_amount - fee.discount_amount - fee.total_paid), 0)
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={selectedFees.size === fees.length && fees.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectionChange(new Set(fees.map(fee => fee.id)));
                  } else {
                    onSelectionChange(new Set());
                  }
                }}
              />
            </TableHead>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Fee Type</TableHead>
            <TableHead>Actual Fee</TableHead>
            <TableHead>Discount</TableHead>
            <TableHead>Final Fee</TableHead>
            <TableHead>Paid Amount</TableHead>
            <TableHead>Balance Fee</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Notes</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map((fee) => (
            <EnhancedFeeTableRow
              key={fee.id}
              fee={fee}
              isSelected={selectedFees.has(fee.id)}
              onSelectionChange={(checked) => handleFeeSelection(fee.id, checked)}
              onPaymentClick={onPaymentClick}
              onDiscountClick={onDiscountClick}
              onHistoryClick={onHistoryClick}
              onNotesEdit={onNotesEdit}
            />
          ))}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted/50 font-semibold">
            <TableHead colSpan={4}>Total ({fees.length} records)</TableHead>
            <TableHead>₹{totals.actualAmount.toLocaleString()}</TableHead>
            <TableHead className="text-orange-600">₹{totals.discountAmount.toLocaleString()}</TableHead>
            <TableHead>₹{totals.finalAmount.toLocaleString()}</TableHead>
            <TableHead className="text-green-600">₹{totals.paidAmount.toLocaleString()}</TableHead>
            <TableHead className={totals.balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
              ₹{totals.balanceAmount.toLocaleString()}
            </TableHead>
            <TableHead colSpan={4}></TableHead>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}