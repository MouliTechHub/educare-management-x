
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { relations } from "./constants";
import { ParentFormData } from "./types";

interface ParentFormSectionProps {
  parents: ParentFormData[];
  setParents: (parents: ParentFormData[]) => void;
}

export function ParentFormSection({ parents, setParents }: ParentFormSectionProps) {
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
    }]);
  };

  const removeParent = (index: number) => {
    if (parents.length > 1) {
      setParents(parents.filter((_, i) => i !== index));
    }
  };

  const updateParent = (index: number, field: keyof ParentFormData, value: string) => {
    const updatedParents = [...parents];
    updatedParents[index][field] = value;
    setParents(updatedParents);
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
                required
              />
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={parent.email}
                onChange={(e) => updateParent(index, 'email', e.target.value)}
                required
              />
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
              />
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
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
