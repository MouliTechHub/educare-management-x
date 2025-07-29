
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/contexts/AuthContext";
import { AuthPage } from "@/components/auth/AuthPage";
import { SecurityAuditLogger } from "@/components/common/SecurityAuditLogger";

// Import all the management modules
import { StudentManagement } from "@/components/modules/StudentManagement";
import { TeacherManagement } from "@/components/modules/TeacherManagement";
import FeeManagement from "@/components/modules/FeeManagement";
import { ParentManagement } from "@/components/modules/ParentManagement";
import { ClassManagement } from "@/components/modules/ClassManagement";
import { AttendanceManagement } from "@/components/modules/AttendanceManagement";
import { ExamManagement } from "@/components/modules/ExamManagement";
import { SubjectManagement } from "@/components/modules/SubjectManagement";
import { TimetableManagement } from "@/components/modules/TimetableManagement";
import { FeeStructureManagement } from "@/components/modules/FeeStructureManagement";
import { PaymentsManagement } from "@/components/modules/PaymentsManagement";
import { ReportsManagement } from "@/components/modules/ReportsManagement";
import { AcademicYearManagement } from "@/components/modules/AcademicYearManagement";
import { Dashboard } from "@/components/modules/Dashboard";
import { ExpenseManagement } from "@/components/modules/ExpenseManagement";
import { TeacherSalaryManagement } from "@/components/modules/TeacherSalaryManagement";

const Index = () => {
  const [activeModule, setActiveModule] = useState<string>("dashboard");
  const { user, session, loading, signOut } = useAuth();
  const navigate = useNavigate();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      console.log("User not authenticated, redirecting to auth");
    }
  }, [user, loading, navigate]);

  const handleLogout = async () => {
    console.log("Logout clicked");
    try {
      await signOut();
      // The auth context will handle the redirect
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show auth page if not authenticated
  if (!user || !session) {
    return <AuthPage />;
  }

  // Get user data from session
  const userData = {
    id: user.id,
    username: user.email?.split('@')[0] || "Admin User",
    role: "Admin" as const
  };

  const renderActiveModule = () => {
    switch (activeModule) {
      case "students":
        return <StudentManagement />;
      case "parents":
        return <ParentManagement />;
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
      case "fee-structure":
        return <FeeStructureManagement />;
      case "payments":
        return <PaymentsManagement />;
      case "reports":
        return <ReportsManagement />;
      case "academic-years":
        return <AcademicYearManagement />;
      case "expenses":
        return <ExpenseManagement />;
      case "teacher-salaries":
        return <TeacherSalaryManagement />;
      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <SecurityAuditLogger />
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-50">
          <AppSidebar
            userRole={userData.role}
            activeModule={activeModule}
            onModuleChange={setActiveModule}
          />
          
          <div className="flex-1 flex flex-col">
            <Header user={userData} onLogout={handleLogout} />
            
            <main className="flex-1 p-6 overflow-auto">
              {renderActiveModule()}
            </main>
          </div>
        </div>
      </SidebarProvider>
    </>
  );
};

export default Index;
