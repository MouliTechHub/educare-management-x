import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Receipt, ExternalLink } from "lucide-react";
import { Expense } from "@/types/database";

interface ExpenseTableProps {
  expenses: Expense[];
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export function ExpenseTable({ expenses, onEditExpense, onDeleteExpense }: ExpenseTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'salaries': return 'bg-blue-100 text-blue-800';
      case 'rent': return 'bg-purple-100 text-purple-800';
      case 'maintenance': return 'bg-orange-100 text-orange-800';
      case 'electricity': 
      case 'water': return 'bg-yellow-100 text-yellow-800';
      case 'activities':
      case 'independence day':
      case 'krishna janmashtami':
      case 'christmas':
      case 'sankranti': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Paid To</TableHead>
            <TableHead>Payment Mode</TableHead>
            <TableHead>Receipt</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {expenses.map((expense) => (
            <TableRow key={expense.id}>
              <TableCell>
                {new Date(expense.date).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Badge className={getCategoryColor(expense.category)}>
                  {expense.category}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="max-w-xs truncate" title={expense.description}>
                  {expense.description}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(expense.amount)}
              </TableCell>
              <TableCell>{expense.paid_to}</TableCell>
              <TableCell>
                <Badge variant="outline">{expense.payment_mode}</Badge>
              </TableCell>
              <TableCell>
                {expense.receipt_url ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(expense.receipt_url, '_blank')}
                  >
                    <Receipt className="w-4 h-4" />
                  </Button>
                ) : (
                  <span className="text-muted-foreground">No receipt</span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditExpense(expense)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDeleteExpense(expense.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {expenses.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No expenses found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}