import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Student, Class } from "@/types/database";
import { StudentFormData, ParentFormData } from "./types";
import { BasicInformationSection } from "./BasicInformationSection";
import { AddressSection } from "./AddressSection";
import { AcademicSection } from "./AcademicSection";
import { TransportSection } from "./TransportSection";
import { EmergencyContactSection } from "./EmergencyContactSection";
import { MedicalSection } from "./MedicalSection";
import { ParentFormSection } from "./ParentFormSection";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  classes: Class[];
  onStudentSaved: () => void;
}

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
        <BasicInformationSection formData={formData} setFormData={setFormData} classes={classes} />
        <AddressSection formData={formData} setFormData={setFormData} />
        <AcademicSection formData={formData} setFormData={setFormData} />
        <TransportSection formData={formData} setFormData={setFormData} />
        <EmergencyContactSection formData={formData} setFormData={setFormData} />
        <MedicalSection formData={formData} setFormData={setFormData} />

        {!selectedStudent && (
          <ParentFormSection parents={parents} setParents={setParents} />
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
