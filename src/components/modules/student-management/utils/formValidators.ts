
import { validateAndFormatPhoneNumber } from "./phoneValidation";
import { validateEmail, validatePinCode, validateAadhaarNumber, validateAmount } from "./basicValidators";

// Helper function to validate required fields
export const validateRequiredFields = (data: any, requiredFields: string[]): string[] => {
  const missingFields: string[] = [];
  
  requiredFields.forEach(field => {
    const value = data[field];
    if (!value || (typeof value === 'string' && value.trim() === '')) {
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
