import { useState, useCallback } from 'react';

interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  email?: boolean;
  password?: boolean;
  custom?: (value: string) => string | null;
}

interface ValidationErrors {
  [key: string]: string;
}

export function useInputValidation() {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateField = useCallback((value: string, rules: ValidationRules): string | null => {
    if (rules.required && !value.trim()) {
      return 'This field is required';
    }

    if (value && rules.minLength && value.length < rules.minLength) {
      return `Minimum length is ${rules.minLength} characters`;
    }

    if (value && rules.maxLength && value.length > rules.maxLength) {
      return `Maximum length is ${rules.maxLength} characters`;
    }

    if (value && rules.pattern && !rules.pattern.test(value)) {
      return 'Invalid format';
    }

    if (value && rules.email) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(value)) {
        return 'Invalid email format';
      }
    }

    if (value && rules.password) {
      const hasUpperCase = /[A-Z]/.test(value);
      const hasLowerCase = /[a-z]/.test(value);
      const hasNumbers = /\d/.test(value);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      
      if (value.length < 8) {
        return 'Password must be at least 8 characters long';
      }
      if (!hasUpperCase) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!hasLowerCase) {
        return 'Password must contain at least one lowercase letter';
      }
      if (!hasNumbers) {
        return 'Password must contain at least one number';
      }
      if (!hasSpecialChar) {
        return 'Password must contain at least one special character';
      }
    }

    if (value && rules.custom) {
      return rules.custom(value);
    }

    return null;
  }, []);

  const validate = useCallback((fieldName: string, value: string, rules: ValidationRules) => {
    const error = validateField(value, rules);
    
    setErrors(prev => ({
      ...prev,
      [fieldName]: error || ''
    }));

    return !error;
  }, [validateField]);

  const validateAll = useCallback((fields: { [key: string]: { value: string; rules: ValidationRules } }) => {
    const newErrors: ValidationErrors = {};
    let isValid = true;

    Object.entries(fields).forEach(([fieldName, { value, rules }]) => {
      const error = validateField(value, rules);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      } else {
        newErrors[fieldName] = '';
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [validateField]);

  const clearError = useCallback((fieldName: string) => {
    setErrors(prev => ({ ...prev, [fieldName]: '' }));
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  return {
    errors,
    validate,
    validateAll,
    clearError,
    clearAllErrors
  };
}