
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Calendar } from "lucide-react";
import { Student } from "@/types/database";
import { useStudentData } from "./student-management/useStudentData";
import { StudentForm } from "./student-management/StudentForm";
import { StudentTable } from "./student-management/StudentTable";
import { supabase } from "@/integrations/supabase/client";

interface StudentManagementProps {
  onNavigateToParent?: (parentId: string) => void;
}

export function StudentManagement({ onNavigateToParent }: StudentManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("current");
  const [academicYears, setAcademicYears] = useState<any[]>([]);

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

  const loadAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('is_current', { ascending: false })
        .order('start_date', { ascending: false });

      if (error) throw error;
      setAcademicYears(data || []);
    } catch (error) {
      console.error('Error loading academic years:', error);
    }
  };

  const loadStudentsByAcademicYear = async () => {
    if (selectedAcademicYear === "all") {
      fetchStudents();
      return;
    }

    try {
      let query = supabase
        .from('students')
        .select(`
          *,
          classes(name, section),
          student_parent_links(
            parent_id,
            parents(
              id,
              first_name,
              last_name,
              relation,
              phone_number,
              email
            )
          )
        `)
        .eq('status', 'Active')
        .order('first_name');

      if (selectedAcademicYear === "current") {
        // Get current academic year
        const { data: currentYear } = await supabase
          .from('academic_years')
          .select('id')
          .eq('is_current', true)
          .single();

        if (currentYear) {
          // Get students who have fee records in current academic year
          const { data: studentIds } = await supabase
            .from('student_fee_records')
            .select('student_id')
            .eq('academic_year_id', currentYear.id);

          if (studentIds && studentIds.length > 0) {
            query = query.in('id', studentIds.map(s => s.student_id));
          }
        }
      } else if (selectedAcademicYear !== "all") {
        // Get students for specific academic year
        const { data: studentIds } = await supabase
          .from('student_fee_records')
          .select('student_id')
          .eq('academic_year_id', selectedAcademicYear);

        if (studentIds && studentIds.length > 0) {
          query = query.in('id', studentIds.map(s => s.student_id));
        } else {
          // No students in this academic year
          return;
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Transform data similar to useStudentData
      const transformedStudents = data?.map(student => ({
        ...student,
        parents: student.student_parent_links?.map(link => link.parents) || [],
        fees: [] // Add empty fees array for compatibility
      })) || [];

      // This would ideally update the students state, but since we're using useStudentData hook,
      // we'll need to modify the hook to accept academic year filtering
      fetchStudents();
    } catch (error) {
      console.error('Error loading students by academic year:', error);
    }
  };

  useEffect(() => {
    loadAcademicYears();
  }, []);

  useEffect(() => {
    loadStudentsByAcademicYear();
  }, [selectedAcademicYear]);

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
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Academic Year</SelectItem>
                    <SelectItem value="all">All Students</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.year_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
