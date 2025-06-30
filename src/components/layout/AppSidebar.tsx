
import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Home,
  Users,
  UserCheck,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  FileText,
  Clock,
  BarChart3,
  Settings,
  CreditCard,
  Receipt,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AppSidebarProps {
  userRole: "Admin" | "Teacher" | "Parent" | "Accountant";
  activeModule: string;
  onModuleChange: (module: string) => void;
}

export function AppSidebar({ userRole, activeModule, onModuleChange }: AppSidebarProps) {
  const getMenuItems = () => {
    const baseItems = [
      { id: "dashboard", title: "Dashboard", icon: Home, badge: null },
    ];

    const adminItems = [
      { id: "students", title: "Students", icon: Users, badge: null },
      { id: "parents", title: "Parents", icon: UserCheck, badge: null },
      { id: "teachers", title: "Teachers", icon: GraduationCap, badge: null },
      { id: "classes", title: "Classes", icon: BookOpen, badge: null },
      { id: "attendance", title: "Attendance", icon: Calendar, badge: null },
      { id: "fees", title: "Fee Management", icon: DollarSign, badge: "3" },
      { id: "fee-structure", title: "Fee Structure", icon: Receipt, badge: null },
      { id: "payments", title: "Payments", icon: CreditCard, badge: null },
      { id: "exams", title: "Exams & Grades", icon: FileText, badge: null },
      { id: "timetable", title: "Timetable", icon: Clock, badge: null },
      { id: "reports", title: "Reports", icon: BarChart3, badge: null },
      { id: "settings", title: "Settings", icon: Settings, badge: null },
    ];

    const teacherItems = [
      { id: "attendance", title: "Attendance", icon: Calendar, badge: null },
      { id: "exams", title: "Exams & Grades", icon: FileText, badge: null },
      { id: "timetable", title: "Timetable", icon: Clock, badge: null },
    ];

    const parentItems = [
      { id: "attendance", title: "Child's Attendance", icon: Calendar, badge: null },
      { id: "fees", title: "Fee Status", icon: DollarSign, badge: "1" },
      { id: "exams", title: "Exam Results", icon: FileText, badge: null },
    ];

    const accountantItems = [
      { id: "fees", title: "Fee Management", icon: DollarSign, badge: "3" },
      { id: "fee-structure", title: "Fee Structure", icon: Receipt, badge: null },
      { id: "payments", title: "Payments", icon: CreditCard, badge: null },
      { id: "reports", title: "Financial Reports", icon: BarChart3, badge: null },
    ];

    switch (userRole) {
      case "Admin":
        return [...baseItems, ...adminItems];
      case "Teacher":
        return [...baseItems, ...teacherItems];
      case "Parent":
        return [...baseItems, ...parentItems];
      case "Accountant":
        return [...baseItems, ...accountantItems];
      default:
        return baseItems;
    }
  };

  const menuItems = getMenuItems();

  return (
    <Sidebar className="border-r border-gray-200">
      <SidebarContent className="bg-white">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SchoolMaster</h1>
              <p className="text-sm text-gray-500">{userRole} Portal</p>
            </div>
          </div>
        </div>
        
        <SidebarGroup>
          <SidebarGroupLabel className="text-gray-600 font-medium px-6 py-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="px-4">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => onModuleChange(item.id)}
                    className={`w-full justify-start p-3 rounded-lg transition-colors ${
                      activeModule === item.id
                        ? "bg-blue-50 text-blue-700 border border-blue-200"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="ml-3">{item.title}</span>
                    {item.badge && (
                      <Badge variant="destructive" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
