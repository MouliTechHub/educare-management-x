
// Single source of truth for Indian phone number validation
const INDIAN_PHONE_REGEX = /^\+91[0-9]{10}$/;

// Enhanced phone number validation - accepts various formats but standardizes to international format
export const validateAndFormatPhoneNumber = (phone: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!phone) return { isValid: false, formatted: '', error: 'Phone number is required' };
  
  // Remove all whitespace, hyphens, parentheses, dots, and keep only digits and +
  const cleaned = phone.trim().replace(/[\s\-\(\)\.\s]/g, '').replace(/[^\d+]/g, '');
  
  console.log('Phone validation - input:', phone, 'cleaned:', cleaned);
  
  // Handle different input formats
  let formatted: string;
  
  if (cleaned.startsWith('+91')) {
    // Already in +91 format - use as is
    formatted = cleaned;
  } else if (cleaned.length === 10 && /^[6-9][0-9]{9}$/.test(cleaned)) {
    // Valid Indian mobile number without country code (10 digits starting with 6-9)
    formatted = `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91') && /^91[6-9][0-9]{9}$/.test(cleaned)) {
    // Indian number with 91 prefix (12 digits total)
    formatted = `+${cleaned}`;
  } else if (cleaned.length === 13 && cleaned.startsWith('+91') && /^\+91[6-9][0-9]{9}$/.test(cleaned)) {
    // Already properly formatted
    formatted = cleaned;
  } else {
    console.log('Phone validation failed - invalid format:', cleaned);
    return { 
      isValid: false, 
      formatted: '', 
      error: 'Enter a valid 10-digit Indian mobile number (starting with 6-9)' 
    };
  }
  
  console.log('Phone validation - formatted:', formatted, 'length:', formatted.length);
  
  // Final validation against database constraint - exactly 13 characters: +91XXXXXXXXXX
  if (!INDIAN_PHONE_REGEX.test(formatted) || formatted.length !== 13) {
    console.log('Phone validation failed - regex/length check:', {
      formatted,
      regexTest: INDIAN_PHONE_REGEX.test(formatted),
      lengthCheck: formatted.length === 13,
      actualLength: formatted.length
    });
    return { 
      isValid: false, 
      formatted: '', 
      error: 'Phone number must be in format +91XXXXXXXXXX (exactly 13 characters)' 
    };
  }
  
  console.log('Phone validation successful:', formatted);
  return { isValid: true, formatted };
};

// Helper function to ensure phone number is properly formatted before database operations
export const ensurePhoneFormat = (phone: string): string => {
  if (!phone) return '';
  
  const validation = validateAndFormatPhoneNumber(phone);
  if (validation.isValid) {
    return validation.formatted;
  }
  
  // If validation fails, return the original phone (this will cause a database error with clear message)
  return phone;
};
