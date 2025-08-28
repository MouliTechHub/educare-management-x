
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Calendar, Users, GraduationCap, ArrowLeftRight, UserX } from "lucide-react";
import { Student } from "@/types/database";
import { useStudentData } from "./student-management/useStudentData";
import { useStatusBasedStudents } from "./student-management/hooks/useStatusBasedStudents";
import { StudentForm } from "./student-management/StudentForm";
import { StudentTable } from "./student-management/StudentTable";
import { StatusBasedStudentsTable } from "./student-management/StatusBasedStudentsTable";
import { StudentStatusDialog } from "./student-management/StudentStatusDialog";
import { StudentDetailsDialog } from "./student-management/StudentDetailsDialog";
import { StudentWithStatus } from "./student-management/utils/statusBasedStudentFetcher";
import { supabase } from "@/integrations/supabase/client";

interface StudentManagementProps {
  onNavigateToParent?: (parentId: string) => void;
}

export function StudentManagement({ onNavigateToParent }: StudentManagementProps) {
  console.log('StudentManagement component loaded successfully');
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("current");
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("active");
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedStudentForStatus, setSelectedStudentForStatus] = useState<Student | null>(null);
  const [selectedStudentForDetails, setSelectedStudentForDetails] = useState<StudentWithStatus | null>(null);

  const { students, classes, loading, fetchStudents } = useStudentData();
  const { 
    students: inactiveStudents, 
    loading: inactiveLoading, 
    refreshStudents: refreshInactiveStudents, 
    reactivateStudent 
  } = useStatusBasedStudents('Inactive');
  const { 
    students: alumniStudents, 
    loading: alumniLoading, 
    refreshStudents: refreshAlumniStudents,
    reactivateStudent: reactivateAlumni 
  } = useStatusBasedStudents('Alumni');
  const { 
    students: transferredStudents, 
    loading: transferredLoading, 
    refreshStudents: refreshTransferredStudents,
    reactivateStudent: reactivateTransferred 
  } = useStatusBasedStudents('Transferred');
  const { 
    students: withdrawnStudents, 
    loading: withdrawnLoading, 
    refreshStudents: refreshWithdrawnStudents,
    reactivateStudent: reactivateWithdrawn 
  } = useStatusBasedStudents('Withdrawn');

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
    refreshInactiveStudents();
    refreshAlumniStudents();
    refreshTransferredStudents();
    refreshWithdrawnStudents();
    setSelectedStudent(null);
  };

  const handleViewParent = (parentId: string) => {
    if (onNavigateToParent) {
      onNavigateToParent(parentId);
    }
  };

  const handleChangeStatus = (student: Student) => {
    setSelectedStudentForStatus(student);
    setStatusDialogOpen(true);
  };

  const handleStatusChanged = () => {
    fetchStudents(); // Refresh active students
    refreshInactiveStudents();
    refreshAlumniStudents();
    refreshTransferredStudents();
    refreshWithdrawnStudents();
  };

  const handleReactivateStudent = async (id: string, status: string) => {
    switch (status) {
      case 'Inactive':
        await reactivateStudent(id);
        break;
      case 'Alumni':
        await reactivateAlumni(id);
        break;
      case 'Transferred':
        await reactivateTransferred(id);
        break;
      case 'Withdrawn':
        await reactivateWithdrawn(id);
        break;
    }
    fetchStudents(); // Refresh active students
  };

  const handleViewStudent = (student: StudentWithStatus) => {
    setSelectedStudentForDetails(student);
    setDetailsDialogOpen(true);
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

  useEffect(() => {
    loadAcademicYears();
  }, []);

  const filteredStudents = students.filter((student) =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredInactiveStudents = inactiveStudents.filter((student) =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAlumniStudents = alumniStudents.filter((student) =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTransferredStudents = transferredStudents.filter((student) =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredWithdrawnStudents = withdrawnStudents.filter((student) =>
    `${student.first_name} ${student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Student Management</h1>
          <p className="text-muted-foreground mt-2">Manage student enrollment and information</p>
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
              <CardTitle>Student Management</CardTitle>
              <CardDescription>Manage students by status and lifecycle</CardDescription>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
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
                <Search className="w-4 h-4 text-muted-foreground" />
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
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-5 mb-6">
              <TabsTrigger value="active" className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                Active ({students.length})
              </TabsTrigger>
              <TabsTrigger value="inactive" className="flex items-center gap-1">
                <UserX className="h-4 w-4" />
                Inactive ({inactiveStudents.length})
              </TabsTrigger>
              <TabsTrigger value="alumni" className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                Alumni ({alumniStudents.length})
              </TabsTrigger>
              <TabsTrigger value="transferred" className="flex items-center gap-1">
                <ArrowLeftRight className="h-4 w-4" />
                Transferred ({transferredStudents.length})
              </TabsTrigger>
              <TabsTrigger value="withdrawn" className="flex items-center gap-1">
                <UserX className="h-4 w-4" />
                Withdrawn ({withdrawnStudents.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="active" className="space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <StudentTable
                  students={filteredStudents}
                  onEditStudent={openEditDialog}
                  onChangeStatus={handleChangeStatus}
                  onViewParent={handleViewParent}
                />
              )}
            </TabsContent>
            
            <TabsContent value="inactive" className="space-y-4">
              {inactiveLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <StatusBasedStudentsTable
                  students={filteredInactiveStudents}
                  onReactivateStudent={(id) => handleReactivateStudent(id, 'Inactive')}
                  onViewStudent={handleViewStudent}
                />
              )}
            </TabsContent>

            <TabsContent value="alumni" className="space-y-4">
              {alumniLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <StatusBasedStudentsTable
                  students={filteredAlumniStudents}
                  onReactivateStudent={(id) => handleReactivateStudent(id, 'Alumni')}
                  onViewStudent={handleViewStudent}
                  showReactivateButton={false}
                />
              )}
            </TabsContent>

            <TabsContent value="transferred" className="space-y-4">
              {transferredLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <StatusBasedStudentsTable
                  students={filteredTransferredStudents}
                  onReactivateStudent={(id) => handleReactivateStudent(id, 'Transferred')}
                  onViewStudent={handleViewStudent}
                />
              )}
            </TabsContent>

            <TabsContent value="withdrawn" className="space-y-4">
              {withdrawnLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : (
                <StatusBasedStudentsTable
                  students={filteredWithdrawnStudents}
                  onReactivateStudent={(id) => handleReactivateStudent(id, 'Withdrawn')}
                  onViewStudent={handleViewStudent}
                />
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <StudentStatusDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        student={selectedStudentForStatus}
        onStatusChanged={handleStatusChanged}
      />

      <StudentDetailsDialog
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
        student={selectedStudentForDetails}
      />
    </div>
  );
}
