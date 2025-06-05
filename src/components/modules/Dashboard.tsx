
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Calendar, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";

interface DashboardProps {
  userRole: "Admin" | "Teacher" | "Parent" | "Accountant";
}

export function Dashboard({ userRole }: DashboardProps) {
  const stats = {
    totalStudents: 1247,
    totalTeachers: 85,
    attendanceToday: 92.5,
    pendingFees: 15280,
    overduePayments: 12,
    activeClasses: 24,
  };

  const getAdminDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Overview</h1>
        <p className="text-gray-600 mt-2">Complete insights into your school management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Staff</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+3</span> new hires
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.attendanceToday}%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">Normal</span> range
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.pendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-red-600">{stats.overduePayments}</span> overdue
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates across the school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Grade 10-A exam results published</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New teacher Sarah Johnson added</p>
                  <p className="text-xs text-gray-500">5 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Fee reminder sent to 23 parents</p>
                  <p className="text-xs text-gray-500">1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Frequently used tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Users className="w-5 h-5 text-blue-600 mb-2" />
                <p className="text-sm font-medium">Add Student</p>
              </button>
              <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <Calendar className="w-5 h-5 text-green-600 mb-2" />
                <p className="text-sm font-medium">Mark Attendance</p>
              </button>
              <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <DollarSign className="w-5 h-5 text-orange-600 mb-2" />
                <p className="text-sm font-medium">Record Payment</p>
              </button>
              <button className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left">
                <TrendingUp className="w-5 h-5 text-purple-600 mb-2" />
                <p className="text-sm font-medium">View Reports</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Alerts & Reminders</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
              <div>
                <p className="font-medium text-red-800">12 overdue fee payments</p>
                <p className="text-sm text-red-600">Requires immediate attention</p>
              </div>
              <Badge variant="destructive">High</Badge>
            </div>
            <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div>
                <p className="font-medium text-yellow-800">Midterm exams in 2 weeks</p>
                <p className="text-sm text-yellow-600">Schedule preparation reminders</p>
              </div>
              <Badge variant="secondary">Medium</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const getTeacherDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <p className="text-gray-600 mt-2">Manage your classes and students</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-sm text-gray-600">Active classes assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">6</div>
            <p className="text-sm text-gray-600">Periods scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-sm text-gray-600">Assignments to grade</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const getParentDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Parent Portal</h1>
        <p className="text-gray-600 mt-2">Track your child's progress</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Child's Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">94%</div>
            <p className="text-sm text-gray-600">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Fees</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹1,500</div>
            <p className="text-sm text-gray-600">Due this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Recent Grades</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">B+</div>
            <p className="text-sm text-gray-600">Average grade</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const getAccountantDashboard = () => (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Financial Dashboard</h1>
        <p className="text-gray-600 mt-2">Monitor school finances</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Collections Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹45,750</div>
            <p className="text-sm text-gray-600">From 23 payments</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pending Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">127</div>
            <p className="text-sm text-gray-600">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-sm text-gray-600">Target achieved</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  switch (userRole) {
    case "Admin":
      return getAdminDashboard();
    case "Teacher":
      return getTeacherDashboard();
    case "Parent":
      return getParentDashboard();
    case "Accountant":
      return getAccountantDashboard();
    default:
      return getAdminDashboard();
  }
}
