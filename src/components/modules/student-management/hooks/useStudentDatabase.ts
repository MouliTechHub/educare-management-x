
import { supabase } from "@/integrations/supabase/client";
import { validateAndFormatPhoneNumber } from "../utils/formValidation";
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

export function useStudentDatabase() {
  const saveStudentData = async (formData: FormData, selectedStudent: Student | null) => {
    // Format phone numbers before saving
    const formattedFormData = { ...formData };
    if (formData.emergency_contact_phone) {
      const phoneValidation = validateAndFormatPhoneNumber(formData.emergency_contact_phone);
      if (phoneValidation.isValid) {
        formattedFormData.emergency_contact_phone = phoneValidation.formatted;
      }
    }

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
      return data;
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
      return data;
    }
  };

  const saveParentData = async (parents: Parent[], studentId: string) => {
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
          student_id: studentId,
          parent_id: parentRecord.id,
        });

      if (linkError) throw linkError;
    }
  };

  return { saveStudentData, saveParentData };
}
