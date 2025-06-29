
import { supabase } from "@/integrations/supabase/client";

// Enhanced phone number validation - accepts various formats but standardizes to international format
export const validateAndFormatPhoneNumber = (phone: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!phone) return { isValid: false, formatted: '', error: 'Phone number is required' };
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Handle different input formats
  let formatted: string;
  
  if (cleaned.startsWith('+')) {
    // Already international format
    formatted = cleaned;
  } else if (cleaned.length === 10) {
    // Indian mobile number without country code
    formatted = `+91${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('91')) {
    // Indian number with 91 prefix
    formatted = `+${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('091')) {
    // Indian number with 091 prefix
    formatted = `+${cleaned.substring(1)}`;
  } else {
    return { isValid: false, formatted: '', error: 'Invalid phone number format. Enter 10-digit mobile number.' };
  }
  
  // Validate international format: +country_code (1-3 digits) + number (10-15 digits)
  const internationalRegex = /^\+[1-9]\d{10,14}$/;
  if (!internationalRegex.test(formatted)) {
    return { isValid: false, formatted: '', error: 'Invalid phone number format' };
  }
  
  return { isValid: true, formatted };
};

// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) return { isValid: false, error: 'Email is required' };
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

// PIN code validation (6 digits for India)
export const validatePinCode = (pinCode: string): { isValid: boolean; error?: string } => {
  if (!pinCode) return { isValid: true }; // Optional field
  
  if (!/^\d{6}$/.test(pinCode)) {
    return { isValid: false, error: 'PIN code must be exactly 6 digits' };
  }
  
  return { isValid: true };
};

// Aadhaar number validation (12 digits)
export const validateAadhaarNumber = (aadhaar: string): { isValid: boolean; error?: string } => {
  if (!aadhaar) return { isValid: true }; // Optional field
  
  const cleaned = aadhaar.replace(/\D/g, '');
  if (cleaned.length !== 12) {
    return { isValid: false, error: 'Aadhaar number must be exactly 12 digits' };
  }
  
  return { isValid: true };
};

// Amount validation (positive numbers)
export const validateAmount = (amount: string | number): { isValid: boolean; error?: string } => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numAmount) || numAmount < 0) {
    return { isValid: false, error: 'Amount must be a positive number' };
  }
  
  return { isValid: true };
};

// Receipt number validation (alphanumeric, 3-20 characters)
export const validateReceiptNumber = (receiptNumber: string): { isValid: boolean; error?: string } => {
  if (!receiptNumber) return { isValid: false, error: 'Receipt number is required' };
  
  if (!/^[A-Za-z0-9]{3,20}$/.test(receiptNumber)) {
    return { isValid: false, error: 'Receipt number must be 3-20 alphanumeric characters' };
  }
  
  return { isValid: true };
};

// Helper function to check if admission number already exists
export const checkAdmissionNumberExists = async (admissionNumber: string, excludeStudentId?: string): Promise<boolean> => {
  try {
    console.log('Checking admission number:', admissionNumber, 'excluding student ID:', excludeStudentId);
    
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
      throw error;
    }
    
    const exists = data && data.length > 0;
    console.log('Admission number exists:', exists, 'data:', data);
    
    return exists;
  } catch (error) {
    console.error("Error in checkAdmissionNumberExists:", error);
    // Return false to allow the operation to proceed in case of check failure
    return false;
  }
};

// Helper function to validate required fields
export const validateRequiredFields = (data: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      missingFields.push(field);
    }
  });
  
  return missingFields;
};

// Comprehensive form validation for student data
export const validateStudentFormData = (formData: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Required fields validation
  const requiredFields = ['first_name', 'last_name', 'admission_number', 'date_of_birth', 'gender'];
  const missingFields = validateRequiredFields(formData, requiredFields);
  
  missingFields.forEach(field => {
    errors[field] = `${field.replace('_', ' ')} is required`;
  });
  
  // Phone number validation
  if (formData.emergency_contact_phone) {
    const phoneValidation = validateAndFormatPhoneNumber(formData.emergency_contact_phone);
    if (!phoneValidation.isValid) {
      errors.emergency_contact_phone = phoneValidation.error || 'Invalid phone number';
    }
  }
  
  // PIN code validation
  if (formData.pin_code) {
    const pinValidation = validatePinCode(formData.pin_code);
    if (!pinValidation.isValid) {
      errors.pin_code = pinValidation.error || 'Invalid PIN code';
    }
  }
  
  // Aadhaar validation
  if (formData.aadhaar_number) {
    const aadhaarValidation = validateAadhaarNumber(formData.aadhaar_number);
    if (!aadhaarValidation.isValid) {
      errors.aadhaar_number = aadhaarValidation.error || 'Invalid Aadhaar number';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Comprehensive form validation for parent data
export const validateParentFormData = (parentData: any): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  // Required fields validation
  const requiredFields = ['first_name', 'last_name', 'relation', 'phone_number', 'email'];
  const missingFields = validateRequiredFields(parentData, requiredFields);
  
  missingFields.forEach(field => {
    errors[field] = `${field.replace('_', ' ')} is required`;
  });
  
  // Phone number validation
  if (parentData.phone_number) {
    const phoneValidation = validateAndFormatPhoneNumber(parentData.phone_number);
    if (!phoneValidation.isValid) {
      errors.phone_number = phoneValidation.error || 'Invalid phone number';
    }
  }
  
  // Alternate phone validation
  if (parentData.alternate_phone) {
    const altPhoneValidation = validateAndFormatPhoneNumber(parentData.alternate_phone);
    if (!altPhoneValidation.isValid) {
      errors.alternate_phone = altPhoneValidation.error || 'Invalid alternate phone number';
    }
  }
  
  // Email validation
  if (parentData.email) {
    const emailValidation = validateEmail(parentData.email);
    if (!emailValidation.isValid) {
      errors.email = emailValidation.error || 'Invalid email';
    }
  }
  
  // PIN code validation
  if (parentData.pin_code) {
    const pinValidation = validatePinCode(parentData.pin_code);
    if (!pinValidation.isValid) {
      errors.pin_code = pinValidation.error || 'Invalid PIN code';
    }
  }
  
  // Annual income validation
  if (parentData.annual_income) {
    const incomeValidation = validateAmount(parentData.annual_income);
    if (!incomeValidation.isValid) {
      errors.annual_income = incomeValidation.error || 'Invalid annual income';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
