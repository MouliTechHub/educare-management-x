import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, User, GraduationCap, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Parent } from "@/types/database";

interface ParentManagementProps {
  onNavigateToStudent?: (studentId: string) => void;
  highlightedParentId?: string;
}

export function ParentManagement({ onNavigateToStudent, highlightedParentId }: ParentManagementProps) {
  const [parents, setParents] = useState<Parent[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingParent, setEditingParent] = useState<Parent | null>(null);
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    relation: "" as "Mother" | "Father" | "Guardian" | "Other" | "",
    phone_number: "",
    email: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pin_code: "",
    occupation: "",
    annual_income: "",
    employer_name: "",
    employer_address: "",
    alternate_phone: "",
    aadhaar_number: "",
    pan_number: "",
    education_qualification: "",
  });

  useEffect(() => {
    fetchParents();
  }, []);

  const fetchParents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('parents')
        .select(`
          *,
          aadhaar_number,
          pan_number,
          education_qualification,
          student_parent_links(
            students(
              id,
              first_name,
              last_name,
              admission_number
            )
          )
        `)
        .order('first_name');

      if (error) throw error;
      
      // Transform the data to include students array and ensure all required fields
      const parentsWithStudents = (data || []).map(parent => ({
        ...parent,
        relation: parent.relation as 'Mother' | 'Father' | 'Guardian' | 'Other',
        aadhaar_number: parent.aadhaar_number || null,
        pan_number: parent.pan_number || null,
        education_qualification: parent.education_qualification || null,
        students: parent.student_parent_links?.map(link => link.students).filter(Boolean) || []
      }));
      
      setParents(parentsWithStudents);
    } catch (error: any) {
      toast({
        title: "Error fetching parents",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStudentClick = (studentId: string, studentName: string) => {
    if (onNavigateToStudent) {
      console.log(`Navigating to student: ${studentName} (${studentId})`);
      onNavigateToStudent(studentId);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.first_name || !formData.last_name || !formData.relation || 
        !formData.phone_number || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number format
    if (!/^\+91[6-9][0-9]{9}$/.test(formData.phone_number)) {
      toast({
        title: "Validation Error", 
        description: "Phone number must be in format +91XXXXXXXXXX and start with 6, 7, 8, or 9",
        variant: "destructive",
      });
      return;
    }

    // Validate PIN code if provided
    if (formData.pin_code && !/^\d{6}$/.test(formData.pin_code)) {
      toast({
        title: "Validation Error",
        description: "PIN code must be 6 digits",
        variant: "destructive",
      });
      return;
    }

    // Validate Aadhaar if provided
    if (formData.aadhaar_number && !/^\d{12}$/.test(formData.aadhaar_number)) {
      toast({
        title: "Validation Error",
        description: "Aadhaar number must be 12 digits",
        variant: "destructive",
      });
      return;
    }

    // Validate PAN if provided
    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number)) {
      toast({
        title: "Validation Error",
        description: "PAN must be in format ABCDE1234F",
        variant: "destructive",
      });
      return;
    }

    try {
      const parentData = {
        ...formData,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        pin_code: formData.pin_code || null,
        occupation: formData.occupation || null,
        annual_income: formData.annual_income ? parseFloat(formData.annual_income) : null,
        employer_name: formData.employer_name || null,
        employer_address: formData.employer_address || null,
        alternate_phone: formData.alternate_phone || null,
        aadhaar_number: formData.aadhaar_number || null,
        pan_number: formData.pan_number || null,
        education_qualification: formData.education_qualification || null,
      };

      if (editingParent) {
        const { error } = await supabase
          .from('parents')
          .update(parentData)
          .eq('id', editingParent.id);

        if (error) throw error;
        
        toast({
          title: "Parent Updated",
          description: `${formData.first_name} ${formData.last_name} has been updated successfully.`,
        });
      } else {
        const { error } = await supabase
          .from('parents')
          .insert(parentData);

        if (error) throw error;
        
        toast({
          title: "Parent Added",
          description: `${formData.first_name} ${formData.last_name} has been added successfully.`,
        });
      }

      setDialogOpen(false);
      resetForm();
      fetchParents();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleEdit = (parent: Parent) => {
    setEditingParent(parent);
    setFormData({
      first_name: parent.first_name,
      last_name: parent.last_name,
      relation: parent.relation,
      phone_number: parent.phone_number,
      email: parent.email,
      address_line1: parent.address_line1 || "",
      address_line2: parent.address_line2 || "",
      city: parent.city || "",
      state: parent.state || "",
      pin_code: parent.pin_code || "",
      occupation: parent.occupation || "",
      annual_income: parent.annual_income?.toString() || "",
      employer_name: parent.employer_name || "",
      employer_address: parent.employer_address || "",
      alternate_phone: parent.alternate_phone || "",
      aadhaar_number: parent.aadhaar_number || "",
      pan_number: parent.pan_number || "",
      education_qualification: parent.education_qualification || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = async (parent: Parent) => {
    if (!confirm(`Are you sure you want to delete ${parent.first_name} ${parent.last_name}?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('parents')
        .delete()
        .eq('id', parent.id);

      if (error) throw error;
      
      toast({
        title: "Parent Deleted",
        description: `${parent.first_name} ${parent.last_name} has been deleted.`,
      });
      
      fetchParents();
    } catch (error: any) {
      toast({
        title: "Error deleting parent",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      first_name: "",
      last_name: "",
      relation: "",
      phone_number: "",
      email: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
      occupation: "",
      annual_income: "",
      employer_name: "",
      employer_address: "",
      alternate_phone: "",
      aadhaar_number: "",
      pan_number: "",
      education_qualification: "",
    });
    setEditingParent(null);
  };

  const filteredParents = parents.filter(parent =>
    parent.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    parent.phone_number.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading parents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Parent Management</h2>
          <p className="text-gray-600">Manage parent records and contact information</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              Add Parent
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingParent ? "Edit Parent" : "Add New Parent"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name *</Label>
                    <Input
                      id="first_name"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name *</Label>
                    <Input
                      id="last_name"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="relation">Relation *</Label>
                    <Select value={formData.relation} onValueChange={(value: "Mother" | "Father" | "Guardian" | "Other") => setFormData({ ...formData, relation: value })}>
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
                  <div>
                    <Label htmlFor="phone_number">Phone Number *</Label>
                    <Input
                      id="phone_number"
                      value={formData.phone_number}
                      onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                      placeholder="+91XXXXXXXXXX"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="alternate_phone">Alternate Phone</Label>
                    <Input
                      id="alternate_phone"
                      value={formData.alternate_phone}
                      onChange={(e) => setFormData({ ...formData, alternate_phone: e.target.value })}
                      placeholder="+91XXXXXXXXXX"
                    />
                  </div>
                </div>
              </div>

              {/* Indian Specific Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Indian Specific Information</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
                    <Input
                      id="aadhaar_number"
                      value={formData.aadhaar_number}
                      onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value.replace(/\D/g, '').slice(0, 12) })}
                      placeholder="XXXXXXXXXXXX"
                      maxLength={12}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pan_number">PAN Number</Label>
                    <Input
                      id="pan_number"
                      value={formData.pan_number}
                      onChange={(e) => setFormData({ ...formData, pan_number: e.target.value.toUpperCase().slice(0, 10) })}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                    />
                  </div>
                  <div>
                    <Label htmlFor="education_qualification">Education Qualification</Label>
                    <Input
                      id="education_qualification"
                      value={formData.education_qualification}
                      onChange={(e) => setFormData({ ...formData, education_qualification: e.target.value })}
                      placeholder="e.g., B.A., M.Com, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Professional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Professional Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="occupation">Occupation</Label>
                    <Input
                      id="occupation"
                      value={formData.occupation}
                      onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="annual_income">Annual Income</Label>
                    <Input
                      id="annual_income"
                      type="number"
                      value={formData.annual_income}
                      onChange={(e) => setFormData({ ...formData, annual_income: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="employer_name">Employer Name</Label>
                    <Input
                      id="employer_name"
                      value={formData.employer_name}
                      onChange={(e) => setFormData({ ...formData, employer_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="employer_address">Employer Address</Label>
                    <Textarea
                      id="employer_address"
                      value={formData.employer_address}
                      onChange={(e) => setFormData({ ...formData, employer_address: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="address_line1">Address Line 1</Label>
                    <Input
                      id="address_line1"
                      value={formData.address_line1}
                      onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="address_line2">Address Line 2</Label>
                    <Input
                      id="address_line2"
                      value={formData.address_line2}
                      onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="pin_code">PIN Code</Label>
                    <Input
                      id="pin_code"
                      value={formData.pin_code}
                      onChange={(e) => setFormData({ ...formData, pin_code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                      placeholder="XXXXXX"
                      maxLength={6}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingParent ? "Update Parent" : "Add Parent"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Parents</CardTitle>
          <CardDescription>
            Total Parents: {parents.length}
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
                <TableHead>Occupation</TableHead>
                <TableHead>Students</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParents.map((parent) => (
                <TableRow 
                  key={parent.id}
                  className={highlightedParentId === parent.id ? "bg-blue-50 border-blue-200" : ""}
                >
                  <TableCell className="font-medium">{parent.first_name} {parent.last_name}</TableCell>
                  <TableCell>{parent.relation}</TableCell>
                  <TableCell>{parent.phone_number}</TableCell>
                  <TableCell>{parent.email}</TableCell>
                  <TableCell>{parent.occupation || "N/A"}</TableCell>
                  <TableCell>
                    {parent.students && parent.students.length > 0 ? (
                      <div className="space-y-1">
                        {parent.students.map((student, index) => (
                          <div key={student.id} className="flex items-center space-x-1 text-sm">
                            <GraduationCap className="w-3 h-3 text-blue-600" />
                            <button
                              onClick={() => handleStudentClick(student.id, `${student.first_name} ${student.last_name}`)}
                              className="font-medium text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1"
                            >
                              <span>{student.first_name} {student.last_name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                            <span className="text-gray-500">({student.admission_number})</span>
                            {index < parent.students!.length - 1 && <span className="text-gray-300">|</span>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-400 flex items-center space-x-1">
                        <User className="w-3 h-3" />
                        <span>No students linked</span>
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline" onClick={() => handleEdit(parent)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(parent)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {filteredParents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No parents found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
