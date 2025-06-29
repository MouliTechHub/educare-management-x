import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit, Trash2, UserCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Teacher, Subject } from "@/types/database";
import { useForm } from "react-hook-form";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { validateAndFormatPhoneNumber } from "@/components/modules/student-management/utils/phoneValidation";

interface TeacherFormData {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  hire_date: string;
  status: string;
  employee_id?: string;
  department?: string;
  designation?: string;
  qualification?: string;
  experience_years?: number;
  salary?: number;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  pin_code?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relation?: string;
}

export function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [phoneError, setPhoneError] = useState<string>('');
  const [emergencyPhoneError, setEmergencyPhoneError] = useState<string>('');
  const { toast } = useToast();

  const form = useForm<TeacherFormData>({
    defaultValues: {
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      hire_date: new Date().toISOString().split('T')[0],
      status: "Active",
      employee_id: "",
      department: "",
      designation: "",
      qualification: "",
      experience_years: undefined,
      salary: undefined,
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
      emergency_contact_name: "",
      emergency_contact_phone: "",
      emergency_contact_relation: "",
    },
  });

  useEffect(() => {
    fetchTeachers();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from("teachers")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Type cast the status field to match our enum
      const typedTeachers = (data || []).map(teacher => ({
        ...teacher,
        status: teacher.status as 'Active' | 'On Leave' | 'Retired'
      }));
      
      setTeachers(typedTeachers);
    } catch (error: any) {
      toast({
        title: "Error fetching teachers",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handlePhoneChange = (value: string, field: 'phone_number' | 'emergency_contact_phone') => {
    form.setValue(field, value);
    // Clear error when user starts typing
    if (field === 'phone_number' && phoneError) setPhoneError('');
    if (field === 'emergency_contact_phone' && emergencyPhoneError) setEmergencyPhoneError('');
  };

  const handlePhoneBlur = (value: string, field: 'phone_number' | 'emergency_contact_phone') => {
    if (!value.trim()) {
      if (field === 'phone_number') {
        setPhoneError('Phone number is required');
      } else {
        setEmergencyPhoneError(''); // Emergency phone is optional
      }
      return;
    }

    console.log(`Validating teacher ${field}:`, value);
    const phoneValidation = validateAndFormatPhoneNumber(value);
    console.log(`Teacher ${field} validation result:`, phoneValidation);
    
    if (!phoneValidation.isValid) {
      if (field === 'phone_number') {
        setPhoneError(phoneValidation.error || 'Invalid phone number format');
      } else {
        setEmergencyPhoneError(phoneValidation.error || 'Invalid phone number format');
      }
    } else {
      form.setValue(field, phoneValidation.formatted);
      if (field === 'phone_number') {
        setPhoneError('');
      } else {
        setEmergencyPhoneError('');
      }
    }
  };

  const onSubmit = async (data: TeacherFormData) => {
    // Validate phone numbers before submission
    if (data.phone_number) {
      const phoneValidation = validateAndFormatPhoneNumber(data.phone_number);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || 'Invalid phone number format');
        return;
      }
      data.phone_number = phoneValidation.formatted;
    }

    if (data.emergency_contact_phone) {
      const emergencyPhoneValidation = validateAndFormatPhoneNumber(data.emergency_contact_phone);
      if (!emergencyPhoneValidation.isValid) {
        setEmergencyPhoneError(emergencyPhoneValidation.error || 'Invalid phone number format');
        return;
      }
      data.emergency_contact_phone = emergencyPhoneValidation.formatted;
    }

    try {
      // Convert empty strings to null for optional fields
      const cleanedData = {
        ...data,
        employee_id: data.employee_id || null,
        department: data.department || null,
        designation: data.designation || null,
        qualification: data.qualification || null,
        experience_years: data.experience_years || null,
        salary: data.salary || null,
        address_line1: data.address_line1 || null,
        address_line2: data.address_line2 || null,
        city: data.city || null,
        state: data.state || null,
        pin_code: data.pin_code || null,
        emergency_contact_name: data.emergency_contact_name || null,
        emergency_contact_phone: data.emergency_contact_phone || null,
        emergency_contact_relation: data.emergency_contact_relation || null,
      };

      if (selectedTeacher) {
        const { error } = await supabase
          .from("teachers")
          .update(cleanedData)
          .eq("id", selectedTeacher.id);

        if (error) throw error;
        toast({ title: "Teacher updated successfully" });
      } else {
        const { error } = await supabase
          .from("teachers")
          .insert([cleanedData]);

        if (error) throw error;
        toast({ title: "Teacher created successfully" });
      }

      fetchTeachers();
      setDialogOpen(false);
      setSelectedTeacher(null);
      form.reset();
      setPhoneError('');
      setEmergencyPhoneError('');
    } catch (error: any) {
      console.error("Error saving teacher:", error);
      
      // Handle phone number constraint violations
      if (error.message?.includes('phone_number_check')) {
        setPhoneError('Phone number must be in format +91XXXXXXXXXX');
      } else if (error.message?.includes('emergency_contact_phone_check')) {
        setEmergencyPhoneError('Emergency contact phone must be in format +91XXXXXXXXXX');
      } else {
        toast({
          title: "Error saving teacher",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  };

  const deleteTeacher = async (id: string) => {
    // Check if teacher is assigned as homeroom teacher to any classes
    try {
      const { data: classes, error: checkError } = await supabase
        .from("classes")
        .select("name, section")
        .eq("homeroom_teacher_id", id);

      if (checkError) throw checkError;

      let confirmMessage = "Are you sure you want to delete this teacher?";
      if (classes && classes.length > 0) {
        const classNames = classes.map(c => `${c.name}${c.section ? ` - ${c.section}` : ''}`).join(', ');
        confirmMessage = `This teacher is currently assigned as homeroom teacher for: ${classNames}. Deleting will remove them from these classes. Are you sure you want to continue?`;
      }

      if (!confirm(confirmMessage)) return;

      // Remove teacher from homeroom assignments first
      if (classes && classes.length > 0) {
        const { error: updateError } = await supabase
          .from("classes")
          .update({ homeroom_teacher_id: null })
          .eq("homeroom_teacher_id", id);

        if (updateError) throw updateError;
      }

      // Then delete the teacher
      const { error } = await supabase
        .from("teachers")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Teacher deleted successfully" });
      fetchTeachers();
    } catch (error: any) {
      toast({
        title: "Error deleting teacher",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    form.reset({
      first_name: teacher.first_name,
      last_name: teacher.last_name,
      email: teacher.email,
      phone_number: teacher.phone_number,
      hire_date: teacher.hire_date,
      status: teacher.status,
      employee_id: teacher.employee_id || "",
      department: teacher.department || "",
      designation: teacher.designation || "",
      qualification: teacher.qualification || "",
      experience_years: teacher.experience_years || undefined,
      salary: teacher.salary || undefined,
      address_line1: teacher.address_line1 || "",
      address_line2: teacher.address_line2 || "",
      city: teacher.city || "",
      state: teacher.state || "",
      pin_code: teacher.pin_code || "",
      emergency_contact_name: teacher.emergency_contact_name || "",
      emergency_contact_phone: teacher.emergency_contact_phone || "",
      emergency_contact_relation: teacher.emergency_contact_relation || "",
    });
    setPhoneError('');
    setEmergencyPhoneError('');
    setDialogOpen(true);
  };

  const filteredTeachers = teachers.filter((teacher) =>
    `${teacher.first_name} ${teacher.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (teacher.employee_id && teacher.employee_id.toLowerCase().includes(searchTerm.toLowerCase()))
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
            <Button onClick={() => {
              setSelectedTeacher(null);
              form.reset();
              setPhoneError('');
              setEmergencyPhoneError('');
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedTeacher ? "Edit Teacher" : "Add New Teacher"}</DialogTitle>
              <DialogDescription>
                {selectedTeacher ? "Update teacher information" : "Enter teacher details to add to the system"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Basic Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="first_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name *</FormLabel>
                          <FormControl>
                            <Input {...field} required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="last_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name *</FormLabel>
                          <FormControl>
                            <Input {...field} required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="employee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Employee ID</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email *</FormLabel>
                          <FormControl>
                            <Input {...field} type="email" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone_number"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              required 
                              placeholder="Enter 10-digit number or +91XXXXXXXXXX"
                              maxLength={15}
                              onChange={(e) => handlePhoneChange(e.target.value, 'phone_number')}
                              onBlur={(e) => handlePhoneBlur(e.target.value, 'phone_number')}
                            />
                          </FormControl>
                          {phoneError && (
                            <p className="text-xs text-destructive mt-1">{phoneError}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters)</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="hire_date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hire Date *</FormLabel>
                          <FormControl>
                            <Input {...field} type="date" required />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Professional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Department</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="designation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="qualification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualification</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="experience_years"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience (Years)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="salary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Salary</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="On Leave">On Leave</SelectItem>
                              <SelectItem value="Retired">Retired</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Address Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Address Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="address_line1"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 1</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address_line2"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address Line 2</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="pin_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PIN Code</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="emergency_contact_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Emergency Contact Phone</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              placeholder="Enter 10-digit number or +91XXXXXXXXXX (optional)"
                              maxLength={15}
                              onChange={(e) => handlePhoneChange(e.target.value, 'emergency_contact_phone')}
                              onBlur={(e) => handlePhoneBlur(e.target.value, 'emergency_contact_phone')}
                            />
                          </FormControl>
                          {emergencyPhoneError && (
                            <p className="text-xs text-destructive mt-1">{emergencyPhoneError}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters, optional)</p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="emergency_contact_relation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Relation</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="e.g., Spouse, Parent" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedTeacher ? "Update" : "Create"} Teacher
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

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
                placeholder="Search teachers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Employee ID</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Designation</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTeachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <UserCheck className="w-4 h-4 text-green-600" />
                      <span className="font-medium">{teacher.first_name} {teacher.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{teacher.employee_id || "N/A"}</TableCell>
                  <TableCell>{teacher.email}</TableCell>
                  <TableCell>{teacher.phone_number}</TableCell>
                  <TableCell>{teacher.department || "N/A"}</TableCell>
                  <TableCell>{teacher.designation || "N/A"}</TableCell>
                  <TableCell>
                    <Badge variant={teacher.status === "Active" ? "default" : "secondary"}>
                      {teacher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(teacher)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteTeacher(teacher.id)}
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
