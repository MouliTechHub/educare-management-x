
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Student } from "@/types/database";
import { useStudentValidation } from "./useStudentValidation";
import { useStudentDatabase } from "./useStudentDatabase";

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
  onStudentSaved: (studentData?: any) => void;
  onOpenChange: (open: boolean) => void;
}

export function useStudentFormSubmission({
  selectedStudent,
  onStudentSaved,
  onOpenChange
}: UseStudentFormSubmissionProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { validateFormData } = useStudentValidation();
  const { saveStudentData, saveParentData } = useStudentDatabase();

  const getErrorMessage = (error: any): string => {
    if (error.message?.includes('phone_number_check')) {
      return 'Invalid phone number format. Please use international format (+91XXXXXXXXXX for India).';
    } else if (error.message?.includes('email_check')) {
      return 'Invalid email format. Please enter a valid email address.';
    } else if (error.message?.includes('pin_code_check')) {
      return 'Invalid PIN code. Please enter exactly 6 digits.';
    } else if (error.message?.includes('aadhaar_number_check')) {
      return 'Invalid Aadhaar number. Please enter exactly 12 digits.';
    } else if (error.message?.includes('students_admission_number_key')) {
      return 'This admission number is already in use. Please use a different one.';
    } else if (error.message?.includes('gender_check')) {
      return 'Invalid gender selection. Please select Male, Female, or Other.';
    } else if (error.message?.includes('relation_check')) {
      return 'Invalid parent relation. Please select Mother, Father, Guardian, or Other.';
    } else if (error.message) {
      return error.message;
    }
    return `Failed to ${selectedStudent ? "update" : "create"} student`;
  };

  const handleSubmit = async (formData: FormData, parents: Parent[]) => {
    setLoading(true);
    try {
      console.log('Starting form submission with validation...');

      // Validate form data
      const isValid = await validateFormData(formData, parents, selectedStudent);
      if (!isValid) return;

      // Save student data
      const studentData = await saveStudentData(formData, selectedStudent);

      // Handle parents for new students only
      if (!selectedStudent && parents.length > 0) {
        await saveParentData(parents, studentData.id);
      }

      toast({
        title: "Success",
        description: `Student ${selectedStudent ? "updated" : "created"} successfully!`,
      });

      // Pass the student data back for post-creation actions
      onStudentSaved(selectedStudent ? null : studentData);
      
      if (selectedStudent) {
        // For updates, close immediately
        onOpenChange(false);
      }
      // For new students, don't close here - let the post-creation dialog handle it

    } catch (error: any) {
      console.error("Error saving student:", error);
      
      const errorMessage = getErrorMessage(error);
      
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
