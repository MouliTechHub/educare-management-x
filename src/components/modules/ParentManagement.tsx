
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Plus, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Parent {
  id: string;
  first_name: string;
  last_name: string;
  relation: "Mother" | "Father" | "Guardian" | "Other";
  phone_number: string;
  email: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
}

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  admission_number: string;
}

export function ParentManagement() {
  const [parents, setParents] = useState<Parent[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentParent, setCurrentParent] = useState<Partial<Parent>>({});
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchParents();
    fetchStudents();
  }, []);

  const fetchParents = async () => {
    try {
      const { data, error } = await supabase
        .from('parents')
        .select('*')
        .order('first_name');

      if (error) throw error;
      setParents(data || []);
    } catch (error) {
      console.error('Error fetching parents:', error);
      toast({
        title: "Error",
        description: "Failed to fetch parents.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, first_name, last_name, admission_number')
        .eq('status', 'Active')
        .order('admission_number');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const fetchParentStudents = async (parentId: string) => {
    try {
      const { data, error } = await supabase
        .from('student_parent_links')
        .select('student_id')
        .eq('parent_id', parentId);

      if (error) throw error;
      return data?.map(link => link.student_id) || [];
    } catch (error) {
      console.error('Error fetching parent students:', error);
      return [];
    }
  };

  const filteredParents = parents.filter(
    (parent) =>
      parent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      parent.phone_number.includes(searchTerm)
  );

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePhone = (phone: string) => {
    return /^\d{10}$/.test(phone);
  };

  const handleSaveParent = async () => {
    if (!currentParent.first_name || !currentParent.last_name || !currentParent.relation || !currentParent.phone_number || !currentParent.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    if (!validateEmail(currentParent.email)) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    if (!validatePhone(currentParent.phone_number)) {
      toast({
        title: "Validation Error",
        description: "Phone number must be exactly 10 digits.",
        variant: "destructive",
      });
      return;
    }

    if (currentParent.pin_code && (currentParent.pin_code.length !== 6 || !/^\d+$/.test(currentParent.pin_code))) {
      toast({
        title: "Validation Error",
        description: "Pin code must be exactly 6 digits.",
        variant: "destructive",
      });
      return;
    }

    try {
      let parentId = currentParent.id;

      if (isEditing) {
        const { error } = await supabase
          .from('parents')
          .update({
            first_name: currentParent.first_name,
            last_name: currentParent.last_name,
            relation: currentParent.relation,
            phone_number: currentParent.phone_number,
            email: currentParent.email,
            address_line1: currentParent.address_line1 || null,
            address_line2: currentParent.address_line2 || null,
            city: currentParent.city || null,
            state: currentParent.state || null,
            pin_code: currentParent.pin_code || null,
          })
          .eq('id', currentParent.id);

        if (error) throw error;

        // Delete existing student links
        await supabase
          .from('student_parent_links')
          .delete()
          .eq('parent_id', parentId);
      } else {
        // Check if email already exists
        const { data: existingParent } = await supabase
          .from('parents')
          .select('id')
          .eq('email', currentParent.email)
          .single();

        if (existingParent) {
          toast({
            title: "Validation Error",
            description: "Email already exists.",
            variant: "destructive",
          });
          return;
        }

        const { data, error } = await supabase
          .from('parents')
          .insert({
            first_name: currentParent.first_name,
            last_name: currentParent.last_name,
            relation: currentParent.relation,
            phone_number: currentParent.phone_number,
            email: currentParent.email,
            address_line1: currentParent.address_line1 || null,
            address_line2: currentParent.address_line2 || null,
            city: currentParent.city || null,
            state: currentParent.state || null,
            pin_code: currentParent.pin_code || null,
          })
          .select()
          .single();

        if (error) throw error;
        parentId = data.id;
      }

      // Insert new student links
      if (selectedStudents.length > 0) {
        const links = selectedStudents.map(studentId => ({
          parent_id: parentId,
          student_id: studentId,
        }));

        const { error: linkError } = await supabase
          .from('student_parent_links')
          .insert(links);

        if (linkError) throw linkError;
      }

      toast({
        title: "Success",
        description: `Parent ${currentParent.first_name} ${currentParent.last_name} ${isEditing ? 'updated' : 'created'} successfully.`,
      });

      setIsAddModalOpen(false);
      setCurrentParent({});
      setSelectedStudents([]);
      setIsEditing(false);
      fetchParents();
    } catch (error: any) {
      console.error('Error saving parent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save parent.",
        variant: "destructive",
      });
    }
  };

  const handleEditParent = async (parent: Parent) => {
    setCurrentParent(parent);
    setIsEditing(true);
    
    // Fetch linked students
    const linkedStudents = await fetchParentStudents(parent.id);
    setSelectedStudents(linkedStudents);
    
    setIsAddModalOpen(true);
  };

  const handleDeleteParent = async (parentId: string) => {
    try {
      const { error } = await supabase
        .from('parents')
        .delete()
        .eq('id', parentId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Parent deleted successfully.",
      });
      fetchParents();
    } catch (error: any) {
      console.error('Error deleting parent:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete parent.",
        variant: "destructive",
      });
    }
  };

  const openAddModal = () => {
    setCurrentParent({
      first_name: "",
      last_name: "",
      relation: "Mother",
      phone_number: "",
      email: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
    });
    setSelectedStudents([]);
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
          <h1 className="text-3xl font-bold text-gray-900">Parent Management</h1>
          <p className="text-gray-600 mt-2">Manage parent records and student relationships</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={openAddModal} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{isEditing ? "Edit Parent" : "Add New Parent"}</DialogTitle>
              <DialogDescription>
                {isEditing ? "Update parent information" : "Enter parent details below"}
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name*</Label>
                <Input
                  id="firstName"
                  placeholder="Enter first name"
                  value={currentParent.first_name || ""}
                  onChange={(e) => setCurrentParent({...currentParent, first_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name*</Label>
                <Input
                  id="lastName"
                  placeholder="Enter last name"
                  value={currentParent.last_name || ""}
                  onChange={(e) => setCurrentParent({...currentParent, last_name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relation">Relation*</Label>
                <Select
                  value={currentParent.relation}
                  onValueChange={(value) => setCurrentParent({...currentParent, relation: value as "Mother" | "Father" | "Guardian" | "Other"})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select relation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mother">Mother</SelectItem>
                    <SelectItem value="Father">Father</SelectItem>
                    <SelectItem value="Guardian">Guardian</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number*</Label>
                <Input
                  id="phone"
                  placeholder="10-digit phone number"
                  value={currentParent.phone_number || ""}
                  onChange={(e) => setCurrentParent({...currentParent, phone_number: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="email">Email*</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={currentParent.email || ""}
                  onChange={(e) => setCurrentParent({...currentParent, email: e.target.value})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  placeholder="Enter address line 1"
                  value={currentParent.address_line1 || ""}
                  onChange={(e) => setCurrentParent({
                    ...currentParent,
                    address_line1: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  placeholder="Enter city"
                  value={currentParent.city || ""}
                  onChange={(e) => setCurrentParent({
                    ...currentParent,
                    city: e.target.value
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="pinCode">Pin Code</Label>
                <Input
                  id="pinCode"
                  placeholder="Enter 6-digit pin code"
                  value={currentParent.pin_code || ""}
                  onChange={(e) => setCurrentParent({
                    ...currentParent,
                    pin_code: e.target.value
                  })}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Linked Students</Label>
                <div className="max-h-32 overflow-y-auto border rounded p-2">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`student-${student.id}`}
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedStudents([...selectedStudents, student.id]);
                          } else {
                            setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                          }
                        }}
                      />
                      <label htmlFor={`student-${student.id}`} className="text-sm">
                        {student.admission_number} - {student.first_name} {student.last_name}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveParent}>
                {isEditing ? "Update" : "Save"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parent Records</CardTitle>
          <CardDescription>
            View and manage all parent information
          </CardDescription>
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search by name or phone number..."
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
                <TableHead>Name</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParents.map((parent) => (
                <TableRow key={parent.id}>
                  <TableCell className="font-medium">
                    {parent.first_name} {parent.last_name}
                  </TableCell>
                  <TableCell>{parent.relation}</TableCell>
                  <TableCell>{parent.phone_number}</TableCell>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditParent(parent)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteParent(parent.id)}
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
