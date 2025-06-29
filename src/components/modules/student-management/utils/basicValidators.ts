
// Basic validation functions for common data types

// Email validation with comprehensive regex
export const validateEmail = (email: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!email) return { isValid: false, formatted: '', error: 'Email is required' };
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const trimmedEmail = email.trim().toLowerCase();
  
  if (!emailRegex.test(trimmedEmail)) {
    return { isValid: false, formatted: '', error: 'Please enter a valid email address' };
  }
  
  return { isValid: true, formatted: trimmedEmail };
};

// PIN Code validation for India (6 digits)
export const validatePinCode = (pinCode: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!pinCode) return { isValid: false, formatted: '', error: 'PIN code is required' };
  
  const cleaned = pinCode.replace(/\D/g, '');
  
  if (cleaned.length !== 6) {
    return { isValid: false, formatted: '', error: 'PIN code must be exactly 6 digits' };
  }
  
  return { isValid: true, formatted: cleaned };
};

// Aadhaar number validation (12 digits)
export const validateAadhaarNumber = (aadhaar: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!aadhaar) return { isValid: false, formatted: '', error: 'Aadhaar number is required' };
  
  const cleaned = aadhaar.replace(/\D/g, '');
  
  if (cleaned.length !== 12) {
    return { isValid: false, formatted: '', error: 'Aadhaar number must be exactly 12 digits' };
  }
  
  return { isValid: true, formatted: cleaned };
};

// PAN number validation (5 letters + 4 digits + 1 letter)
export const validatePanNumber = (pan: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!pan) return { isValid: false, formatted: '', error: 'PAN number is required' };
  
  const cleaned = pan.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  
  if (!panRegex.test(cleaned)) {
    return { isValid: false, formatted: '', error: 'PAN must be in format ABCDE1234F (5 letters + 4 digits + 1 letter)' };
  }
  
  return { isValid: true, formatted: cleaned };
};

// Amount validation (for fees, income, etc.)
export const validateAmount = (amount: string | number): { isValid: boolean; formatted: number; error?: string } => {
  if (!amount && amount !== 0) return { isValid: false, formatted: 0, error: 'Amount is required' };
  
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount) || numericAmount < 0) {
    return { isValid: false, formatted: 0, error: 'Please enter a valid positive amount' };
  }
  
  return { isValid: true, formatted: numericAmount };
};

// Receipt number validation
export const validateReceiptNumber = (receiptNumber: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!receiptNumber) return { isValid: false, formatted: '', error: 'Receipt number is required' };
  
  const trimmed = receiptNumber.trim();
  
  if (trimmed.length < 3) {
    return { isValid: false, formatted: '', error: 'Receipt number must be at least 3 characters long' };
  }
  
  return { isValid: true, formatted: trimmed };
};
