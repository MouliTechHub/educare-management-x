
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentFormData } from "./types";
import { useState } from "react";
import { validateAndFormatPhoneNumber } from "./utils/formValidation";

interface EmergencyContactSectionProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
}

export function EmergencyContactSection({ formData, setFormData }: EmergencyContactSectionProps) {
  const [phoneError, setPhoneError] = useState<string>('');

  const handlePhoneChange = (value: string) => {
    setFormData({ ...formData, emergency_contact_phone: value });
    // Clear error when user starts typing
    if (phoneError) setPhoneError('');
  };

  const handlePhoneBlur = (value: string) => {
    if (value.trim()) {
      const phoneValidation = validateAndFormatPhoneNumber(value);
      if (!phoneValidation.isValid) {
        setPhoneError(phoneValidation.error || 'Invalid phone number format');
      } else {
        setFormData({ ...formData, emergency_contact_phone: phoneValidation.formatted });
        setPhoneError('');
      }
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Emergency Contact</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="emergency_contact_name">Emergency Contact Name</Label>
          <Input
            id="emergency_contact_name"
            value={formData.emergency_contact_name}
            onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="emergency_contact_phone">Emergency Contact Phone</Label>
          <Input
            id="emergency_contact_phone"
            value={formData.emergency_contact_phone}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={(e) => handlePhoneBlur(e.target.value)}
            placeholder="Enter 10-digit number or +91XXXXXXXXXX"
            maxLength={15}
          />
          {phoneError && (
            <p className="text-xs text-destructive mt-1">{phoneError}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters)</p>
        </div>
        <div>
          <Label htmlFor="emergency_contact_relation">Relation</Label>
          <Input
            id="emergency_contact_relation"
            value={formData.emergency_contact_relation}
            onChange={(e) => setFormData({ ...formData, emergency_contact_relation: e.target.value })}
            placeholder="e.g., Uncle, Aunt"
          />
        </div>
      </div>
    </div>
  );
}
