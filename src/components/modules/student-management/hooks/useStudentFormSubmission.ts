
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types/database";
import { StudentFormData, ParentFormData } from "../types";
import { validatePhoneNumber, checkAdmissionNumberExists } from "../utils/formValidation";
import { useStudentFeeCreator } from "../utils/studentFeeCreator";

interface UseStudentFormSubmissionProps {
  selectedStudent: Student | null;
  onStudentSaved: () => void;
  onOpenChange: (open: boolean) => void;
}

export function useStudentFormSubmission({ 
  selectedStudent, 
  onStudentSaved, 
  onOpenChange 
}: UseStudentFormSubmissionProps) {
  const { toast } = useToast();
  const { createDefaultFeeRecords } = useStudentFeeCreator();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (formData: StudentFormData, parents: ParentFormData[]) => {
    setLoading(true);

    try {
      if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.admission_number.trim()) {
        toast({
          title: "Validation Error",
          description: "First name, last name, and admission number are required.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

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

      // Validate parent phone numbers
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

        await createDefaultFeeRecords(studentId, formData.class_id);

        // Handle parent creation for new students
        for (const parent of parents) {
          if (parent.first_name && parent.last_name && parent.phone_number && parent.email) {
            const parentData = {
              first_name: parent.first_name.trim(),
              last_name: parent.last_name.trim(),
              relation: parent.relation,
              phone_number: parent.phone_number,
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
              alternate_phone: parent.alternate_phone || null,
              aadhaar_number: parent.aadhaar_number || null,
              pan_number: parent.pan_number || null,
              education_qualification: parent.education_qualification || null,
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

  return {
    handleSubmit,
    loading
  };
}
