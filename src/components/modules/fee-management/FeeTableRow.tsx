
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { History, FileText } from "lucide-react";

interface Fee {
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
  fee: Fee;
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
  onChangeHistoryClick: (fee: Fee) => void;
  showPaymentActions?: boolean;
}

export function FeeTableRow({ 
  fee, 
  onPaymentClick, 
  onDiscountClick, 
  onHistoryClick, 
  onChangeHistoryClick,
  showPaymentActions = true 
}: FeeTableRowProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const finalAmount = fee.actual_amount - fee.discount_amount;
  const balance = finalAmount - fee.total_paid;

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">
            {fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : 'Unknown Student'}
          </div>
          <div className="text-sm text-gray-500">
            {fee.student?.admission_number || 'N/A'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {fee.student?.class_name || 'Unknown Class'}
        {fee.student?.section && ` - ${fee.student.section}`}
      </TableCell>
      <TableCell className="font-medium">{fee.fee_type}</TableCell>
      <TableCell>₹{fee.actual_amount.toLocaleString()}</TableCell>
      <TableCell>
        {fee.discount_amount > 0 ? (
          <span className="text-green-600 font-medium">₹{fee.discount_amount.toLocaleString()}</span>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      <TableCell className="font-medium">₹{finalAmount.toLocaleString()}</TableCell>
      <TableCell className="font-medium text-blue-600">₹{fee.total_paid.toLocaleString()}</TableCell>
      <TableCell className={`font-medium ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
        ₹{balance.toLocaleString()}
      </TableCell>
      <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
      <TableCell>
        <Badge className={getStatusColor(fee.status)}>
          {fee.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHistoryClick(fee.student)}
            title="View detailed payment history"
          >
            <History className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onChangeHistoryClick(fee)}
            title="View change history"
          >
            <FileText className="w-4 h-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
