
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { FileText, Users, DollarSign, GraduationCap, TrendingUp, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface ReportsProps {
  userRole: "Admin" | "Teacher" | "Parent" | "Accountant";
}

interface ReportData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  feeCollectionRate: number;
  attendanceData: Array<{ month: string; percentage: number }>;
  feeData: Array<{ month: string; collected: number; pending: number }>;
  gradeDistribution: Array<{ grade: string; count: number }>;
  classStrength: Array<{ class: string; students: number }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function Reports({ userRole }: ReportsProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch basic counts
      const [studentsResponse, teachersResponse, classesResponse] = await Promise.all([
        supabase.from("students").select("*", { count: "exact", head: true }),
        supabase.from("teachers").select("*", { count: "exact", head: true }),
        supabase.from("classes").select("*", { count: "exact", head: true })
      ]);

      // Fetch attendance data
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("date, status")
        .order("date");

      // Fetch fee data
      const { data: feeData } = await supabase
        .from("fees")
        .select("amount, status, created_at");

      // Fetch grade data
      const { data: gradeData } = await supabase
        .from("grades")
        .select("grade");

      // Fetch class strength data
      const { data: classStrengthData } = await supabase
        .from("students")
        .select(`
          class_id,
          classes(name, section)
        `)
        .eq("status", "Active");

      // Process data
      const totalStudents = studentsResponse.count || 0;
      const totalTeachers = teachersResponse.count || 0;
      const totalClasses = classesResponse.count || 0;

      // Calculate attendance rate
      const totalAttendance = attendanceData?.length || 0;
      const presentCount = attendanceData?.filter(a => a.status === "Present").length || 0;
      const attendanceRate = totalAttendance > 0 ? (presentCount / totalAttendance) * 100 : 0;

      // Calculate fee collection rate
      const totalFees = feeData?.reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const collectedFees = feeData?.filter(f => f.status === "Paid").reduce((sum, fee) => sum + fee.amount, 0) || 0;
      const feeCollectionRate = totalFees > 0 ? (collectedFees / totalFees) * 100 : 0;

      // Process monthly attendance data
      const monthlyAttendance = processMonthlyAttendance(attendanceData || []);

      // Process monthly fee data
      const monthlyFees = processMonthlyFees(feeData || []);

      // Process grade distribution
      const gradeDistribution = processGradeDistribution(gradeData || []);

      // Process class strength
      const classStrength = processClassStrength(classStrengthData || []);

      setReportData({
        totalStudents,
        totalTeachers,
        totalClasses,
        attendanceRate,
        feeCollectionRate,
        attendanceData: monthlyAttendance,
        feeData: monthlyFees,
        gradeDistribution,
        classStrength
      });

    } catch (error: any) {
      toast({
        title: "Error fetching report data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const processMonthlyAttendance = (data: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({ month, total: 0, present: 0 }));

    data.forEach(record => {
      const monthIndex = new Date(record.date).getMonth();
      monthlyData[monthIndex].total++;
      if (record.status === "Present") {
        monthlyData[monthIndex].present++;
      }
    });

    return monthlyData.map(item => ({
      month: item.month,
      percentage: item.total > 0 ? Math.round((item.present / item.total) * 100) : 0
    }));
  };

  const processMonthlyFees = (data: any[]) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(month => ({ month, collected: 0, pending: 0 }));

    data.forEach(fee => {
      const monthIndex = new Date(fee.created_at).getMonth();
      if (fee.status === "Paid") {
        monthlyData[monthIndex].collected += fee.amount;
      } else {
        monthlyData[monthIndex].pending += fee.amount;
      }
    });

    return monthlyData;
  };

  const processGradeDistribution = (data: any[]) => {
    const grades = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'];
    const distribution = grades.map(grade => ({
      grade,
      count: data.filter(g => g.grade === grade).length
    }));

    return distribution.filter(item => item.count > 0);
  };

  const processClassStrength = (data: any[]) => {
    const classCount: { [key: string]: number } = {};
    
    data.forEach(student => {
      if (student.classes) {
        const className = `${student.classes.name}${student.classes.section ? ` ${student.classes.section}` : ''}`;
        classCount[className] = (classCount[className] || 0) + 1;
      }
    });

    return Object.entries(classCount).map(([className, count]) => ({
      class: className,
      students: count
    }));
  };

  const exportReport = () => {
    toast({
      title: "Export feature",
      description: "Report export functionality would be implemented here",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No report data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights and statistics</p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current_month">Current Month</SelectItem>
              <SelectItem value="last_3_months">Last 3 Months</SelectItem>
              <SelectItem value="current_year">Current Year</SelectItem>
              <SelectItem value="last_year">Last Year</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportReport} variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalStudents}</div>
            <p className="text-xs text-muted-foreground">Active students</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalTeachers}</div>
            <p className="text-xs text-muted-foreground">Teaching staff</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.totalClasses}</div>
            <p className="text-xs text-muted-foreground">Active classes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attendance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.attendanceRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Overall attendance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reportData.feeCollectionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Collection rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Attendance Trend</CardTitle>
            <CardDescription>Monthly attendance percentage</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={reportData.attendanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="percentage" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Fee Collection */}
        <Card>
          <CardHeader>
            <CardTitle>Fee Collection</CardTitle>
            <CardDescription>Monthly collected vs pending fees</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.feeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="collected" name="Collected" fill="#4ADE80" />
                <Bar dataKey="pending" name="Pending" fill="#FB7185" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Grade Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Grade Distribution</CardTitle>
            <CardDescription>Distribution of grades across all subjects</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <div className="w-64 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={reportData.gradeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    nameKey="grade"
                    label={({ grade }) => grade}
                  >
                    {reportData.gradeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Class Strength */}
        <Card>
          <CardHeader>
            <CardTitle>Class Strength</CardTitle>
            <CardDescription>Number of students in each class</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={reportData.classStrength}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="class" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="students" name="Students" fill="#60A5FA" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
