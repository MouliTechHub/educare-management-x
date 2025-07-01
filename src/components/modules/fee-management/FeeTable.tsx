import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Users } from "lucide-react";
import { FeeTableRow } from "./FeeTableRow";
import { Fee } from "./types/feeTypes";

interface FeeTableProps {
  fees: Fee[];
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
}

export function FeeTable({ fees, onPaymentClick, onDiscountClick, onHistoryClick }: FeeTableProps) {
  console.log('FeeTable rendering with fees:', fees.length);

  if (fees.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Fee Records Found</h3>
        <p className="text-gray-500 mb-4">No fee records match your current criteria</p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>• Try adjusting your search filters</p>
          <p>• Check if the correct academic year is selected</p>
          <p>• Ensure students have been assigned fees</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-blue-800 text-sm">
          📋 Displaying {fees.length} fee record(s). Click "History" to view detailed payment timeline with exact timestamps.
        </p>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
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
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fees.map((fee) => (
            <FeeTableRow
              key={fee.id}
              fee={fee}
              onPaymentClick={onPaymentClick}
              onDiscountClick={onDiscountClick}
              onHistoryClick={onHistoryClick}
              onChangeHistoryClick={() => {}} // Empty function since ChangeHistoryDialog is removed
              showPaymentActions={true}
            />
          ))}
        </TableBody>
      </Table>
    </>
  );
}
