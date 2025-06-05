
import { useState } from "react";
import { Navigate } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";
import { Dashboard } from "@/components/modules/Dashboard";
import { StudentManagement } from "@/components/modules/StudentManagement";
import { ParentManagement } from "@/components/modules/ParentManagement";
import { TeacherManagement } from "@/components/modules/TeacherManagement";
import { ClassManagement } from "@/components/modules/ClassManagement";
import { AttendanceTracking } from "@/components/modules/AttendanceTracking";
import { FeeManagement } from "@/components/modules/FeeManagement";
import { ExamGrading } from "@/components/modules/ExamGrading";
import { TimetableScheduling } from "@/components/modules/TimetableScheduling";
import { Reports } from "@/components/modules/Reports";
import { Settings } from "@/components/modules/Settings";
import { LoginPage } from "@/components/auth/LoginPage";

const Index = () => {
  const [currentUser, setCurrentUser] = useState<{
    id: string;
    username: string;
    role: "Admin" | "Teacher" | "Parent" | "Accountant";
  } | null>(null);
  
  const [activeModule, setActiveModule] = useState("dashboard");

  if (!currentUser) {
    return <LoginPage onLogin={setCurrentUser} />;
  }

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard userRole={currentUser.role} />;
      case "students":
        return <StudentManagement />;
      case "parents":
        return <ParentManagement />;
      case "teachers":
        return <TeacherManagement />;
      case "classes":
        return <ClassManagement />;
      case "attendance":
        return <AttendanceTracking />;
      case "fees":
        return <FeeManagement />;
      case "exams":
        return <ExamGrading />;
      case "timetable":
        return <TimetableScheduling />;
      case "reports":
        return <Reports userRole={currentUser.role} />;
      case "settings":
        return <Settings />;
      default:
        return <Dashboard userRole={currentUser.role} />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar 
          userRole={currentUser.role} 
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={currentUser} onLogout={() => setCurrentUser(null)} />
          <main className="flex-1 overflow-auto p-6">
            {renderModule()}
          </main>
          <footer className="bg-white border-t px-6 py-4 text-center text-sm text-gray-600">
            © 2025 SchoolMaster. All rights reserved.
          </footer>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
