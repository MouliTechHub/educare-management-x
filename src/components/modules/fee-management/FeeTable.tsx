
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useState } from "react";
import { Users } from "lucide-react";
import { ChangeHistoryDialog } from "./ChangeHistoryDialog";
import { FeeTableRow } from "./FeeTableRow";

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

interface FeeTableProps {
  fees: Fee[];
  onPaymentClick: (fee: Fee) => void;
  onDiscountClick: (fee: Fee) => void;
  onHistoryClick: (student: Fee['student']) => void;
}

export function FeeTable({ fees, onPaymentClick, onDiscountClick, onHistoryClick }: FeeTableProps) {
  const [changeHistoryOpen, setChangeHistoryOpen] = useState(false);
  const [selectedFeeForHistory, setSelectedFeeForHistory] = useState<Fee | null>(null);

  console.log('FeeTable rendering with fees:', fees.length);

  const openChangeHistory = (fee: Fee) => {
    console.log('Opening change history for fee:', fee);
    setSelectedFeeForHistory(fee);
    setChangeHistoryOpen(true);
  };

  // Mock change history data - in real implementation, this would be fetched from backend
  const getMockChangeHistory = (fee: Fee) => {
    const history = [];
    
    // Add payment history if any payments made
    if (fee.total_paid > 0) {
      history.push({
        id: '1',
        change_type: 'payment' as const,
        amount: fee.total_paid,
        previous_value: 0,
        new_value: fee.total_paid,
        changed_by: 'Admin User',
        change_date: fee.payment_date || new Date().toISOString(),
        receipt_number: fee.receipt_number,
        notes: `Payment received for ${fee.fee_type}`
      });
    }

    // Add discount history if any discount applied
    if (fee.discount_amount > 0) {
      history.push({
        id: '2',
        change_type: 'discount' as const,
        amount: fee.discount_amount,
        previous_value: fee.actual_amount,
        new_value: fee.actual_amount - fee.discount_amount,
        changed_by: fee.discount_updated_by || 'Admin User',
        change_date: fee.discount_updated_at || new Date().toISOString(),
        notes: fee.discount_notes || `Discount applied to ${fee.fee_type}`
      });
    }

    return history.sort((a, b) => new Date(b.change_date).getTime() - new Date(a.change_date).getTime());
  };

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
              onChangeHistoryClick={openChangeHistory}
              showPaymentActions={true}
            />
          ))}
        </TableBody>
      </Table>

      {selectedFeeForHistory && (
        <ChangeHistoryDialog
          open={changeHistoryOpen}
          onOpenChange={setChangeHistoryOpen}
          studentName={selectedFeeForHistory.student ? 
            `${selectedFeeForHistory.student.first_name} ${selectedFeeForHistory.student.last_name}` : 
            'Unknown Student'
          }
          feeType={selectedFeeForHistory.fee_type}
          history={getMockChangeHistory(selectedFeeForHistory)}
        />
      )}
    </>
  );
}
