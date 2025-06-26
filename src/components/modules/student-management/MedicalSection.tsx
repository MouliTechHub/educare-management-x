
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { StudentFormData } from "./types";

interface MedicalSectionProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
}

export function MedicalSection({ formData, setFormData }: MedicalSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Medical Information</h3>
      <div>
        <Label htmlFor="medical_information">Medical Information / Allergies</Label>
        <Textarea
          id="medical_information"
          value={formData.medical_information}
          onChange={(e) => setFormData({ ...formData, medical_information: e.target.value })}
          placeholder="Any medical conditions, allergies, or special requirements..."
          rows={3}
        />
      </div>
    </div>
  );
}
