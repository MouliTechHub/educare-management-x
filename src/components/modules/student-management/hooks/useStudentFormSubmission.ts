import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types/database";
import { 
  checkAdmissionNumberExists, 
  validateStudentFormData, 
  validateParentFormData,
  validateAndFormatPhoneNumber 
} from "../utils/formValidation";

interface FormData {
  first_name: string;
  last_name: string;
  admission_number: string;
  date_of_birth: string;
  gender: string;
  class_id: string;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pin_code: string;
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
  aadhaar_number: string;
}

interface Parent {
  id?: string;
  first_name: string;
  last_name: string;
  relation: string;
  phone_number: string;
  email: string;
  annual_income: number | null;
  address_line1: string;
  address_line2: string;
  city: string;
  state: string;
  pin_code: string;
  occupation: string;
  employer_name: string;
  employer_address: string;
  alternate_phone: string;
}

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
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createDefaultFeeRecords = async (studentId: string) => {
    try {
      console.log('Creating default fee records for student:', studentId);
      
      // Get the current academic year
      const { data: currentYear, error: yearError } = await supabase
        .from('academic_years')
        .select('id')
        .eq('is_current', true)
        .single();

      if (yearError) {
        console.error('Error fetching current academic year:', yearError);
        return;
      }

      if (!currentYear) {
        console.log('No current academic year found, skipping fee creation');
        return;
      }

      // Create default fee records with valid fee types that match the database constraint
      const defaultFees = [
        {
          student_id: studentId,
          fee_type: 'Tuition', // Changed from 'Tuition Fee' to 'Tuition'
          amount: 5000,
          actual_amount: 5000,
          discount_amount: 0,
          total_paid: 0,
          due_date: new Date(new Date().getFullYear(), 3, 30).toISOString().split('T')[0], // April 30
          status: 'Pending',
          academic_year_id: currentYear.id
        },
        {
          student_id: studentId,
          fee_type: 'Development', // Changed from 'Development Fee' to 'Development'
          amount: 1000,
          actual_amount: 1000,
          discount_amount: 0,
          total_paid: 0,
          due_date: new Date(new Date().getFullYear(), 3, 30).toISOString().split('T')[0], // April 30
          status: 'Pending',
          academic_year_id: currentYear.id
        }
      ];

      const { error: feeError } = await supabase
        .from('fees')
        .insert(defaultFees);

      if (feeError) {
        console.error('Error creating default fee records:', feeError);
        throw feeError;
      }

      console.log('Default fee records created successfully');
    } catch (error) {
      console.error('Error creating default fee records:', error);
      throw error;
    }
  };

  const handleSubmit = async (formData: FormData, parents: Parent[]) => {
    setLoading(true);
    try {
      console.log('Starting form submission with validation...');

      // Comprehensive form validation
      const studentValidation = validateStudentFormData(formData);
      if (!studentValidation.isValid) {
        const firstError = Object.values(studentValidation.errors)[0];
        toast({
          title: "Validation Error",
          description: firstError,
          variant: "destructive",
        });
        return;
      }

      // Validate parent data for new students
      if (!selectedStudent && parents.length > 0) {
        for (let i = 0; i < parents.length; i++) {
          const parentValidation = validateParentFormData(parents[i]);
          if (!parentValidation.isValid) {
            const firstError = Object.values(parentValidation.errors)[0];
            toast({
              title: "Parent Validation Error",
              description: `Parent ${i + 1}: ${firstError}`,
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Validate admission number uniqueness
      if (!selectedStudent) {
        const admissionExists = await checkAdmissionNumberExists(formData.admission_number);
        if (admissionExists) {
          toast({
            title: "Error",
            description: "This admission number is already in use. Please use a different one.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // For updates, check if admission number exists for other students
        const admissionExists = await checkAdmissionNumberExists(formData.admission_number, selectedStudent.id);
        if (admissionExists) {
          toast({
            title: "Error",
            description: "This admission number is already in use by another student.",
            variant: "destructive",
          });
          return;
        }
      }

      // Format phone numbers before saving
      const formattedFormData = { ...formData };
      if (formData.emergency_contact_phone) {
        const phoneValidation = validateAndFormatPhoneNumber(formData.emergency_contact_phone);
        if (phoneValidation.isValid) {
          formattedFormData.emergency_contact_phone = phoneValidation.formatted;
        }
      }

      let studentData;
      if (selectedStudent) {
        // Update existing student
        const { data, error } = await supabase
          .from("students")
          .update({
            first_name: formattedFormData.first_name,
            last_name: formattedFormData.last_name,
            admission_number: formattedFormData.admission_number,
            date_of_birth: formattedFormData.date_of_birth,
            gender: formattedFormData.gender,
            class_id: formattedFormData.class_id || null,
            address_line1: formattedFormData.address_line1 || null,
            address_line2: formattedFormData.address_line2 || null,
            city: formattedFormData.city || null,
            state: formattedFormData.state || null,
            pin_code: formattedFormData.pin_code || null,
            blood_group: formattedFormData.blood_group || null,
            religion: formattedFormData.religion || null,
            caste_category: formattedFormData.caste_category || null,
            previous_school: formattedFormData.previous_school || null,
            transport_route: formattedFormData.transport_route || null,
            transport_stop: formattedFormData.transport_stop || null,
            medical_information: formattedFormData.medical_information || null,
            emergency_contact_name: formattedFormData.emergency_contact_name || null,
            emergency_contact_phone: formattedFormData.emergency_contact_phone || null,
            emergency_contact_relation: formattedFormData.emergency_contact_relation || null,
            aadhaar_number: formattedFormData.aadhaar_number || null,
          })
          .eq("id", selectedStudent.id)
          .select()
          .single();

        if (error) throw error;
        studentData = data;
      } else {
        // Create new student
        const { data, error } = await supabase
          .from("students")
          .insert({
            first_name: formattedFormData.first_name,
            last_name: formattedFormData.last_name,
            admission_number: formattedFormData.admission_number,
            date_of_birth: formattedFormData.date_of_birth,
            gender: formattedFormData.gender,
            class_id: formattedFormData.class_id || null,
            address_line1: formattedFormData.address_line1 || null,
            address_line2: formattedFormData.address_line2 || null,
            city: formattedFormData.city || null,
            state: formattedFormData.state || null,
            pin_code: formattedFormData.pin_code || null,
            blood_group: formattedFormData.blood_group || null,
            religion: formattedFormData.religion || null,
            caste_category: formattedFormData.caste_category || null,
            previous_school: formattedFormData.previous_school || null,
            transport_route: formattedFormData.transport_route || null,
            transport_stop: formattedFormData.transport_stop || null,
            medical_information: formattedFormData.medical_information || null,
            emergency_contact_name: formattedFormData.emergency_contact_name || null,
            emergency_contact_phone: formattedFormData.emergency_contact_phone || null,
            emergency_contact_relation: formattedFormData.emergency_contact_relation || null,
            aadhaar_number: formattedFormData.aadhaar_number || null,
          })
          .select()
          .single();

        if (error) throw error;
        studentData = data;

        // Create default fee records for new students
        if (studentData?.id) {
          await createDefaultFeeRecords(studentData.id);
        }
      }

      // Handle parents for new students only
      if (!selectedStudent && parents.length > 0) {
        for (const parent of parents) {
          console.log('Inserting parent data:', parent);

          // Format parent phone numbers
          const formattedParent = { ...parent };
          if (parent.phone_number) {
            const phoneValidation = validateAndFormatPhoneNumber(parent.phone_number);
            if (phoneValidation.isValid) {
              formattedParent.phone_number = phoneValidation.formatted;
            }
          }
          if (parent.alternate_phone) {
            const altPhoneValidation = validateAndFormatPhoneNumber(parent.alternate_phone);
            if (altPhoneValidation.isValid) {
              formattedParent.alternate_phone = altPhoneValidation.formatted;
            }
          }

          const parentData = {
            first_name: formattedParent.first_name,
            last_name: formattedParent.last_name,
            relation: formattedParent.relation,
            phone_number: formattedParent.phone_number,
            email: formattedParent.email,
            annual_income: formattedParent.annual_income,
            address_line1: formattedParent.address_line1 || null,
            address_line2: formattedParent.address_line2 || null,
            city: formattedParent.city || null,
            state: formattedParent.state || null,
            pin_code: formattedParent.pin_code || null,
            occupation: formattedParent.occupation || null,
            employer_name: formattedParent.employer_name || null,
            employer_address: formattedParent.employer_address || null,
            alternate_phone: formattedParent.alternate_phone || null,
          };

          const { data: parentRecord, error: parentError } = await supabase
            .from("parents")
            .insert(parentData)
            .select()
            .single();

          if (parentError) {
            console.error('Parent insertion error:', parentError);
            throw parentError;
          }

          // Link student to parent
          const { error: linkError } = await supabase
            .from("student_parent_links")
            .insert({
              student_id: studentData.id,
              parent_id: parentRecord.id,
            });

          if (linkError) throw linkError;
        }
      }

      toast({
        title: "Success",
        description: `Student ${selectedStudent ? "updated" : "created"} successfully!`,
      });

      onStudentSaved();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error saving student:", error);
      
      // Provide user-friendly error messages
      let errorMessage = `Failed to ${selectedStudent ? "update" : "create"} student`;
      
      if (error.message?.includes('phone_number_check')) {
        errorMessage = 'Invalid phone number format. Please use international format (+91XXXXXXXXXX for India).';
      } else if (error.message?.includes('email_check')) {
        errorMessage = 'Invalid email format. Please enter a valid email address.';
      } else if (error.message?.includes('pin_code_check')) {
        errorMessage = 'Invalid PIN code. Please enter exactly 6 digits.';
      } else if (error.message?.includes('aadhaar_number_check')) {
        errorMessage = 'Invalid Aadhaar number. Please enter exactly 12 digits.';
      } else if (error.message?.includes('fees_fee_type_check')) {
        errorMessage = 'Invalid fee type detected. Please contact the administrator.';
      } else if (error.message?.includes('students_admission_number_key')) {
        errorMessage = 'This admission number is already in use. Please use a different one.';
      } else if (error.message?.includes('gender_check')) {
        errorMessage = 'Invalid gender selection. Please select Male, Female, or Other.';
      } else if (error.message?.includes('relation_check')) {
        errorMessage = 'Invalid parent relation. Please select Mother, Father, Guardian, or Other.';
      } else if (error.message) {
        errorMessage = error.message;
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

  return { handleSubmit, loading };
}
