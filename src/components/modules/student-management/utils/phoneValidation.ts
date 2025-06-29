
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
  } else {
    console.log('Phone validation failed - invalid format:', cleaned);
    return { 
      isValid: false, 
      formatted: '', 
      error: 'Enter a valid 10-digit Indian mobile number (starting with 6-9)' 
    };
  }
  
  console.log('Phone validation - formatted:', formatted, 'length:', formatted.length);
  
  // Final validation - must be exactly +91 followed by 10 digits
  if (formatted.length !== 13 || !formatted.startsWith('+91')) {
    console.log('Phone validation failed - length/prefix check:', {
      formatted,
      length: formatted.length,
      startsWithPlus91: formatted.startsWith('+91')
    });
    return { 
      isValid: false, 
      formatted: '', 
      error: 'Phone number must be in format +91XXXXXXXXXX (exactly 13 characters)' 
    };
  }
  
  // Check if the 10 digits after +91 are all numeric and start with 6-9
  const phoneDigits = formatted.substring(3); // Remove +91
  if (phoneDigits.length !== 10 || !/^[6-9][0-9]{9}$/.test(phoneDigits)) {
    console.log('Phone validation failed - digit validation:', {
      phoneDigits,
      digitLength: phoneDigits.length,
      digitPattern: /^[6-9][0-9]{9}$/.test(phoneDigits)
    });
    return { 
      isValid: false, 
      formatted: '', 
      error: 'Phone number must start with 6, 7, 8, or 9 and be exactly 10 digits after +91' 
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
