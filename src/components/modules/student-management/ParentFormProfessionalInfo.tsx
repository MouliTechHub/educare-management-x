
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParentFormData } from "./types";

interface ParentFormProfessionalInfoProps {
  parent: ParentFormData;
  index: number;
  updateParent: (index: number, field: keyof ParentFormData, value: string) => void;
  validationErrors: Record<string, string>;
  onFieldBlur: (index: number, field: keyof ParentFormData, value: string) => void;
}

export function ParentFormProfessionalInfo({ 
  parent, 
  index, 
  updateParent, 
  validationErrors, 
  onFieldBlur 
}: ParentFormProfessionalInfoProps) {
  return (
    <>
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
            onBlur={(e) => onFieldBlur(index, 'annual_income', e.target.value)}
            placeholder="Enter amount in numbers"
            min="0"
          />
          {validationErrors.annual_income && (
            <p className="text-xs text-destructive mt-1">{validationErrors.annual_income}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Aadhaar Number</Label>
          <Input
            value={parent.aadhaar_number}
            onChange={(e) => {
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
    </>
  );
}
