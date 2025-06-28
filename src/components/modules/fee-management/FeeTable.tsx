
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign, AlertTriangle, Receipt, Percent, Eye, Users, History } from "lucide-react";
import { useState } from "react";
import { ChangeHistoryDialog } from "./ChangeHistoryDialog";

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Paid":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Pending":
        return <DollarSign className="w-4 h-4 text-yellow-600" />;
      case "Overdue":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />;
    }
  };

  const getStatusVariant = (status: string, dueDate: string) => {
    if (status === "Paid") return "default";
    if (status === "Pending" && new Date(dueDate) < new Date()) return "destructive";
    return "secondary";
  };

  const getDisplayStatus = (status: string, dueDate: string) => {
    if (status === "Paid") return "Paid";
    if (status === "Pending" && new Date(dueDate) < new Date()) return "Overdue";
    return status;
  };

  const calculateFees = (fee: Fee) => {
    const actualFee = fee.actual_amount;
    const finalFee = actualFee - fee.discount_amount;
    const balanceFee = finalFee - fee.total_paid;
    return { actualFee, finalFee, balanceFee };
  };

  const openChangeHistory = (fee: Fee) => {
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
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No fee records found matching your criteria</p>
      </div>
    );
  }

  return (
    <>
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
          {fees.map((fee) => {
            const { actualFee, finalFee, balanceFee } = calculateFees(fee);
            return (
              <TableRow key={fee.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">
                      {fee.student ? `${fee.student.first_name} ${fee.student.last_name}` : "Unknown"}
                    </div>
                    <div className="text-sm text-gray-500">
                      {fee.student?.admission_number}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div>{fee.student?.class_name || "N/A"}</div>
                    {fee.student?.section && (
                      <div className="text-gray-500">Section {fee.student.section}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{fee.fee_type}</TableCell>
                <TableCell className="font-medium">₹{actualFee.toLocaleString()}</TableCell>
                <TableCell>
                  {fee.discount_amount > 0 ? (
                    <span className="text-green-600 font-medium">₹{fee.discount_amount.toLocaleString()}</span>
                  ) : (
                    <span className="text-gray-400">₹0</span>
                  )}
                </TableCell>
                <TableCell className="font-medium">₹{finalFee.toLocaleString()}</TableCell>
                <TableCell className="font-medium text-blue-600">₹{fee.total_paid.toLocaleString()}</TableCell>
                <TableCell className={`font-medium ${balanceFee > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{balanceFee.toLocaleString()}
                </TableCell>
                <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge variant={getStatusVariant(fee.status, fee.due_date)}>
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(getDisplayStatus(fee.status, fee.due_date))}
                      <span>{getDisplayStatus(fee.status, fee.due_date)}</span>
                    </div>
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {balanceFee > 0 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onPaymentClick(fee)}
                        >
                          <Receipt className="w-4 h-4 mr-1" />
                          Pay
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDiscountClick(fee)}
                        >
                          <Percent className="w-4 h-4 mr-1" />
                          Discount
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openChangeHistory(fee)}
                      title="View Change History"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onHistoryClick(fee.student)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    {fee.status === "Paid" && fee.receipt_number && (
                      <span className="text-sm text-gray-500">
                        Receipt: {fee.receipt_number}
                      </span>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
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
