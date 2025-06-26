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
import { Plus, Trash2 } from "lucide-react";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  classes: Class[];
  onStudentSaved: () => void;
}

interface ParentFormData {
  first_name: string;
  last_name: string;
  relation: string;
  phone_number: string;
  email: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pin_code: string;
  occupation: string;
  annual_income: string;
  employer_name: string;
  employer_address: string;
  alternate_phone: string;
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
const relations = ["Mother", "Father", "Guardian", "Other"];

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

  const [parents, setParents] = useState<ParentFormData[]>([
    {
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
    }
  ]);

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

      if (selectedStudent.parents && selectedStudent.parents.length > 0) {
        const existingParents = selectedStudent.parents.map(parent => ({
          first_name: parent.first_name,
          last_name: parent.last_name,
          relation: parent.relation,
          phone_number: parent.phone_number,
          email: parent.email,
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
        }));
        setParents(existingParents);
      }
    } else {
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
      setParents([{
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
      }]);
    }
  }, [selectedStudent, open]);

  const addParent = () => {
    setParents([...parents, {
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
    }]);
  };

  const removeParent = (index: number) => {
    if (parents.length > 1) {
      setParents(parents.filter((_, i) => i !== index));
    }
  };

  const updateParent = (index: number, field: keyof ParentFormData, value: string) => {
    const updatedParents = [...parents];
    updatedParents[index][field] = value;
    setParents(updatedParents);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
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

      let studentId: string;

      if (selectedStudent) {
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", selectedStudent.id);

        if (error) throw error;
        studentId = selectedStudent.id;

        toast({
          title: "Student Updated",
          description: `${formData.first_name} ${formData.last_name} has been updated successfully.`,
        });
      } else {
        const { data, error } = await supabase
          .from("students")
          .insert([studentData])
          .select()
          .single();

        if (error) throw error;
        studentId = data.id;

        for (const parent of parents) {
          if (parent.first_name && parent.last_name && parent.phone_number && parent.email) {
            const parentData = {
              ...parent,
              annual_income: parent.annual_income ? parseFloat(parent.annual_income) : null,
              address_line1: parent.address_line1 || null,
              address_line2: parent.address_line2 || null,
              city: parent.city || null,
              state: parent.state || null,
              pin_code: parent.pin_code || null,
              occupation: parent.occupation || null,
              employer_name: parent.employer_name || null,
              employer_address: parent.employer_address || null,
              alternate_phone: parent.alternate_phone || null,
            };

            const { data: parentRecord, error: parentError } = await supabase
              .from("parents")
              .insert([parentData])
              .select()
              .single();

            if (parentError) throw parentError;

            const { error: linkError } = await supabase
              .from("student_parent_links")
              .insert([{
                student_id: studentId,
                parent_id: parentRecord.id
              }]);

            if (linkError) throw linkError;
          }
        }

        toast({
          title: "Student Added",
          description: `${formData.first_name} ${formData.last_name} and parent(s) have been added successfully.`,
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
          {selectedStudent ? "Update student information" : "Enter student and parent details to add to the system"}
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

        {/* Parent Information - Only show for new students */}
        {!selectedStudent && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold border-b pb-2">Parent Information</h3>
              <Button type="button" onClick={addParent} variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Add Parent
              </Button>
            </div>
            
            {parents.map((parent, index) => (
              <div key={index} className="border p-4 rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Parent {index + 1}</h4>
                  {parents.length > 1 && (
                    <Button
                      type="button"
                      onClick={() => removeParent(index)}
                      variant="outline"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={parent.first_name}
                      onChange={(e) => updateParent(index, 'first_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={parent.last_name}
                      onChange={(e) => updateParent(index, 'last_name', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Relation *</Label>
                    <Select value={parent.relation} onValueChange={(value) => updateParent(index, 'relation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        {relations.map((relation) => (
                          <SelectItem key={relation} value={relation}>
                            {relation}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      value={parent.phone_number}
                      onChange={(e) => updateParent(index, 'phone_number', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={parent.email}
                      onChange={(e) => updateParent(index, 'email', e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Occupation</Label>
                    <Input
                      value={parent.occupation}
                      onChange={(e) => updateParent(index, 'occupation', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Annual Income</Label>
                    <Input
                      type="number"
                      value={parent.annual_income}
                      onChange={(e) => updateParent(index, 'annual_income', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Employer Name</Label>
                    <Input
                      value={parent.employer_name}
                      onChange={(e) => updateParent(index, 'employer_name', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Alternate Phone</Label>
                    <Input
                      value={parent.alternate_phone}
                      onChange={(e) => updateParent(index, 'alternate_phone', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? "Saving..." : selectedStudent ? "Update Student" : "Add Student & Parent(s)"}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}
