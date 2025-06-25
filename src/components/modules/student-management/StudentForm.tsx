
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Student, Class } from "@/types/database";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  classes: Class[];
  onStudentSaved: () => void;
}

interface StudentFormData {
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: string;
  class_id: string;
  blood_group: string;
  religion: string;
  caste_category: string;
  previous_school: string;
  transport_route: string;
  transport_stop: string;
  medical_information: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  emergency_contact_relation: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pin_code: string;
  status: string;
}

const bloodGroups = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
const religions = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"];
const casteCategories = ["General", "OBC", "SC", "ST", "Other"];

export function StudentForm({ open, onOpenChange, selectedStudent, classes, onStudentSaved }: StudentFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<StudentFormData>({
    first_name: "",
    last_name: "",
    admission_number: "",
    date_of_birth: "",
    gender: "",
    class_id: "",
    blood_group: "",
    religion: "",
    caste_category: "",
    previous_school: "",
    transport_route: "",
    transport_stop: "",
    medical_information: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    emergency_contact_relation: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pin_code: "",
    status: "Active",
  });

  useEffect(() => {
    if (selectedStudent) {
      setFormData({
        first_name: selectedStudent.first_name,
        last_name: selectedStudent.last_name,
        admission_number: selectedStudent.admission_number,
        date_of_birth: selectedStudent.date_of_birth,
        gender: selectedStudent.gender,
        class_id: selectedStudent.class_id || "",
        blood_group: selectedStudent.blood_group || "",
        religion: selectedStudent.religion || "",
        caste_category: selectedStudent.caste_category || "",
        previous_school: selectedStudent.previous_school || "",
        transport_route: selectedStudent.transport_route || "",
        transport_stop: selectedStudent.transport_stop || "",
        medical_information: selectedStudent.medical_information || "",
        emergency_contact_name: selectedStudent.emergency_contact_name || "",
        emergency_contact_phone: selectedStudent.emergency_contact_phone || "",
        emergency_contact_relation: selectedStudent.emergency_contact_relation || "",
        address_line1: selectedStudent.address_line1 || "",
        address_line2: selectedStudent.address_line2 || "",
        city: selectedStudent.city || "",
        state: selectedStudent.state || "",
        pin_code: selectedStudent.pin_code || "",
        status: selectedStudent.status,
      });
    } else {
      // Reset form for new student
      setFormData({
        first_name: "",
        last_name: "",
        admission_number: "",
        date_of_birth: "",
        gender: "",
        class_id: "",
        blood_group: "",
        religion: "",
        caste_category: "",
        previous_school: "",
        transport_route: "",
        transport_stop: "",
        medical_information: "",
        emergency_contact_name: "",
        emergency_contact_phone: "",
        emergency_contact_relation: "",
        address_line1: "",
        address_line2: "",
        city: "",
        state: "",
        pin_code: "",
        status: "Active",
      });
    }
  }, [selectedStudent, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data for submission
      const studentData = {
        ...formData,
        class_id: formData.class_id || null,
        blood_group: formData.blood_group || null,
        religion: formData.religion || null,
        caste_category: formData.caste_category || null,
        previous_school: formData.previous_school || null,
        transport_route: formData.transport_route || null,
        transport_stop: formData.transport_stop || null,
        medical_information: formData.medical_information || null,
        emergency_contact_name: formData.emergency_contact_name || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        emergency_contact_relation: formData.emergency_contact_relation || null,
        address_line1: formData.address_line1 || null,
        address_line2: formData.address_line2 || null,
        city: formData.city || null,
        state: formData.state || null,
        pin_code: formData.pin_code || null,
      };

      if (selectedStudent) {
        // Update existing student
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", selectedStudent.id);

        if (error) throw error;

        toast({
          title: "Student Updated",
          description: `${formData.first_name} ${formData.last_name} has been updated successfully.`,
        });
      } else {
        // Create new student
        const { error } = await supabase
          .from("students")
          .insert([studentData]);

        if (error) throw error;

        toast({
          title: "Student Added",
          description: `${formData.first_name} ${formData.last_name} has been added successfully.`,
        });
      }

      onStudentSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {selectedStudent ? "Edit Student" : "Add New Student"}
        </DialogTitle>
        <DialogDescription>
          {selectedStudent ? "Update student information" : "Enter student details to add to the system"}
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
          <div className="grid grid-cols-3 gap-4">
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
            <div>
              <Label htmlFor="admission_number">Admission Number *</Label>
              <Input
                id="admission_number"
                value={formData.admission_number}
                onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="date_of_birth">Date of Birth *</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="gender">Gender *</Label>
              <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
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
            <div>
              <Label htmlFor="class_id">Class</Label>
              <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name} {cls.section && `- ${cls.section}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="blood_group">Blood Group</Label>
              <Select value={formData.blood_group} onValueChange={(value) => setFormData({ ...formData, blood_group: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select blood group" />
                </SelectTrigger>
                <SelectContent>
                  {bloodGroups.map((group) => (
                    <SelectItem key={group} value={group}>
                      {group}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="religion">Religion</Label>
              <Select value={formData.religion} onValueChange={(value) => setFormData({ ...formData, religion: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select religion" />
                </SelectTrigger>
                <SelectContent>
                  {religions.map((religion) => (
                    <SelectItem key={religion} value={religion}>
                      {religion}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="caste_category">Caste/Category</Label>
              <Select value={formData.caste_category} onValueChange={(value) => setFormData({ ...formData, caste_category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {casteCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="Alumni">Alumni</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Address Information</h3>
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
                onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
          <div>
            <Label htmlFor="previous_school">Previous School</Label>
            <Input
              id="previous_school"
              value={formData.previous_school}
              onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
            />
          </div>
        </div>

        {/* Transport Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Transport Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transport_route">Transport Route</Label>
              <Input
                id="transport_route"
                value={formData.transport_route}
                onChange={(e) => setFormData({ ...formData, transport_route: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="transport_stop">Transport Stop</Label>
              <Input
                id="transport_stop"
                value={formData.transport_stop}
                onChange={(e) => setFormData({ ...formData, transport_stop: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
              <Input
                id="emergency_contact_name"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
              <Input
                id="emergency_contact_phone"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact_relation">Relation</Label>
              <Input
                id="emergency_contact_relation"
                value={formData.emergency_contact_relation}
                onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
                placeholder="e.g., Uncle, Aunt"
              />
            </div>
          </div>
        </div>

        {/* Medical Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold border-b pb-2">Medical Information</h3>
          <div>
            <Label htmlFor="medical_information">Medical Information / Allergies</Label>
            <Textarea
              id="medical_information"
              value={formData.medical_information}
              onChange={(e) => setFormData({ ...formData, medical_information: e.target.value })}
              placeholder="Any medical conditions, allergies, or special requirements..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : selectedStudent ? "Update Student" : "Add Student"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
