import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, DollarSign } from "lucide-react";
import { TeacherSalary } from "@/types/database";

interface TeacherSalaryTableProps {
  salaries: TeacherSalary[];
  onEditSalary: (salary: TeacherSalary) => void;
  onDeleteSalary: (id: string) => void;
}

export function TeacherSalaryTable({ salaries, onEditSalary, onDeleteSalary }: TeacherSalaryTableProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Paid': return 'bg-green-100 text-green-800';
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Teacher</TableHead>
            <TableHead>Period</TableHead>
            <TableHead>Base Salary</TableHead>
            <TableHead>Attendance</TableHead>
            <TableHead>Final Salary</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {salaries.map((salary) => (
            <TableRow key={salary.id}>
              <TableCell>
                <div className="font-medium">Teacher ID: {salary.teacher_id.slice(0, 8)}</div>
              </TableCell>
              <TableCell>
                {new Date(0, salary.month - 1).toLocaleString('default', { month: 'long' })} {salary.year}
              </TableCell>
              <TableCell>{formatCurrency(salary.base_salary)}</TableCell>
              <TableCell>{salary.attendance_days}/{salary.working_days} days</TableCell>
              <TableCell className="font-medium">{formatCurrency(salary.final_salary)}</TableCell>
              <TableCell>
                <Badge className={getStatusColor(salary.status)}>
                  {salary.status}
                </Badge>
              </TableCell>
              <TableCell>
                {salary.payment_date ? new Date(salary.payment_date).toLocaleDateString() : 'Not paid'}
              </TableCell>
              <TableCell>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onEditSalary(salary)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDeleteSalary(salary.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}