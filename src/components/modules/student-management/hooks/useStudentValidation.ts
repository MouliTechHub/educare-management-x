
import { validateStudentFormData, validateParentFormData, checkAdmissionNumberExists } from "../utils/formValidation";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types/database";

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

export function useStudentValidation() {
  const { toast } = useToast();

  const validateFormData = async (
    formData: FormData,
    parents: Parent[],
    selectedStudent: Student | null
  ): Promise<boolean> => {
    // Comprehensive form validation
    const studentValidation = validateStudentFormData(formData);
    if (!studentValidation.isValid) {
      const firstError = Object.values(studentValidation.errors)[0];
      toast({
        title: "Validation Error",
        description: firstError,
        variant: "destructive",
      });
      return false;
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
          return false;
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
        return false;
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
        return false;
      }
    }

    return true;
  };

  return { validateFormData };
}
