
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { Student } from "@/types/database";
import { useStudentData } from "./student-management/useStudentData";
import { StudentForm } from "./student-management/StudentForm";
import { StudentTable } from "./student-management/StudentTable";

interface StudentManagementProps {
  onNavigateToParent?: (parentId: string) => void;
}

export function StudentManagement({ onNavigateToParent }: StudentManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { students, classes, loading, fetchStudents, deleteStudent } = useStudentData();

  const openEditDialog = (student: Student) => {
    console.log('Opening edit dialog for student:', student);
    setSelectedStudent(student);
    setDialogOpen(true);
  };

  const openAddDialog = () => {
    console.log('Opening add student dialog...');
    setSelectedStudent(null);
    setDialogOpen(true);
  };

  const handleStudentSaved = () => {
    fetchStudents();
    setSelectedStudent(null);
  };

  const handleViewParent = (parentId: string) => {
    if (onNavigateToParent) {
      onNavigateToParent(parentId);
    }
  };

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
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
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-2">Manage student enrollment and information</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <StudentForm
            open={dialogOpen}
            onOpenChange={setDialogOpen}
            selectedStudent={selectedStudent}
            classes={classes}
            onStudentSaved={handleStudentSaved}
          />
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Students</CardTitle>
              <CardDescription>Manage student enrollment</CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Search className="w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <StudentTable
            students={filteredStudents}
            onEditStudent={openEditDialog}
            onDeleteStudent={deleteStudent}
            onViewParent={handleViewParent}
          />
        </CardContent>
      </Card>
    </div>
  );
}
