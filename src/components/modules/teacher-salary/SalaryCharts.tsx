import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { TeacherSalary } from "@/types/database";

interface SalaryChartsProps {
  salaries: TeacherSalary[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export function SalaryCharts({ salaries }: SalaryChartsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Monthly salary trend
  const monthlyData = salaries.reduce((acc, salary) => {
    const key = `${salary.year}-${salary.month.toString().padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = { period: key, total: 0, count: 0 };
    }
    acc[key].total += salary.final_salary;
    acc[key].count += 1;
    return acc;
  }, {} as Record<string, { period: string; total: number; count: number }>);

  const monthlyChartData = Object.values(monthlyData)
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-12)
    .map(item => ({
      ...item,
      displayPeriod: (() => {
        const [year, month] = item.period.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('default', { 
          month: 'short', 
          year: '2-digit' 
        });
      })()
    }));

  // Status distribution
  const statusData = salaries.reduce((acc, salary) => {
    acc[salary.status] = (acc[salary.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusChartData = Object.entries(statusData)
    .map(([status, count]) => ({ status, count }));

  // Department wise (if teacher data was available)
  const departmentData = [
    { department: 'Mathematics', average: 45000, count: 5 },
    { department: 'Science', average: 48000, count: 7 },
    { department: 'English', average: 42000, count: 4 },
    { department: 'Social Studies', average: 44000, count: 3 },
    { department: 'Arts', average: 40000, count: 2 }
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Monthly Salary Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Salary Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayPeriod" />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip 
                formatter={(value: number) => [formatCurrency(value), 'Total Salaries']}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Line type="monotone" dataKey="total" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Payment Status Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusChartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, percent }) => `${status} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {statusChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Salary Distribution by Department */}
      <Card>
        <CardHeader>
          <CardTitle>Average Salary by Department</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" angle={-45} textAnchor="end" height={100} />
              <YAxis tickFormatter={formatCurrency} />
              <Tooltip formatter={(value: number) => [formatCurrency(value), 'Average Salary']} />
              <Bar dataKey="average" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Monthly Teacher Count */}
      <Card>
        <CardHeader>
          <CardTitle>Teachers Paid Monthly</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyChartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayPeriod" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}