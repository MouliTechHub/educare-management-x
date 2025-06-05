
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: "Male" | "Female" | "Other";
  class_id?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  photo_url?: string;
  status: "Active" | "Inactive" | "Alumni";
  classes?: { name: string; section?: string };
}

interface Class {
  id: string;
  name: string;
  section?: string;
}

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select(`
          *,
          classes (
            name,
            section
          )
        `)
        .order('admission_number');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
      toast({
        title: "Error",
        description: "Failed to fetch students.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('id, name, section')
        .order('name');

      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const filteredStudents = students.filter(
    (student) =>
      student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admission_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveStudent = async () => {
    if (!currentStudent.first_name || !currentStudent.last_name || !currentStudent.admission_number || !currentStudent.date_of_birth || !currentStudent.gender) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (currentStudent.pin_code && (currentStudent.pin_code.length !== 6 || !/^\d+$/.test(currentStudent.pin_code))) {
      toast({
        title: "Validation Error",
        description: "Pin code must be exactly 6 digits.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditing) {
        const { error } = await supabase
          .from('students')
          .update({
            first_name: currentStudent.first_name,
            last_name: currentStudent.last_name,
            admission_number: currentStudent.admission_number,
            date_of_birth: currentStudent.date_of_birth,
            gender: currentStudent.gender,
            class_id: currentStudent.class_id || null,
            address_line1: currentStudent.address_line1 || null,
            address_line2: currentStudent.address_line2 || null,
            city: currentStudent.city || null,
            state: currentStudent.state || null,
            pin_code: currentStudent.pin_code || null,
            status: currentStudent.status,
          })
          .eq('id', currentStudent.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: `Student ${currentStudent.first_name} ${currentStudent.last_name} updated successfully.`,
        });
      } else {
        // Check if admission number already exists
        const { data: existingStudent } = await supabase
          .from('students')
          .select('id')
          .eq('admission_number', currentStudent.admission_number)
          .single();

        if (existingStudent) {
          toast({
            title: "Validation Error",
            description: "Admission Number already exists.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase
          .from('students')
          .insert({
            first_name: currentStudent.first_name,
            last_name: currentStudent.last_name,
            admission_number: currentStudent.admission_number,
            date_of_birth: currentStudent.date_of_birth,
            gender: currentStudent.gender,
            class_id: currentStudent.class_id || null,
            address_line1: currentStudent.address_line1 || null,
            address_line2: currentStudent.address_line2 || null,
            city: currentStudent.city || null,
            state: currentStudent.state || null,
            pin_code: currentStudent.pin_code || null,
            status: currentStudent.status || 'Active',
          });

        if (error) throw error;

        toast({
          title: "Success",
          description: `Student ${currentStudent.first_name} ${currentStudent.last_name} created successfully.`,
        });
      }

      setIsAddModalOpen(false);
      setCurrentStudent({});
      setIsEditing(false);
      fetchStudents();
    } catch (error: any) {
      console.error('Error saving student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save student.",
        variant: "destructive",
      });
    }
  };

  const handleEditStudent = (student: Student) => {
    setCurrentStudent(student);
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student deleted successfully.",
      });
      fetchStudents();
    } catch (error: any) {
      console.error('Error deleting student:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete student.",
        variant: "destructive",
      });
    }
  };

  const openAddModal = () => {
    setCurrentStudent({
      first_name: "",
      last_name: "",
      admission_number: "",
      date_of_birth: "",
      gender: "Male",
      status: "Active",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
    });
    setIsEditing(false);
    setIsAddModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
          <p className="text-gray-600 mt-2">Manage student records and information</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Student
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Student" : "Add New Student"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update student information" : "Enter student details below"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={currentStudent.first_name || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={currentStudent.last_name || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, last_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number*</Label>
                <Input
                  id="admissionNumber"
                  placeholder="e.g., ADM001"
                  value={currentStudent.admission_number || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, admission_number: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Gender*</Label>
                <Select
                  value={currentStudent.gender}
                  onValueChange={(value) => setCurrentStudent({...currentStudent, gender: value as "Male" | "Female" | "Other"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">Date of Birth*</Label>
                <Input
                  id="dob"
                  type="date"
                  value={currentStudent.date_of_birth || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, date_of_birth: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="class">Class</Label>
                <Select
                  value={currentStudent.class_id || ""}
                  onValueChange={(value) => setCurrentStudent({...currentStudent, class_id: value || undefined})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Class Assigned</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name} {cls.section ? `- ${cls.section}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status*</Label>
                <Select
                  value={currentStudent.status}
                  onValueChange={(value) => setCurrentStudent({...currentStudent, status: value as "Active" | "Inactive" | "Alumni"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Alumni">Alumni</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  placeholder="Enter address line 1"
                  value={currentStudent.address_line1 || ""}
                  onChange={(e) => setCurrentStudent({
                    ...currentStudent,
                    address_line1: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={currentStudent.city || ""}
                  onChange={(e) => setCurrentStudent({
                    ...currentStudent,
                    city: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pinCode">Pin Code (6 digits)</Label>
                <Input
                  id="pinCode"
                  placeholder="Enter 6-digit pin code"
                  value={currentStudent.pin_code || ""}
                  onChange={(e) => setCurrentStudent({
                    ...currentStudent,
                    pin_code: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveStudent}>
                {isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Student Records</CardTitle>
          <CardDescription>
            View and manage all student information
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or admission number..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admission No.</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Class</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">
                    {student.admission_number}
                  </TableCell>
                  <TableCell>
                    {student.first_name} {student.last_name}
                  </TableCell>
                  <TableCell>
                    {student.classes ? `${student.classes.name}${student.classes.section ? ` - ${student.classes.section}` : ''}` : 'Not Assigned'}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={student.status === "Active" ? "default" : "secondary"}
                      className={student.status === "Active" ? "bg-green-100 text-green-800" : ""}
                    >
                      {student.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteStudent(student.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
