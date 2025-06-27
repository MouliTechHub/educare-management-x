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
import { useStudentFeeCreator } from "./utils/studentFeeCreator";

interface StudentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedStudent: Student | null;
  classes: Class[];
  onStudentSaved: () => void;
}

// Helper function to validate and format phone number
const validatePhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Ensure it's at least 10 digits
  if (cleaned.length < 10) {
    throw new Error('Phone number must be at least 10 digits');
  }
  
  return cleaned;
};

// Helper function to check if admission number already exists
const checkAdmissionNumberExists = async (admissionNumber: string, excludeStudentId?: string): Promise<boolean> => {
  let query = supabase
    .from("students")
    .select("id")
    .eq("admission_number", admissionNumber);
    
  if (excludeStudentId) {
    query = query.neq("id", excludeStudentId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error("Error checking admission number:", error);
    return false;
  }
  
  return data && data.length > 0;
};

export function StudentForm({ open, onOpenChange, selectedStudent, classes, onStudentSaved }: StudentFormProps) {
  const { toast } = useToast();
  const { createDefaultFeeRecords } = useStudentFeeCreator();
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
    aadhaar_number: "",
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
        aadhaar_number: selectedStudent.aadhaar_number || "",
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
        aadhaar_number: "",
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
      // Validate required fields
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.admission_number.trim()) {
        toast({
          title: "Validation Error",
          description: "First name, last name, and admission number are required.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Check for duplicate admission number
      const admissionExists = await checkAdmissionNumberExists(
        formData.admission_number.trim(),
        selectedStudent?.id
      );
      
      if (admissionExists) {
        toast({
          title: "Duplicate Admission Number",
          description: `A student with admission number "${formData.admission_number}" already exists. Please use a different admission number.`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate parent phone numbers before submission
      for (const parent of parents) {
        if (parent.phone_number) {
          try {
            parent.phone_number = validatePhoneNumber(parent.phone_number);
          } catch (error: any) {
            toast({
              title: "Invalid Phone Number",
              description: `Parent ${parent.first_name} ${parent.last_name}: ${error.message}`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }

        if (parent.alternate_phone) {
          try {
            parent.alternate_phone = validatePhoneNumber(parent.alternate_phone);
          } catch (error: any) {
            toast({
              title: "Invalid Alternate Phone Number",
              description: `Parent ${parent.first_name} ${parent.last_name}: ${error.message}`,
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }
      }

      const studentData = {
        ...formData,
        admission_number: formData.admission_number.trim(),
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
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
        aadhaar_number: formData.aadhaar_number || null,
      };

      let studentId: string;

      if (selectedStudent) {
        const { error } = await supabase
          .from("students")
          .update(studentData)
          .eq("id", selectedStudent.id);

        if (error) {
          if (error.code === '23505' && error.message.includes('admission_number')) {
            toast({
              title: "Duplicate Admission Number",
              description: "This admission number is already in use. Please choose a different one.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          throw error;
        }
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

        if (error) {
          if (error.code === '23505' && error.message.includes('admission_number')) {
            toast({
              title: "Duplicate Admission Number",
              description: "This admission number is already in use. Please choose a different one.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
          throw error;
        }
        studentId = data.id;

        // Create default fee records for new student
        await createDefaultFeeRecords(studentId, formData.class_id);

        // Process parents with proper validation
        for (const parent of parents) {
          if (parent.first_name && parent.last_name && parent.phone_number && parent.email) {
            const parentData = {
              first_name: parent.first_name.trim(),
              last_name: parent.last_name.trim(),
              relation: parent.relation,
              phone_number: parent.phone_number, // Already validated above
              email: parent.email.trim(),
              annual_income: parent.annual_income ? parseFloat(parent.annual_income) : null,
              address_line1: parent.address_line1 || null,
              address_line2: parent.address_line2 || null,
              city: parent.city || null,
              state: parent.state || null,
              pin_code: parent.pin_code || null,
              occupation: parent.occupation || null,
              employer_name: parent.employer_name || null,
              employer_address: parent.employer_address || null,
              alternate_phone: parent.alternate_phone || null, // Already validated above
            };

            console.log('Inserting parent data:', parentData);

            const { data: parentRecord, error: parentError } = await supabase
              .from("parents")
              .insert([parentData])
              .select()
              .single();

            if (parentError) {
              console.error('Parent insertion error:', parentError);
              throw parentError;
            }

            const { error: linkError } = await supabase
              .from("student_parent_links")
              .insert([{
                student_id: studentId,
                parent_id: parentRecord.id
              }]);

            if (linkError) {
              console.error('Parent link error:', linkError);
              throw linkError;
            }
          }
        }

        toast({
          title: "Student Added",
          description: `${formData.first_name} ${formData.last_name}, parent(s), and default fee records have been added successfully.`,
        });
      }

      onStudentSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      
      // Handle specific database errors
      let errorMessage = "An error occurred while saving the student";
      
      if (error.code === '23505') {
        if (error.message.includes('admission_number')) {
          errorMessage = "This admission number is already in use. Please choose a different one.";
        } else {
          errorMessage = "A duplicate entry was found. Please check your data.";
        }
      } else if (error.code === '23514') {
        errorMessage = "Invalid data format. Please check phone numbers and other fields.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
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
