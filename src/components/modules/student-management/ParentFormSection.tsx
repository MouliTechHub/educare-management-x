
import { Button } from "@/components/ui/button";
import { Plus, Trash2 } from "lucide-react";
import { ParentFormData } from "./types";
import { useState } from "react";
import { validateAndFormatPhoneNumber, validateEmail, validatePinCode, validateAmount } from "./utils/formValidation";
import { ParentFormBasicInfo } from "./ParentFormBasicInfo";
import { ParentFormContactInfo } from "./ParentFormContactInfo";
import { ParentFormProfessionalInfo } from "./ParentFormProfessionalInfo";

interface ParentFormSectionProps {
  parents: ParentFormData[];
  setParents: (parents: ParentFormData[]) => void;
}

export function ParentFormSection({ parents, setParents }: ParentFormSectionProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string>>>({});

  const addParent = () => {
    setParents([...parents, {
      first_name: "",
      last_name: "",
      relation: "",
      phone_number: "",
      email: "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      pin_code: "",
      occupation: "",
      annual_income: "",
      employer_name: "",
      employer_address: "",
      alternate_phone: "",
      aadhaar_number: "",
      pan_number: "",
      education_qualification: "",
    }]);
  };

  const removeParent = (index: number) => {
    if (parents.length > 1) {
      setParents(parents.filter((_, i) => i !== index));
      // Remove validation errors for this parent
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const updateParent = (index: number, field: keyof ParentFormData, value: string) => {
    const updatedParents = [...parents];
    updatedParents[index][field] = value;
    setParents(updatedParents);
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[index]?.[field]) {
      const newErrors = { ...validationErrors };
      if (!newErrors[index]) newErrors[index] = {};
      delete newErrors[index][field];
      setValidationErrors(newErrors);
    }
  };

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
        
      case 'pin_code':
        if (value.trim()) {
          const pinValidation = validatePinCode(value);
          if (!pinValidation.isValid) {
            error = pinValidation.error || 'Invalid PIN code';
          }
        }
        break;
        
      case 'annual_income':
        if (value.trim()) {
          const amountValidation = validateAmount(value);
          if (!amountValidation.isValid) {
            error = amountValidation.error || 'Invalid amount';
          }
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

  // Function to validate all parents before submission
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold border-b pb-2">Parent Information</h3>
        <Button type="button" onClick={addParent} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Add Parent
        </Button>
      </div>
      
      {parents.map((parent, index) => (
        <div key={index} className="border p-4 rounded-lg space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Parent {index + 1}</h4>
            {parents.length > 1 && (
              <Button
                type="button"
                onClick={() => removeParent(index)}
                variant="outline"
                size="sm"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>

          <ParentFormBasicInfo
            parent={parent}
            index={index}
            updateParent={updateParent}
            validationErrors={validationErrors[index] || {}}
            onFieldBlur={validateField}
          />

          <ParentFormProfessionalInfo
            parent={parent}
            index={index}
            updateParent={updateParent}
            validationErrors={validationErrors[index] || {}}
            onFieldBlur={validateField}
          />

          <ParentFormContactInfo
            parent={parent}
            index={index}
            updateParent={updateParent}
            validationErrors={validationErrors[index] || {}}
            onFieldBlur={validateField}
          />
        </div>
      ))}
    </div>
  );
}
