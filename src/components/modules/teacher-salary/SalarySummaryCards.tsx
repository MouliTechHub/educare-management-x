import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Users, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";
import { TeacherSalary } from "@/types/database";

interface SalarySummaryCardsProps {
  salaries: TeacherSalary[];
}

export function SalarySummaryCards({ salaries }: SalarySummaryCardsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const totalSalaryPaid = salaries
    .filter(salary => salary.status === 'Paid')
    .reduce((sum, salary) => sum + salary.final_salary, 0);

  const totalSalaryPending = salaries
    .filter(salary => salary.status === 'Pending')
    .reduce((sum, salary) => sum + salary.final_salary, 0);

  const totalTeachers = new Set(salaries.map(salary => salary.teacher_id)).size;

  const averageSalary = salaries.length > 0 
    ? salaries.reduce((sum, salary) => sum + salary.final_salary, 0) / salaries.length
    : 0;

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const currentMonthSalaries = salaries.filter(salary => 
    salary.month === currentMonth && salary.year === currentYear
  );

  const paidThisMonth = currentMonthSalaries
    .filter(salary => salary.status === 'Paid')
    .reduce((sum, salary) => sum + salary.final_salary, 0);

  const pendingThisMonth = currentMonthSalaries
    .filter(salary => salary.status === 'Pending')
    .reduce((sum, salary) => sum + salary.final_salary, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Paid</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{formatCurrency(totalSalaryPaid)}</div>
          <p className="text-xs text-muted-foreground">
            {salaries.filter(s => s.status === 'Paid').length} payment{salaries.filter(s => s.status === 'Paid').length !== 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
          <AlertCircle className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(totalSalaryPending)}</div>
          <p className="text-xs text-muted-foreground">
            {salaries.filter(s => s.status === 'Pending').length} pending
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month Paid</CardTitle>
          <DollarSign className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{formatCurrency(paidThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month Pending</CardTitle>
          <Clock className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatCurrency(pendingThisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            Requires attention
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
          <Users className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600">{totalTeachers}</div>
          <p className="text-xs text-muted-foreground">
            With salary records
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Average Salary</CardTitle>
          <TrendingUp className="h-4 w-4 text-indigo-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-indigo-600">{formatCurrency(averageSalary)}</div>
          <p className="text-xs text-muted-foreground">
            Across all records
          </p>
        </CardContent>
      </Card>
    </div>
  );
}