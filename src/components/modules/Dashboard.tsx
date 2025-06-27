
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, IndianRupee, Calendar, BookOpen, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalFees: number;
  pendingFees: number;
  activeClasses: number;
  todayAttendance: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalFees: 0,
    pendingFees: 0,
    activeClasses: 0,
    todayAttendance: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch all stats in parallel
      const [
        studentsResult,
        teachersResult,
        feesResult,
        classesResult,
        attendanceResult
      ] = await Promise.all([
        supabase.from("students").select("id", { count: 'exact' }).eq("status", "Active"),
        supabase.from("teachers").select("id", { count: 'exact' }).eq("status", "Active"),
        supabase.from("fees").select("amount, status"),
        supabase.from("classes").select("id", { count: 'exact' }),
        supabase.from("attendance").select("id", { count: 'exact' }).eq("date", new Date().toISOString().split('T')[0])
      ]);

      const totalFees = feesResult.data?.reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;
      const pendingFees = feesResult.data?.filter(fee => fee.status === 'Pending').reduce((sum, fee) => sum + Number(fee.amount), 0) || 0;

      setStats({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalFees,
        pendingFees,
        activeClasses: classesResult.count || 0,
        todayAttendance: attendanceResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">School Management Dashboard</h1>
        <p className="text-gray-600 mt-2">Welcome to your comprehensive school management system</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-5 w-5 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active enrollments</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teaching Staff</CardTitle>
            <GraduationCap className="h-5 w-5 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Fee Collection</CardTitle>
            <IndianRupee className="h-5 w-5 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">₹{stats.totalFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This academic year</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Fees</CardTitle>
            <IndianRupee className="h-5 w-5 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{stats.pendingFees.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Requires collection</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Classes</CardTitle>
            <BookOpen className="h-5 w-5 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.activeClasses}</div>
            <p className="text-xs text-muted-foreground">Running sessions</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <Calendar className="h-5 w-5 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-teal-600">{stats.todayAttendance}</div>
            <p className="text-xs text-muted-foreground">Students present</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-600" />
              <span>Quick Actions</span>
            </CardTitle>
            <CardDescription>Common daily tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors">
                <div className="font-medium">Mark Today's Attendance</div>
                <div className="text-sm text-gray-600">Record student attendance for today</div>
              </div>
              <div className="p-3 bg-green-50 rounded-lg hover:bg-green-100 cursor-pointer transition-colors">
                <div className="font-medium">Collect Fees</div>
                <div className="text-sm text-gray-600">Process fee payments and receipts</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg hover:bg-purple-100 cursor-pointer transition-colors">
                <div className="font-medium">Generate Reports</div>
                <div className="text-sm text-gray-600">Academic and financial reports</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
            <CardDescription>Latest updates in your school</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <div className="text-sm">New student admission completed</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="text-sm">Fee collection for Class 10 updated</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                <div className="text-sm">Monthly report generated</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <div className="text-sm">Teacher attendance marked</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
