
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Percent, History, Calendar } from "lucide-react";
import { Fee } from "./types/feeTypes";

interface FeeTableRowProps {
  fee: Fee;
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
  onChangeHistoryClick: () => void;
  showPaymentActions: boolean;
}

export function FeeTableRow({
  fee,
  onPaymentClick,
  onDiscountClick,
  onHistoryClick,
  onChangeHistoryClick,
  showPaymentActions
}: FeeTableRowProps) {
  const finalFee = fee.actual_fee - fee.discount_amount;
  const balanceAmount = finalFee - fee.paid_amount;

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
          <div className="font-medium">
            {fee.student?.first_name} {fee.student?.last_name}
          </div>
          <div className="text-sm text-gray-500">
            {fee.student?.admission_number}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {fee.student?.class_name}
        {fee.student?.section && ` - ${fee.student.section}`}
      </TableCell>
      <TableCell>{fee.fee_type}</TableCell>
      <TableCell>₹{fee.actual_fee.toLocaleString()}</TableCell>
      <TableCell>
        {fee.discount_amount > 0 ? (
          <span className="text-green-600">₹{fee.discount_amount.toLocaleString()}</span>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      <TableCell className="font-medium">₹{finalFee.toLocaleString()}</TableCell>
      <TableCell className="text-blue-600">₹{fee.paid_amount.toLocaleString()}</TableCell>
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
            title="View payment history"
          >
            <History className="w-3 h-3" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
