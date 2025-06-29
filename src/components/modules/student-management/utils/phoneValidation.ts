
// Single source of truth for Indian phone number validation
const INDIAN_PHONE_REGEX = /^\+91[0-9]{10}$/;

// Enhanced phone number validation - accepts various formats but standardizes to international format
export const validateAndFormatPhoneNumber = (phone: string): { isValid: boolean; formatted: string; error?: string } => {
  if (!phone) return { isValid: false, formatted: '', error: 'Phone number is required' };
  
  // Trim all whitespace and special characters except + and digits
  const cleaned = phone.trim().replace(/[^\d+]/g, '');
  
  console.log('Phone validation input:', phone, 'cleaned:', cleaned);
  
  // Handle different input formats
  let formatted: string;
  
  if (cleaned.startsWith('+91')) {
    // Already in +91 format - ensure it's exactly right
    formatted = cleaned;
  } else if (cleaned.length === 10 && /^\d{10}$/.test(cleaned)) {
    // Indian mobile number without country code (10 digits)
    formatted = `+91${cleaned}`;
  } else if (cleaned.length === 12 && cleaned.startsWith('91') && /^91\d{10}$/.test(cleaned)) {
    // Indian number with 91 prefix (12 digits total)
    formatted = `+${cleaned}`;
  } else {
    return { isValid: false, formatted: '', error: 'Phone number must be a 10-digit Indian mobile number' };
  }
  
  console.log('Formatted phone number:', formatted, 'length:', formatted.length);
  
  // Validate against single source of truth regex - exactly 13 characters: +91XXXXXXXXXX
  if (!INDIAN_PHONE_REGEX.test(formatted) || formatted.length !== 13) {
    console.log('Phone validation failed for:', formatted, 'regex test:', INDIAN_PHONE_REGEX.test(formatted), 'length check:', formatted.length === 13);
    return { isValid: false, formatted: '', error: 'Phone number must be in format +91XXXXXXXXXX (exactly 13 characters)' };
  }
  
  console.log('Phone validation successful for:', formatted);
  return { isValid: true, formatted };
};
