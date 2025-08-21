
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Percent, History, Calendar, FileText } from "lucide-react";
import { Fee } from "./types/feeTypes";

interface FeeTableRowProps {
  fee: Fee;
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
  onChangeHistoryClick: () => void;
  onStudentClick: (studentId: string) => void;
  onDiscountHistoryClick?: (fee: Fee) => void;
  showPaymentActions: boolean;
}

export function FeeTableRow({
  fee,
  onPaymentClick,
  onDiscountClick,
  onHistoryClick,
  onChangeHistoryClick,
  onStudentClick,
  onDiscountHistoryClick,
  showPaymentActions
}: FeeTableRowProps) {
  // Use the correct property names from Fee interface
  const safeActualFee = fee.actual_fee ?? 0;
  const safeDiscountAmount = fee.discount_amount ?? 0;
  const safePaidAmount = fee.paid_amount ?? 0;
  const safeFinalFee = fee.final_fee ?? 0;
  const safeBalanceFee = fee.balance_fee ?? 0;
  
  // Use previous year dues from the fee data
  const safePreviousYearDues = fee.previous_year_dues ?? 0;

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
        {safePreviousYearDues > 0 ? (
          <div className="text-red-600 font-medium">
            ₹{safePreviousYearDues.toLocaleString()}
            <Badge variant="destructive" className="ml-2 text-xs">
              Blocked
            </Badge>
          </div>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      
      <TableCell>₹{safeActualFee.toLocaleString()}</TableCell>
      <TableCell>
        {safeDiscountAmount > 0 ? (
          <span className="text-green-600">₹{safeDiscountAmount.toLocaleString()}</span>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      <TableCell className="font-medium">₹{safeFinalFee.toLocaleString()}</TableCell>
      <TableCell className="text-blue-600">₹{safePaidAmount.toLocaleString()}</TableCell>
      <TableCell className={safeBalanceFee > 0 ? 'text-red-600' : 'text-green-600'}>
        ₹{safeBalanceFee.toLocaleString()}
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDiscountHistoryClick?.(fee)}
            title="View discount history"
          >
            <FileText className="w-3 h-3" />
          </Button>
          {showPaymentActions && safeBalanceFee > 0 && (
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
