
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FeeTableRow } from "./FeeTableRow";
import { Fee } from "./types/feeTypes";

interface FeeTableProps {
  fees: Fee[];
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
  onStudentClick: (studentId: string) => void;
  onDiscountHistoryClick?: (fee: Fee) => void;
}

export function FeeTable({ fees, onPaymentClick, onDiscountClick, onHistoryClick, onStudentClick, onDiscountHistoryClick }: FeeTableProps) {
  console.log('FeeTable rendering with fees:', fees.length);

  if (fees.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No fee records found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Previous Year Dues</TableHead>
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
              onStudentClick={onStudentClick}
              onChangeHistoryClick={() => {
                console.log('Change history clicked for fee:', fee.id);
                // This will be handled by the history dialog
              }}
              showPaymentActions={true}
              onDiscountHistoryClick={onDiscountHistoryClick}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
