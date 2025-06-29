
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
    
    // Clear validation error for this field
    if (validationErrors[index]?.[field]) {
      const newErrors = { ...validationErrors };
      if (!newErrors[index]) newErrors[index] = {};
      delete newErrors[index][field];
      setValidationErrors(newErrors);
    }
  };

  const validateField = (index: number, field: keyof ParentFormData, value: string) => {
    let error = '';
    
    switch (field) {
      case 'phone_number':
      case 'alternate_phone':
        if (value.trim()) {
          const phoneValidation = validateAndFormatPhoneNumber(value);
          if (!phoneValidation.isValid) {
            error = phoneValidation.error || 'Invalid phone number format';
          } else {
            // Update with formatted phone number
            updateParent(index, field, phoneValidation.formatted);
          }
        }
        break;
      case 'email':
        if (value.trim()) {
          const emailValidation = validateEmail(value);
          if (!emailValidation.isValid) {
            error = emailValidation.error || 'Invalid email format';
          }
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
    
    if (error) {
      const newErrors = { ...validationErrors };
      if (!newErrors[index]) newErrors[index] = {};
      newErrors[index][field] = error;
      setValidationErrors(newErrors);
    }
  };

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
