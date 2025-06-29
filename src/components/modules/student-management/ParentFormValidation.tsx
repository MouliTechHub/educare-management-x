
import React from 'react';
import { ParentFormData } from './types';
import { validateAndFormatPhoneNumber, validateEmail } from './utils/formValidation';

interface ParentFormValidationProps {
  parents: ParentFormData[];
  setParents: (parents: ParentFormData[]) => void;
  validationErrors: Record<string, Record<string, string>>;
  setValidationErrors: (errors: Record<string, Record<string, string>>) => void;
}

export function useParentFormValidation({
  parents,
  setParents,
  validationErrors,
  setValidationErrors,
}: ParentFormValidationProps) {
  const validateField = (index: number, field: keyof ParentFormData, value: string) => {
    let error = '';
    
    console.log(`Validating field ${field} for parent ${index} with value:`, value);
    
    switch (field) {
      case 'phone_number':
        if (!value.trim()) {
          error = 'Phone number is required';
        } else {
          console.log(`Validating primary phone for parent ${index}:`, value);
          const phoneValidation = validateAndFormatPhoneNumber(value);
          console.log(`Primary phone validation result:`, phoneValidation);
          
          if (!phoneValidation.isValid) {
            error = phoneValidation.error || 'Invalid phone number format';
          } else {
            // Update with formatted phone number immediately
            const updatedParents = [...parents];
            updatedParents[index].phone_number = phoneValidation.formatted;
            setParents(updatedParents);
          }
        }
        break;
        
      case 'alternate_phone':
        if (value.trim()) { // Only validate if not empty (alternate phone is optional)
          console.log(`Validating alternate phone for parent ${index}:`, value);
          const phoneValidation = validateAndFormatPhoneNumber(value);
          console.log(`Alternate phone validation result:`, phoneValidation);
          
          if (!phoneValidation.isValid) {
            error = phoneValidation.error || 'Invalid phone number format';
          } else {
            // Update with formatted phone number immediately
            const updatedParents = [...parents];
            updatedParents[index].alternate_phone = phoneValidation.formatted;
            setParents(updatedParents);
          }
        }
        break;
        
      case 'email':
        if (value.trim()) {
          const emailValidation = validateEmail(value);
          if (!emailValidation.isValid) {
            error = emailValidation.error || 'Invalid email format';
          }
        } else {
          error = 'Email is required';
        }
        break;
    }
    
    // Set or clear error
    const newErrors = { ...validationErrors };
    if (!newErrors[index]) newErrors[index] = {};
    
    if (error) {
      newErrors[index][field] = error;
      console.log(`Validation error for ${field}:`, error);
    } else {
      delete newErrors[index][field];
      console.log(`Validation passed for ${field}`);
    }
    
    setValidationErrors(newErrors);
  };

  const validateAllParents = () => {
    let hasErrors = false;
    const allErrors: Record<string, Record<string, string>> = {};

    parents.forEach((parent, index) => {
      const parentErrors: Record<string, string> = {};

      // Validate required fields
      if (!parent.first_name.trim()) {
        parentErrors.first_name = 'First name is required';
        hasErrors = true;
      }
      if (!parent.last_name.trim()) {
        parentErrors.last_name = 'Last name is required';
        hasErrors = true;
      }
      if (!parent.relation.trim()) {
        parentErrors.relation = 'Relation is required';
        hasErrors = true;
      }
      if (!parent.email.trim()) {
        parentErrors.email = 'Email is required';
        hasErrors = true;
      }

      // Validate phone number (required)
      if (!parent.phone_number.trim()) {
        parentErrors.phone_number = 'Phone number is required';
        hasErrors = true;
      } else {
        const phoneValidation = validateAndFormatPhoneNumber(parent.phone_number);
        if (!phoneValidation.isValid) {
          parentErrors.phone_number = phoneValidation.error || 'Invalid phone number format';
          hasErrors = true;
        } else {
          // Update the parent data with formatted number
          const updatedParents = [...parents];
          updatedParents[index].phone_number = phoneValidation.formatted;
          setParents(updatedParents);
        }
      }

      // Validate alternate phone (optional)
      if (parent.alternate_phone && parent.alternate_phone.trim()) {
        const altPhoneValidation = validateAndFormatPhoneNumber(parent.alternate_phone);
        if (!altPhoneValidation.isValid) {
          parentErrors.alternate_phone = altPhoneValidation.error || 'Invalid phone number format';
          hasErrors = true;
        } else {
          // Update the parent data with formatted number
          const updatedParents = [...parents];
          updatedParents[index].alternate_phone = altPhoneValidation.formatted;
          setParents(updatedParents);
        }
      }

      // Validate email format
      if (parent.email.trim()) {
        const emailValidation = validateEmail(parent.email);
        if (!emailValidation.isValid) {
          parentErrors.email = emailValidation.error || 'Invalid email format';
          hasErrors = true;
        }
      }

      if (Object.keys(parentErrors).length > 0) {
        allErrors[index] = parentErrors;
      }
    });

    setValidationErrors(allErrors);
    return !hasErrors;
  };

  // Expose validation function to parent component
  React.useEffect(() => {
    // Add validation function to window object so it can be called from StudentForm
    (window as any).validateParentData = validateAllParents;
  }, [parents]);

  return { validateField, validateAllParents };
}
