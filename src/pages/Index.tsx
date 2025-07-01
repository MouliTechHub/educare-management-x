
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { School, Users, CreditCard, BookOpen, Calendar, BarChart3, UserCheck, GraduationCap, DollarSign, FileText, Settings, Building } from "lucide-react";

// Import all the management modules
import { StudentManagement } from "@/components/modules/StudentManagement";
import { TeacherManagement } from "@/components/modules/TeacherManagement";
import { FeeManagement } from "@/components/modules/FeeManagement";
import { ClassManagement } from "@/components/modules/ClassManagement";
import { AttendanceManagement } from "@/components/modules/AttendanceManagement";
import { ExamManagement } from "@/components/modules/ExamManagement";
import { SubjectManagement } from "@/components/modules/SubjectManagement";
import { TimetableManagement } from "@/components/modules/TimetableManagement";
import { FeeStructureManagement } from "@/components/modules/FeeStructureManagement";
import { PaymentsManagement } from "@/components/modules/PaymentsManagement";
import { ReportsManagement } from "@/components/modules/ReportsManagement";
import { AcademicYearManagement } from "@/components/modules/AcademicYearManagement";

const Index = () => {
  const [activeModule, setActiveModule] = useState<string>("dashboard");

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: BarChart3 },
    { id: "students", label: "Students", icon: Users },
    { id: "teachers", label: "Teachers", icon: UserCheck },
    { id: "classes", label: "Classes", icon: Building },
    { id: "subjects", label: "Subjects", icon: BookOpen },
    { id: "attendance", label: "Attendance", icon: Calendar },
    { id: "exams", label: "Exams", icon: GraduationCap },
    { id: "timetable", label: "Timetable", icon: Calendar },
    { id: "fees", label: "Fee Management", icon: CreditCard },
    { id: "fee-structures", label: "Fee Structures", icon: Settings },
    { id: "payments", label: "Payments", icon: DollarSign },
    { id: "reports", label: "Reports", icon: FileText },
    { id: "academic-years", label: "Academic Years", icon: Calendar },
  ];

  const renderActiveModule = () => {
    switch (activeModule) {
      case "students":
        return <StudentManagement />;
      case "teachers":
        return <TeacherManagement />;
      case "classes":
        return <ClassManagement />;
      case "subjects":
        return <SubjectManagement />;
      case "attendance":
        return <AttendanceManagement />;
      case "exams":
        return <ExamManagement />;
      case "timetable":
        return <TimetableManagement />;
      case "fees":
        return <FeeManagement />;
      case "fee-structures":
        return <FeeStructureManagement />;
      case "payments":
        return <PaymentsManagement />;
      case "reports":
        return <ReportsManagement />;
      case "academic-years":
        return <AcademicYearManagement />;
      default:
        return (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,234</div>
                <p className="text-xs text-muted-foreground">
                  +5% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
                <UserCheck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">
                  +2 new this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">
                  Across all grades
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fee Collection</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹12.4L</div>
                <p className="text-xs text-muted-foreground">
                  85% collection rate
                </p>
              </CardContent>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 min-h-screen bg-card border-r border-border">
          <div className="p-6">
            <div className="flex items-center space-x-3">
              <School className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">EduManage</h1>
                <p className="text-sm text-muted-foreground">School Management</p>
              </div>
            </div>
          </div>
          <nav className="mt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.id}
                  variant={activeModule === item.id ? "secondary" : "ghost"}
                  className="w-full justify-start px-6 py-3 h-auto"
                  onClick={() => setActiveModule(item.id)}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <header className="border-b border-border bg-background">
            <div className="px-6 py-4">
              <h2 className="text-2xl font-semibold capitalize">
                {activeModule === "dashboard" ? "Dashboard" : 
                 menuItems.find(item => item.id === activeModule)?.label || "Dashboard"}
              </h2>
            </div>
          </header>
          <main className="p-6">
            {renderActiveModule()}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Index;
