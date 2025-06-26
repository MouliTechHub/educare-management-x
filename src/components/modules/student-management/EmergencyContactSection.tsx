
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentFormData } from "./types";

interface EmergencyContactSectionProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
}

export function EmergencyContactSection({ formData, setFormData }: EmergencyContactSectionProps) {
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
            onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
          />
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
