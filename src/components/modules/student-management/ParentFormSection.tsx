
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { relations } from "./constants";
import { ParentFormData } from "./types";
import { useState } from "react";
import { validateAndFormatPhoneNumber, validateEmail, validatePinCode, validateAmount } from "./utils/formValidation";

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
        if (value) {
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
        if (value) {
          const emailValidation = validateEmail(value);
          if (!emailValidation.isValid) {
            error = emailValidation.error || 'Invalid email format';
          }
        }
        break;
      case 'pin_code':
        if (value) {
          const pinValidation = validatePinCode(value);
          if (!pinValidation.isValid) {
            error = pinValidation.error || 'Invalid PIN code';
          }
        }
        break;
      case 'annual_income':
        if (value) {
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

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>First Name *</Label>
              <Input
                value={parent.first_name}
                onChange={(e) => updateParent(index, 'first_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Last Name *</Label>
              <Input
                value={parent.last_name}
                onChange={(e) => updateParent(index, 'last_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Relation *</Label>
              <Select value={parent.relation} onValueChange={(value) => updateParent(index, 'relation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select relation" />
                </SelectTrigger>
                <SelectContent>
                  {relations.map((relation) => (
                    <SelectItem key={relation} value={relation}>
                      {relation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Phone Number *</Label>
              <Input
                value={parent.phone_number}
                onChange={(e) => updateParent(index, 'phone_number', e.target.value)}
                onBlur={(e) => validateField(index, 'phone_number', e.target.value)}
                required
                placeholder="+91XXXXXXXXXX or 10-digit number"
              />
              {validationErrors[index]?.phone_number && (
                <p className="text-xs text-destructive mt-1">{validationErrors[index].phone_number}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">Enter phone number (will be formatted automatically)</p>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={parent.email}
                onChange={(e) => updateParent(index, 'email', e.target.value)}
                onBlur={(e) => validateField(index, 'email', e.target.value)}
                required
                placeholder="parent@example.com"
              />
              {validationErrors[index]?.email && (
                <p className="text-xs text-destructive mt-1">{validationErrors[index].email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Occupation</Label>
              <Input
                value={parent.occupation}
                onChange={(e) => updateParent(index, 'occupation', e.target.value)}
              />
            </div>
            <div>
              <Label>Annual Income</Label>
              <Input
                type="number"
                value={parent.annual_income}
                onChange={(e) => updateParent(index, 'annual_income', e.target.value)}
                onBlur={(e) => validateField(index, 'annual_income', e.target.value)}
                placeholder="Enter amount in numbers"
                min="0"
              />
              {validationErrors[index]?.annual_income && (
                <p className="text-xs text-destructive mt-1">{validationErrors[index].annual_income}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Address Line 1</Label>
              <Input
                value={parent.address_line1}
                onChange={(e) => updateParent(index, 'address_line1', e.target.value)}
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={parent.city}
                onChange={(e) => updateParent(index, 'city', e.target.value)}
              />
            </div>
            <div>
              <Label>PIN Code</Label>
              <Input
                value={parent.pin_code}
                onChange={(e) => {
                  // Only allow digits and limit to 6 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                  updateParent(index, 'pin_code', value);
                }}
                onBlur={(e) => validateField(index, 'pin_code', e.target.value)}
                placeholder="6-digit PIN code"
                maxLength={6}
              />
              {validationErrors[index]?.pin_code && (
                <p className="text-xs text-destructive mt-1">{validationErrors[index].pin_code}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Employer Name</Label>
              <Input
                value={parent.employer_name}
                onChange={(e) => updateParent(index, 'employer_name', e.target.value)}
              />
            </div>
            <div>
              <Label>Alternate Phone</Label>
              <Input
                value={parent.alternate_phone}
                onChange={(e) => updateParent(index, 'alternate_phone', e.target.value)}
                onBlur={(e) => validateField(index, 'alternate_phone', e.target.value)}
                placeholder="+91XXXXXXXXXX or 10-digit number (optional)"
              />
              {validationErrors[index]?.alternate_phone && (
                <p className="text-xs text-destructive mt-1">{validationErrors[index].alternate_phone}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Aadhaar Number</Label>
              <Input
                value={parent.aadhaar_number}
                onChange={(e) => {
                  // Only allow digits and limit to 12 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                  updateParent(index, 'aadhaar_number', value);
                }}
                placeholder="12-digit Aadhaar number"
                maxLength={12}
              />
            </div>
            <div>
              <Label>PAN Number</Label>
              <Input
                value={parent.pan_number}
                onChange={(e) => {
                  // Allow only alphanumeric and convert to uppercase
                  const value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 10);
                  updateParent(index, 'pan_number', value);
                }}
                placeholder="10-character PAN"
                maxLength={10}
              />
            </div>
            <div>
              <Label>Education Qualification</Label>
              <Input
                value={parent.education_qualification}
                onChange={(e) => updateParent(index, 'education_qualification', e.target.value)}
                placeholder="Highest qualification"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
