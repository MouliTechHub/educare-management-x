
import { useState, useEffect } from "react";
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
import { AuthPage } from "@/components/auth/AuthPage";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const { user, loading, signOut } = useAuth();
  const [activeModule, setActiveModule] = useState("dashboard");
  const [userRole, setUserRole] = useState<"Admin" | "Teacher" | "Parent" | "Accountant">("Admin");
  const [highlightedParentId, setHighlightedParentId] = useState<string | undefined>();
  const [highlightedStudentId, setHighlightedStudentId] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        return;
      }

      if (data) {
        setUserRole(data.role as "Admin" | "Teacher" | "Parent" | "Accountant");
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleNavigateToParent = (parentId: string) => {
    console.log('Navigating to parent:', parentId);
    setHighlightedParentId(parentId);
    setHighlightedStudentId(undefined);
    setActiveModule("parents");
  };

  const handleNavigateToStudent = (studentId: string) => {
    console.log('Navigating to student:', studentId);
    setHighlightedStudentId(studentId);
    setHighlightedParentId(undefined);
    setActiveModule("students");
  };

  // Clear highlights when changing modules manually
  const handleModuleChange = (module: string) => {
    setActiveModule(module);
    if (module !== "parents") {
      setHighlightedParentId(undefined);
    }
    if (module !== "students") {
      setHighlightedStudentId(undefined);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  const currentUser = {
    id: user.id,
    username: user.email || 'User',
    role: userRole,
  };

  const renderModule = () => {
    switch (activeModule) {
      case "dashboard":
        return <Dashboard userRole={currentUser.role} />;
      case "students":
        return <StudentManagement onNavigateToParent={handleNavigateToParent} />;
      case "parents":
        return <ParentManagement onNavigateToStudent={handleNavigateToStudent} highlightedParentId={highlightedParentId} />;
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
          onModuleChange={handleModuleChange}
        />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header user={currentUser} onLogout={signOut} />
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
