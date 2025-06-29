
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ParentFormData } from "./types";

interface ParentFormContactInfoProps {
  parent: ParentFormData;
  index: number;
  updateParent: (index: number, field: keyof ParentFormData, value: string) => void;
  validationErrors: Record<string, string>;
  onFieldBlur: (index: number, field: keyof ParentFormData, value: string) => void;
}

export function ParentFormContactInfo({ 
  parent, 
  index, 
  updateParent, 
  validationErrors, 
  onFieldBlur 
}: ParentFormContactInfoProps) {
  return (
    <>
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
              const value = e.target.value.replace(/\D/g, '').slice(0, 6);
              updateParent(index, 'pin_code', value);
            }}
            onBlur={(e) => onFieldBlur(index, 'pin_code', e.target.value)}
            placeholder="6-digit PIN code"
            maxLength={6}
          />
          {validationErrors.pin_code && (
            <p className="text-xs text-destructive mt-1">{validationErrors.pin_code}</p>
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
            onBlur={(e) => onFieldBlur(index, 'alternate_phone', e.target.value)}
            placeholder="Enter 10-digit number or +91XXXXXXXXXX (optional)"
            maxLength={15}
          />
          {validationErrors.alternate_phone && (
            <p className="text-xs text-destructive mt-1">{validationErrors.alternate_phone}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters, optional)</p>
        </div>
      </div>
    </>
  );
}
