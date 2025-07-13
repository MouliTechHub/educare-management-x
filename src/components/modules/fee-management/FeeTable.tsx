
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FeeTableRow } from "./FeeTableRow";

interface FeeWithDues {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  previous_year_dues: number;
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
  };
}

interface FeeTableProps {
  fees: FeeWithDues[];
  onPaymentClick: (fee: FeeWithDues) => void;
  onDiscountClick: (fee: FeeWithDues) => void;
  onHistoryClick: (student: FeeWithDues['student']) => void;
  onStudentClick: (studentId: string) => void;
}

export function FeeTable({ fees, onPaymentClick, onDiscountClick, onHistoryClick, onStudentClick }: FeeTableProps) {
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
            <TableHead>Fee Type</TableHead>
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
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
