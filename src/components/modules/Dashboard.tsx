import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, GraduationCap, DollarSign, BookOpen, TrendingUp, AlertCircle, Calendar, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalRevenue: number;
  pendingFees: number;
  totalClasses: number;
  presentToday: number;
  overduePayments: number;
  upcomingExams: number;
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    totalRevenue: 0,
    pendingFees: 0,
    totalClasses: 0,
    presentToday: 0,
    overduePayments: 0,
    upcomingExams: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [
        studentsResult,
        teachersResult,
        classesResult,
        feesResult,
        attendanceResult,
        examsResult
      ] = await Promise.all([
        supabase.from("students").select("id", { count: "exact" }).eq("status", "Active"),
        supabase.from("teachers").select("id", { count: "exact" }).eq("status", "Active"),
        supabase.from("classes").select("id", { count: "exact" }),
        supabase.from("fees").select("amount, status, due_date"),
        supabase.from("attendance").select("status").eq("date", new Date().toISOString().split('T')[0]),
        supabase.from("exams").select("id", { count: "exact" }).gte("exam_date", new Date().toISOString().split('T')[0])
      ]);

      const fees = feesResult.data || [];
      const totalRevenue = fees
        .filter(fee => fee.status === "Paid")
        .reduce((sum, fee) => sum + (fee.amount || 0), 0);
      
      const pendingFees = fees
        .filter(fee => fee.status === "Pending")
        .reduce((sum, fee) => sum + (fee.amount || 0), 0);
      
      const overduePayments = fees
        .filter(fee => fee.status === "Pending" && new Date(fee.due_date) < new Date())
        .length;

      const attendance = attendanceResult.data || [];
      const presentToday = attendance.filter(record => record.status === "Present").length;

      setStats({
        totalStudents: studentsResult.count || 0,
        totalTeachers: teachersResult.count || 0,
        totalRevenue,
        pendingFees,
        totalClasses: classesResult.count || 0,
        presentToday,
        overduePayments,
        upcomingExams: examsResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: "Total Students",
      value: stats.totalStudents,
      icon: Users,
      description: "Active enrolled students",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Teachers",
      value: stats.totalTeachers,
      icon: GraduationCap,
      description: "Active teaching staff",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Total Classes",
      value: stats.totalClasses,
      icon: BookOpen,
      description: "Active class sections",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Present Today",
      value: stats.presentToday,
      icon: UserCheck,
      description: "Students present today",
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: DollarSign,
      description: "Total fees collected",
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pending Fees",
      value: `₹${stats.pendingFees.toLocaleString()}`,
      icon: TrendingUp,
      description: "Outstanding payments",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Overdue Payments",
      value: stats.overduePayments,
      icon: AlertCircle,
      description: "Past due date",
      color: "text-red-600",
      bgColor: "bg-red-50",
    },
    {
      title: "Upcoming Exams",
      value: stats.upcomingExams,
      icon: Calendar,
      description: "Scheduled examinations",
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-2">Indian School Management System Overview</p>
        </div>
        <Badge variant="outline" className="text-orange-600 border-orange-200">
          🇮🇳 Indian Education Standard
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {card.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${card.bgColor}`}>
                  <Icon className={`h-4 w-4 ${card.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${card.color}`}>
                  {card.value}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {card.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              Quick Actions Needed
            </CardTitle>
            <CardDescription>
              Important tasks requiring immediate attention
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {stats.overduePayments > 0 && (
              <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Overdue Payments</span>
                </div>
                <Badge variant="destructive">{stats.overduePayments}</Badge>
              </div>
            )}
            {stats.upcomingExams > 0 && (
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">Upcoming Exams</span>
                </div>
                <Badge variant="secondary">{stats.upcomingExams}</Badge>
              </div>
            )}
            {stats.overduePayments === 0 && stats.upcomingExams === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No urgent actions required at this time
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Financial Overview
            </CardTitle>
            <CardDescription>
              Fee collection and revenue insights
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total Collected</span>
              <span className="font-semibold text-green-600">₹{stats.totalRevenue.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Pending Collection</span>
              <span className="font-semibold text-orange-600">₹{stats.pendingFees.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t">
              <span className="text-sm font-medium">Collection Rate</span>
              <span className="font-semibold text-blue-600">
                {stats.totalRevenue + stats.pendingFees > 0 
                  ? Math.round((stats.totalRevenue / (stats.totalRevenue + stats.pendingFees)) * 100)
                  : 0}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
