
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { EnhancedFeeTableRow } from "./EnhancedFeeTableRow";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

interface EnhancedFeeTableProps {
  feeRecords: StudentFeeRecord[];
  onDiscountClick: (feeRecord: StudentFeeRecord) => void;
  onPaymentClick: (feeRecord: StudentFeeRecord) => void;
  onHistoryClick: (feeRecord: StudentFeeRecord) => void;
}

export function EnhancedFeeTable({ 
  feeRecords, 
  onDiscountClick, 
  onPaymentClick, 
  onHistoryClick 
}: EnhancedFeeTableProps) {
  console.log('EnhancedFeeTable rendering with fee records:', feeRecords.length);

  if (feeRecords.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Fee Records Found</h3>
        <p className="text-gray-500 mb-4">No fee records match your current criteria</p>
        <div className="text-sm text-gray-400 space-y-1">
          <p>• Try adjusting your search filters</p>
          <p>• Check if the correct academic year is selected</p>
          <p>• Add students to automatically create fee records</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
        <p className="text-blue-800 text-sm">
          📋 Displaying {feeRecords.length} enhanced fee record(s) with real-time updates and complete history tracking.
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
          {feeRecords.map((feeRecord) => (
            <EnhancedFeeTableRow
              key={feeRecord.id}
              feeRecord={feeRecord}
              onDiscountClick={onDiscountClick}
              onPaymentClick={onPaymentClick}
              onHistoryClick={onHistoryClick}
            />
          ))}
        </TableBody>
      </Table>
    </>
  );
}
