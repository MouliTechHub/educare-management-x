
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  admissionNumber: string;
  classId: string;
  className: string;
  status: "Active" | "Inactive" | "Alumni";
  dob: string;
  gender: "Male" | "Female" | "Other";
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    pinCode: string;
  };
}

export function StudentManagement() {
  const [students, setStudents] = useState<Student[]>([
    {
      _id: "1",
      firstName: "John",
      lastName: "Doe",
      admissionNumber: "ADM001",
      classId: "class1",
      className: "Grade 10-A",
      status: "Active",
      dob: "2008-05-15",
      gender: "Male",
      address: {
        line1: "123 Main St",
        line2: "Apt 4B",
        city: "Mumbai",
        state: "Maharashtra",
        pinCode: "400001",
      },
    },
    {
      _id: "2",
      firstName: "Jane",
      lastName: "Smith",
      admissionNumber: "ADM002",
      classId: "class2",
      className: "Grade 9-B",
      status: "Active",
      dob: "2009-03-22",
      gender: "Female",
      address: {
        line1: "456 Oak Ave",
        line2: "",
        city: "Delhi",
        state: "Delhi",
        pinCode: "110001",
      },
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({});
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.admissionNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSaveStudent = () => {
    // Validate required fields
    if (!currentStudent.firstName || !currentStudent.lastName || !currentStudent.admissionNumber) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    // Check if admission number already exists (when adding new)
    if (!isEditing && students.some(s => s.admissionNumber === currentStudent.admissionNumber)) {
      toast({
        title: "Validation Error", 
        description: "Admission Number already exists.",
        variant: "destructive",
      });
      return;
    }

    if (isEditing) {
      setStudents(prev => prev.map(s => s._id === currentStudent._id ? currentStudent as Student : s));
      toast({
        title: "Success",
        description: `Student ${currentStudent.firstName} ${currentStudent.lastName} updated successfully.`,
      });
    } else {
      const newStudent = {
        ...currentStudent,
        _id: Date.now().toString(),
        className: "Grade 10-A", // This would come from class selection
      } as Student;
      setStudents(prev => [...prev, newStudent]);
      toast({
        title: "Success",
        description: `Student ${currentStudent.firstName} ${currentStudent.lastName} created successfully.`,
      });
    }

    setIsAddModalOpen(false);
    setCurrentStudent({});
    setIsEditing(false);
  };

  const handleEditStudent = (student: Student) => {
    setCurrentStudent(student);
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    setStudents(prev => prev.filter(s => s._id !== studentId));
    toast({
      title: "Success",
      description: "Student deleted successfully.",
    });
  };

  const openAddModal = () => {
    setCurrentStudent({
      firstName: "",
      lastName: "",
      admissionNumber: "",
      status: "Active",
      gender: "Male",
      address: {
        line1: "",
        line2: "",
        city: "",
        state: "",
        pinCode: "",
      },
    });
    setIsEditing(false);
    setIsAddModalOpen(true);
  };

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
                  value={currentStudent.firstName || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={currentStudent.lastName || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, lastName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admissionNumber">Admission Number* (unique)</Label>
                <Input
                  id="admissionNumber"
                  placeholder="e.g., ADM001"
                  value={currentStudent.admissionNumber || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, admissionNumber: e.target.value})}
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
                  value={currentStudent.dob || ""}
                  onChange={(e) => setCurrentStudent({...currentStudent, dob: e.target.value})}
                />
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
                <Label htmlFor="addressLine1">Address Line 1*</Label>
                <Input
                  id="addressLine1"
                  placeholder="Enter address line 1"
                  value={currentStudent.address?.line1 || ""}
                  onChange={(e) => setCurrentStudent({
                    ...currentStudent,
                    address: {...currentStudent.address, line1: e.target.value}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City*</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={currentStudent.address?.city || ""}
                  onChange={(e) => setCurrentStudent({
                    ...currentStudent,
                    address: {...currentStudent.address, city: e.target.value}
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pinCode">Pin Code* (6 digits)</Label>
                <Input
                  id="pinCode"
                  placeholder="Enter 6-digit pin code"
                  value={currentStudent.address?.pinCode || ""}
                  onChange={(e) => setCurrentStudent({
                    ...currentStudent,
                    address: {...currentStudent.address, pinCode: e.target.value}
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
                <TableRow key={student._id}>
                  <TableCell className="font-medium">
                    {student.admissionNumber}
                  </TableCell>
                  <TableCell>
                    {student.firstName} {student.lastName}
                  </TableCell>
                  <TableCell>{student.className}</TableCell>
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
                        onClick={() => handleDeleteStudent(student._id)}
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
