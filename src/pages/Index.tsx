
import { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { Header } from "@/components/layout/Header";

// Import all the management modules
import { StudentManagement } from "@/components/modules/StudentManagement";
import { TeacherManagement } from "@/components/modules/TeacherManagement";
import { FeeManagement } from "@/components/modules/FeeManagement";
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

const Index = () => {
  const [activeModule, setActiveModule] = useState<string>("dashboard");

  // Mock user data - in real app this would come from auth context
  const mockUser = {
    id: "1",
    username: "Admin User",
    role: "Admin" as const
  };

  const handleLogout = () => {
    console.log("Logout clicked");
    // Handle logout logic here
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
      case "dashboard":
      default:
        return <Dashboard />;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <AppSidebar
          userRole={mockUser.role}
          activeModule={activeModule}
          onModuleChange={setActiveModule}
        />
        
        <div className="flex-1 flex flex-col">
          <Header user={mockUser} onLogout={handleLogout} />
          
          <main className="flex-1 p-6 overflow-auto">
            {renderActiveModule()}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
