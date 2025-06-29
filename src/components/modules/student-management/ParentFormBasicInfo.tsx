
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { relations } from "./constants";
import { ParentFormData } from "./types";

interface ParentFormBasicInfoProps {
  parent: ParentFormData;
  index: number;
  updateParent: (index: number, field: keyof ParentFormData, value: string) => void;
  validationErrors: Record<string, string>;
  onFieldBlur: (index: number, field: keyof ParentFormData, value: string) => void;
}

export function ParentFormBasicInfo({ 
  parent, 
  index, 
  updateParent, 
  validationErrors, 
  onFieldBlur 
}: ParentFormBasicInfoProps) {
  return (
    <>
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
            onBlur={(e) => onFieldBlur(index, 'phone_number', e.target.value)}
            required
            placeholder="Enter 10-digit number or +91XXXXXXXXXX"
            maxLength={15}
          />
          {validationErrors.phone_number && (
            <p className="text-xs text-destructive mt-1">{validationErrors.phone_number}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Format: +91XXXXXXXXXX (exactly 13 characters)</p>
        </div>
        <div>
          <Label>Email *</Label>
          <Input
            type="email"
            value={parent.email}
            onChange={(e) => updateParent(index, 'email', e.target.value)}
            onBlur={(e) => onFieldBlur(index, 'email', e.target.value)}
            required
            placeholder="parent@example.com"
          />
          {validationErrors.email && (
            <p className="text-xs text-destructive mt-1">{validationErrors.email}</p>
          )}
        </div>
      </div>
    </>
  );
}
