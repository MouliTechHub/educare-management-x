import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Calendar, CreditCard, Target } from "lucide-react";
import { Expense } from "@/types/database";

interface ExpenseSummaryCardsProps {
  expenses: Expense[];
}

export function ExpenseSummaryCards({ expenses }: ExpenseSummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  
  const salaryExpenses = expenses
    .filter(expense => expense.category.toLowerCase() === 'salaries')
    .reduce((sum, expense) => sum + expense.amount, 0);
  
  const nonSalaryExpenses = totalExpenses - salaryExpenses;

  // Get most expensive category
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount;
    return acc;
  }, {} as Record<string, number>);

  const mostExpensiveCategory = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)[0];

  // Get current month expenses
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const currentMonthExpenses = expenses
    .filter(expense => {
      const expenseDate = new Date(expense.date);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    })
    .reduce((sum, expense) => sum + expense.amount, 0);

  // Payment mode breakdown
  const paymentModes = expenses.reduce((acc, expense) => {
    acc[expense.payment_mode] = (acc[expense.payment_mode] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostUsedPaymentMode = Object.entries(paymentModes)
    .sort(([,a], [,b]) => b - a)[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(totalExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {expenses.length} expense{expenses.length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Salary Expenses</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(salaryExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {totalExpenses > 0 ? ((salaryExpenses / totalExpenses) * 100).toFixed(1) : 0}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Non-Salary Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(nonSalaryExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {totalExpenses > 0 ? ((nonSalaryExpenses / totalExpenses) * 100).toFixed(1) : 0}% of total
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentMonthExpenses)}</div>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>

      {mostExpensiveCategory && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Category</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{mostExpensiveCategory[0]}</div>
            <p className="text-xs text-muted-foreground">
              {formatCurrency(mostExpensiveCategory[1])}
            </p>
          </CardContent>
        </Card>
      )}

      {mostUsedPaymentMode && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Preferred Payment</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{mostUsedPaymentMode[0]}</div>
            <p className="text-xs text-muted-foreground">
              {mostUsedPaymentMode[1]} transaction{mostUsedPaymentMode[1] !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}