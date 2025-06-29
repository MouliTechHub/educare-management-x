
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
