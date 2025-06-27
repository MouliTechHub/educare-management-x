
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, DollarSign, AlertTriangle, Receipt, Percent, Eye, Users } from "lucide-react";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
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

  if (fees.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No fee records found matching your criteria</p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Student</TableHead>
          <TableHead>Class</TableHead>
          <TableHead>Fee Type</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Final Amount</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fees.map((fee) => (
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
            <TableCell className="font-medium">₹{fee.actual_amount.toLocaleString()}</TableCell>
            <TableCell>
              {fee.discount_amount > 0 ? (
                <span className="text-green-600 font-medium">₹{fee.discount_amount.toLocaleString()}</span>
              ) : (
                <span className="text-gray-400">₹0</span>
              )}
            </TableCell>
            <TableCell className="font-medium">₹{fee.amount.toLocaleString()}</TableCell>
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
                {fee.status === "Pending" && (
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
                {fee.status === "Paid" && fee.receipt_number && (
                  <span className="text-sm text-gray-500">
                    Receipt: {fee.receipt_number}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onHistoryClick(fee.student)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
