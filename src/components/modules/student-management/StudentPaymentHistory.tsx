
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search, Receipt } from "lucide-react";
import { Fee } from "@/types/database";

interface StudentPaymentHistoryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentName: string;
  fees: Fee[];
}

export function StudentPaymentHistory({ 
  open, 
  onOpenChange, 
  studentName, 
  fees 
}: StudentPaymentHistoryProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredFees = fees.filter(fee =>
    fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fee.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (fee.receipt_number && fee.receipt_number.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Paid':
        return 'default';
      case 'Pending':
        return 'secondary';
      case 'Overdue':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Receipt className="w-5 h-5" />
            <span>Payment History - {studentName}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by fee type, status, or receipt number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fee Type</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Payment Date</TableHead>
                <TableHead>Receipt No.</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="font-medium">{fee.fee_type}</TableCell>
                  <TableCell>₹{Number(fee.amount).toLocaleString()}</TableCell>
                  <TableCell>{new Date(fee.due_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {fee.payment_date ? new Date(fee.payment_date).toLocaleDateString() : '-'}
                  </TableCell>
                  <TableCell>{fee.receipt_number || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(fee.status)}>
                      {fee.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredFees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No payment records found.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
