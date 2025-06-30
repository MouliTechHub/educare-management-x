
// Re-export all validation functions from their dedicated modules
export { validateAndFormatPhoneNumber } from './phoneValidation';
export { 
  validateEmail, 
  validatePinCode, 
  validateAadhaarNumber, 
  validateAmount, 
  validateReceiptNumber 
} from './basicValidators';
export { 
  validateRequiredFields, 
  validateStudentFormData, 
  validateParentFormData 
} from './formValidators';
export { checkAdmissionNumberExists } from './databaseValidation';

// Additional validation for Indian standards
export const validateIndianAadhaar = (aadhaar: string): { isValid: boolean; error?: string; formatted?: string } => {
  if (!aadhaar) return { isValid: false, error: 'Aadhaar number is required' };
  
  const cleanAadhaar = aadhaar.replace(/\s/g, '');
  if (!/^[0-9]{12}$/.test(cleanAadhaar)) {
    return { isValid: false, error: 'Aadhaar number must be exactly 12 digits' };
  }
  
  return { 
    isValid: true, 
    formatted: cleanAadhaar.replace(/(\d{4})(\d{4})(\d{4})/, '$1 $2 $3')
  };
};

export const validateCasteCategory = (category: string): { isValid: boolean; error?: string } => {
  const validCategories = ['SC', 'ST', 'OC', 'BC-A', 'BC-B', 'BC-C', 'BC-D', 'BC-E', 'EWS'];
  if (!validCategories.includes(category)) {
    return { isValid: false, error: 'Please select a valid caste category' };
  }
  return { isValid: true };
};

export const validatePaymentDate = (date: string): { isValid: boolean; error?: string } => {
  const paymentDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  if (paymentDate < today) {
    return { isValid: false, error: 'Payment date cannot be in the past' };
  }
  
  return { isValid: true };
};
