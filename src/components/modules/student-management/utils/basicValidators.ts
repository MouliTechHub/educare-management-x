
// Email validation
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  if (!email) return { isValid: false, error: 'Email is required' };
  
  // Trim whitespace
  const trimmed = email.trim();
  
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { isValid: false, error: 'Invalid email format' };
  }
  
  return { isValid: true };
};

// PIN code validation (6 digits for India)
export const validatePinCode = (pinCode: string): { isValid: boolean; error?: string } => {
  if (!pinCode) return { isValid: true }; // Optional field
  
  // Trim whitespace
  const trimmed = pinCode.trim();
  
  if (!/^\d{6}$/.test(trimmed)) {
    return { isValid: false, error: 'PIN code must be exactly 6 digits' };
  }
  
  return { isValid: true };
};

// Aadhaar number validation (12 digits)
export const validateAadhaarNumber = (aadhaar: string): { isValid: boolean; error?: string } => {
  if (!aadhaar) return { isValid: true }; // Optional field
  
  // Trim whitespace and remove non-digits
  const cleaned = aadhaar.trim().replace(/\D/g, '');
  if (cleaned.length !== 12) {
    return { isValid: false, error: 'Aadhaar number must be exactly 12 digits' };
  }
  
  return { isValid: true };
};

// Amount validation (positive numbers)
export const validateAmount = (amount: string | number): { isValid: boolean; error?: string } => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount.trim()) : amount;
  
  if (isNaN(numAmount) || numAmount < 0) {
    return { isValid: false, error: 'Amount must be a positive number' };
  }
  
  return { isValid: true };
};

// Receipt number validation (alphanumeric, 3-20 characters)
export const validateReceiptNumber = (receiptNumber: string): { isValid: boolean; error?: string } => {
  if (!receiptNumber) return { isValid: false, error: 'Receipt number is required' };
  
  // Trim whitespace
  const trimmed = receiptNumber.trim();
  
  if (!/^[A-Za-z0-9]{3,20}$/.test(trimmed)) {
    return { isValid: false, error: 'Receipt number must be 3-20 alphanumeric characters' };
  }
  
  return { isValid: true };
};
