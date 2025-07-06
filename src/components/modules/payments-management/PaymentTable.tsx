
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface PaymentTableProps {
  payments: any[];
}

export function PaymentTable({ payments }: PaymentTableProps) {
  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'Cash': return 'bg-green-100 text-green-800';
      case 'PhonePe': return 'bg-purple-100 text-purple-800';
      case 'GPay': return 'bg-blue-100 text-blue-800';
      case 'Card': return 'bg-yellow-100 text-yellow-800';
      case 'Online': return 'bg-cyan-100 text-cyan-800';
      case 'Cheque': return 'bg-orange-100 text-orange-800';
      case 'Bank Transfer': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  if (payments.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No payments recorded yet. Record a payment to get started.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Fee Type</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Late Fee</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Reference</TableHead>
            <TableHead>Received By</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {payments.map((payment) => (
            <TableRow key={payment.id}>
              <TableCell className="font-medium">
                {payment.student_fee_records?.students?.first_name} {payment.student_fee_records?.students?.last_name}
                <div className="text-sm text-gray-500">
                  {payment.student_fee_records?.students?.admission_number}
                </div>
              </TableCell>
              <TableCell>
                {payment.student_fee_records?.students?.classes?.name} 
                {payment.student_fee_records?.students?.classes?.section && ` - ${payment.student_fee_records?.students?.classes?.section}`}
              </TableCell>
              <TableCell>
                <Badge variant="outline">
                  {payment.student_fee_records?.fee_type}
                </Badge>
              </TableCell>
              <TableCell className="font-medium">
                ₹{payment.amount_paid.toLocaleString()}
              </TableCell>
              <TableCell>
                {payment.late_fee > 0 ? `₹${payment.late_fee.toLocaleString()}` : '-'}
              </TableCell>
              <TableCell>{formatDate(payment.payment_date)}</TableCell>
              <TableCell>
                <Badge className={getPaymentMethodColor(payment.payment_method)}>
                  {payment.payment_method}
                </Badge>
              </TableCell>
              <TableCell className="max-w-xs truncate">
                {payment.receipt_number || '-'}
              </TableCell>
              <TableCell>{payment.payment_receiver}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
