
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Percent, History, Calendar } from "lucide-react";
import { Fee } from "./types/feeTypes";

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

interface FeeTableRowProps {
  fee: FeeWithDues;
  onPaymentClick: (fee: FeeWithDues) => void;
  onDiscountClick: (fee: FeeWithDues) => void;
  onHistoryClick: (student: FeeWithDues['student']) => void;
  onChangeHistoryClick: () => void;
  onStudentClick: (studentId: string) => void;
  showPaymentActions: boolean;
}

export function FeeTableRow({
  fee,
  onPaymentClick,
  onDiscountClick,
  onHistoryClick,
  onChangeHistoryClick,
  onStudentClick,
  showPaymentActions
}: FeeTableRowProps) {
  const finalFee = fee.actual_amount - fee.discount_amount;
  const balanceAmount = finalFee - fee.total_paid;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Overdue': return 'bg-red-100 text-red-800';
      case 'Partial': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <TableRow>
      <TableCell>
        <div>
          <button
            onClick={() => fee.student?.id && onStudentClick(fee.student.id)}
            className="text-left hover:text-primary transition-colors"
          >
            <div className="font-medium hover:underline">
              {fee.student?.first_name} {fee.student?.last_name}
            </div>
            <div className="text-sm text-gray-500">
              {fee.student?.admission_number}
            </div>
          </button>
        </div>
      </TableCell>
      <TableCell>
        {fee.student?.class_name}
        {fee.student?.section && ` - ${fee.student.section}`}
      </TableCell>
      <TableCell>{fee.fee_type}</TableCell>
      
      <TableCell>
        {fee.previous_year_dues > 0 ? (
          <div className="text-red-600 font-medium">
            ₹{fee.previous_year_dues.toLocaleString()}
            <Badge variant="destructive" className="ml-2 text-xs">
              Blocked
            </Badge>
          </div>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      
      <TableCell>₹{fee.actual_amount.toLocaleString()}</TableCell>
      <TableCell>
        {fee.discount_amount > 0 ? (
          <span className="text-green-600">₹{fee.discount_amount.toLocaleString()}</span>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      <TableCell className="font-medium">₹{finalFee.toLocaleString()}</TableCell>
      <TableCell className="text-blue-600">₹{fee.total_paid.toLocaleString()}</TableCell>
      <TableCell className={balanceAmount > 0 ? 'text-red-600' : 'text-green-600'}>
        ₹{balanceAmount.toLocaleString()}
      </TableCell>
      <TableCell>
        {fee.due_date ? new Date(fee.due_date).toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(fee.status)}>
          {fee.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDiscountClick(fee)}
            title="Apply discount"
          >
            <Percent className="w-3 h-3" />
          </Button>
          {showPaymentActions && balanceAmount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaymentClick(fee)}
              title="Record payment"
            >
              <CreditCard className="w-3 h-3" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHistoryClick(fee.student)}
            title="View enhanced payment history"
          >
            <History className="w-3 h-3" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeHistoryClick()}
            title="View change history"
          >
            <Calendar className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
