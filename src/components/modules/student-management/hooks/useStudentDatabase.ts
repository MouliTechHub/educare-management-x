
import { supabase } from "@/integrations/supabase/client";
import { validateAndFormatPhoneNumber } from "../utils/formValidation";
import { ensurePhoneFormat } from "../utils/phoneValidation";
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
      console.log('Validating student emergency contact phone:', formData.emergency_contact_phone);
      const phoneValidation = validateAndFormatPhoneNumber(formData.emergency_contact_phone);
      console.log('Student emergency contact phone validation result:', phoneValidation);
      
      if (phoneValidation.isValid) {
        formattedFormData.emergency_contact_phone = phoneValidation.formatted;
      } else {
        throw new Error(`Invalid emergency contact phone: ${phoneValidation.error}`);
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
    console.log('Starting to save parent data for', parents.length, 'parents');
    
    for (let i = 0; i < parents.length; i++) {
      const parent = parents[i];
      console.log(`Processing parent ${i + 1}:`, {
        name: `${parent.first_name} ${parent.last_name}`,
        phone: parent.phone_number,
        altPhone: parent.alternate_phone
      });

      // Double-check and format parent phone numbers with detailed logging
      const formattedParent = { ...parent };
      
      // Primary phone validation (required)
      if (!parent.phone_number || !parent.phone_number.trim()) {
        throw new Error(`Parent ${i + 1}: Phone number is required`);
      }
      
      console.log(`Final format check - primary phone for parent ${i + 1}:`, parent.phone_number);
      const finalPhoneValidation = validateAndFormatPhoneNumber(parent.phone_number);
      console.log(`Final format check result for parent ${i + 1}:`, finalPhoneValidation);
      
      if (!finalPhoneValidation.isValid) {
        console.error(`Final primary phone validation failed for parent ${i + 1}:`, finalPhoneValidation.error);
        throw new Error(`Parent ${i + 1} - ${finalPhoneValidation.error}`);
      }
      formattedParent.phone_number = finalPhoneValidation.formatted;
      
      // Alternate phone validation (optional)
      if (parent.alternate_phone && parent.alternate_phone.trim()) {
        console.log(`Final format check - alternate phone for parent ${i + 1}:`, parent.alternate_phone);
        const finalAltPhoneValidation = validateAndFormatPhoneNumber(parent.alternate_phone);
        console.log(`Final format check result - alternate phone for parent ${i + 1}:`, finalAltPhoneValidation);
        
        if (!finalAltPhoneValidation.isValid) {
          console.error(`Final alternate phone validation failed for parent ${i + 1}:`, finalAltPhoneValidation.error);
          throw new Error(`Parent ${i + 1} alternate phone - ${finalAltPhoneValidation.error}`);
        }
        formattedParent.alternate_phone = finalAltPhoneValidation.formatted;
      } else {
        // Ensure empty alternate phone is null
        formattedParent.alternate_phone = null;
      }

      // Prepare final parent data with extra safety formatting
      const parentData = {
        first_name: formattedParent.first_name,
        last_name: formattedParent.last_name,
        relation: formattedParent.relation,
        phone_number: ensurePhoneFormat(formattedParent.phone_number), // Extra safety check
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
        alternate_phone: formattedParent.alternate_phone ? ensurePhoneFormat(formattedParent.alternate_phone) : null, // Extra safety check
      };

      console.log(`Final parent data for database insert (parent ${i + 1}):`, {
        ...parentData,
        phone_number: parentData.phone_number,
        alternate_phone: parentData.alternate_phone,
        phoneLength: parentData.phone_number?.length,
        altPhoneLength: parentData.alternate_phone?.length
      });

      try {
        const { data: parentRecord, error: parentError } = await supabase
          .from("parents")
          .insert(parentData)
          .select()
          .single();

        if (parentError) {
          console.error(`Database error inserting parent ${i + 1}:`, parentError);
          
          // Provide more specific error messages
          if (parentError.message?.includes('phone_number_check')) {
            throw new Error(`Parent ${i + 1}: Phone number format is invalid. Please use format +91XXXXXXXXXX`);
          } else if (parentError.message?.includes('email_check')) {
            throw new Error(`Parent ${i + 1}: Email format is invalid`);
          } else {
            throw new Error(`Parent ${i + 1}: ${parentError.message}`);
          }
        }

        console.log(`Successfully inserted parent ${i + 1} with ID:`, parentRecord.id);

        // Link student to parent
        const { error: linkError } = await supabase
          .from("student_parent_links")
          .insert({
            student_id: studentId,
            parent_id: parentRecord.id,
          });

        if (linkError) {
          console.error(`Error linking parent ${i + 1} to student:`, linkError);
          throw linkError;
        }

        console.log(`Successfully linked parent ${i + 1} to student`);
        
      } catch (error) {
        console.error(`Error processing parent ${i + 1}:`, error);
        throw error;
      }
    }
    
    console.log('Successfully saved all parent data');
  };

  return { saveStudentData, saveParentData };
}
