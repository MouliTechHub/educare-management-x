import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { MainLayout } from "@/layouts/MainLayout";
import { Dashboard } from "./components/modules/Dashboard";
import { StudentManagement } from "./components/modules/StudentManagement";
import { TeacherManagement } from "./components/modules/TeacherManagement";
import { ClassManagement } from "./components/modules/ClassManagement";
import { SubjectManagement } from "./components/modules/SubjectManagement";
import { ParentManagement } from "./components/modules/ParentManagement";
import { FeeManagement } from "./components/modules/FeeManagement";
import { PaymentsManagement } from "./components/modules/PaymentsManagement";
import { AcademicYearManagement } from "./components/modules/AcademicYearManagement";
import { AttendanceManagement } from "./components/modules/AttendanceManagement";
import { EnhancedFeeManagement } from "./components/modules/EnhancedFeeManagement";

function App() {
  const [activeModule, setActiveModule] = useState<
    | "dashboard"
    | "student-management"
    | "teacher-management"
    | "class-management"
    | "subject-management"
    | "parent-management"
    | "fee-management"
    | "payments-management"
    | "academic-year-management"
    | "attendance-management"
    | null
  >("dashboard");

  const handleNavigateToParent = (parentId: string) => {
    console.log('Navigating to parent:', parentId);
    setActiveModule("parent-management");
  };

  return (
    <Router>
      <MainLayout activeModule={activeModule} setActiveModule={setActiveModule}>
        <Routes>
          <Route
            path="/"
            element={<Navigate to="/dashboard" replace />}
          />
          <Route
            path="/dashboard"
            element={<Dashboard />}
          />
          <Route
            path="/student-management"
            element={<StudentManagement onNavigateToParent={handleNavigateToParent} />}
          />
          <Route
            path="/teacher-management"
            element={<TeacherManagement />}
          />
          <Route
            path="/class-management"
            element={<ClassManagement />}
          />
          <Route
            path="/subject-management"
            element={<SubjectManagement />}
          />
          <Route
            path="/parent-management"
            element={<ParentManagement />}
          />
          {/* <Route
            path="/fee-management"
            element={<FeeManagement />}
          /> */}
          <Route
            path="/payments-management"
            element={<PaymentsManagement />}
          />
          <Route
            path="/academic-year-management"
            element={<AcademicYearManagement />}
          />
          <Route
            path="/attendance-management"
            element={<AttendanceManagement />}
          />
          {activeModule === "fee-management" && <EnhancedFeeManagement />}
        </Routes>
      </MainLayout>
      <Toaster />
    </Router>
  );
}

export default App;
