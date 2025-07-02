
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Subject } from "@/types/database";
import { useTeacherActions } from "./teacher-management/useTeacherActions";
import { TeacherTable } from "./teacher-management/TeacherTable";
import { TeacherFormDialog } from "./teacher-management/TeacherFormDialog";

export function TeacherManagement() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);

  const {
    teachers,
    loading,
    fetchTeachers,
    saveTeacher,
    deleteTeacher
  } = useTeacherActions();

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("*")
        .order("name");

      if (error) throw error;
      setSubjects(data || []);
    } catch (error: any) {
      console.error("Error fetching subjects:", error);
    }
  };

  const handleAddTeacher = () => {
    setSelectedTeacher(null);
    setDialogOpen(true);
  };

  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setDialogOpen(true);
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.employee_id && teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (teacher.aadhaar_number && teacher.aadhaar_number.includes(searchTerm.replace(/\s/g, '')))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Teacher Management</h1>
          <p className="text-gray-600 mt-2">Manage teaching staff and their details</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleAddTeacher}>
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      <TeacherFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        selectedTeacher={selectedTeacher}
        onSubmit={saveTeacher}
      />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Teachers</CardTitle>
              <CardDescription>Manage teaching staff</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, employee ID, or Aadhaar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-80"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <TeacherTable
            teachers={filteredTeachers}
            onEditTeacher={handleEditTeacher}
            onDeleteTeacher={deleteTeacher}
          />
        </CardContent>
      </Card>
    </div>
  );
}
