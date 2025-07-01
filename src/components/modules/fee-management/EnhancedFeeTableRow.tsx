
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Percent, CreditCard, History, Eye } from "lucide-react";
import { StudentFeeRecord } from "@/types/enhanced-fee-types";

interface EnhancedFeeTableRowProps {
  feeRecord: StudentFeeRecord;
  onDiscountClick: (feeRecord: StudentFeeRecord) => void;
  onPaymentClick: (feeRecord: StudentFeeRecord) => void;
  onHistoryClick: (feeRecord: StudentFeeRecord) => void;
}

export function EnhancedFeeTableRow({ 
  feeRecord, 
  onDiscountClick, 
  onPaymentClick, 
  onHistoryClick 
}: EnhancedFeeTableRowProps) {
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'bg-green-100 text-green-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Overdue':
        return 'bg-red-100 text-red-800';
      case 'Partial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => `₹${amount.toLocaleString()}`;

  return (
    <TableRow>
      <TableCell>
        <div>
          <div className="font-medium">
            {feeRecord.student ? 
              `${feeRecord.student.first_name} ${feeRecord.student.last_name}` : 
              'Unknown Student'
            }
          </div>
          <div className="text-sm text-gray-500">
            {feeRecord.student?.admission_number || 'N/A'}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {feeRecord.student?.class_name || 'Unknown Class'}
        {feeRecord.student?.section && ` - ${feeRecord.student.section}`}
      </TableCell>
      <TableCell className="font-medium">{feeRecord.fee_type}</TableCell>
      <TableCell>{formatCurrency(feeRecord.actual_fee)}</TableCell>
      <TableCell>
        {feeRecord.discount_amount > 0 ? (
          <div>
            <span className="text-green-600 font-medium">
              {formatCurrency(feeRecord.discount_amount)}
            </span>
            {feeRecord.discount_percentage && (
              <div className="text-xs text-gray-500">
                ({feeRecord.discount_percentage}%)
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-400">₹0</span>
        )}
      </TableCell>
      <TableCell className="font-medium">{formatCurrency(feeRecord.final_fee)}</TableCell>
      <TableCell className="font-medium text-blue-600">
        {formatCurrency(feeRecord.paid_amount)}
      </TableCell>
      <TableCell className={`font-medium ${
        feeRecord.balance_fee > 0 ? 'text-red-600' : 'text-green-600'
      }`}>
        {formatCurrency(feeRecord.balance_fee)}
      </TableCell>
      <TableCell>
        {feeRecord.due_date ? new Date(feeRecord.due_date).toLocaleDateString() : 'N/A'}
      </TableCell>
      <TableCell>
        <Badge className={getStatusColor(feeRecord.status)}>
          {feeRecord.status}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDiscountClick(feeRecord)}
            className="bg-orange-50 hover:bg-orange-100 border-orange-200"
            title="Apply or modify discount"
          >
            <Percent className="w-4 h-4 mr-1" />
            Discount
          </Button>
          {feeRecord.balance_fee > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPaymentClick(feeRecord)}
              className="bg-green-50 hover:bg-green-100 border-green-200"
              title="Record payment"
            >
              <CreditCard className="w-4 h-4 mr-1" />
              Pay
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => onHistoryClick(feeRecord)}
            title="View complete history and timeline"
            className="bg-blue-50 hover:bg-blue-100 border-blue-200"
          >
            <History className="w-4 h-4 mr-1" />
            History
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
