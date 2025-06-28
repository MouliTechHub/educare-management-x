
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Fee } from "@/types/database";

interface FeeRecordsTabProps {
  fees: Fee[];
}

export function FeeRecordsTab({ fees }: FeeRecordsTabProps) {
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fee Type</TableHead>
          <TableHead>Original Amount</TableHead>
          <TableHead>Discount</TableHead>
          <TableHead>Final Amount</TableHead>
          <TableHead>Paid Amount</TableHead>
          <TableHead>Balance</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {fees.map((fee) => {
          const finalAmount = fee.actual_amount - fee.discount_amount;
          const balance = finalAmount - fee.total_paid;
          return (
            <TableRow key={fee.id}>
              <TableCell className="font-medium">{fee.fee_type}</TableCell>
              <TableCell>₹{Number(fee.actual_amount).toLocaleString()}</TableCell>
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
                <Badge variant={getStatusVariant(fee.status)}>
                  {fee.status}
                </Badge>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
