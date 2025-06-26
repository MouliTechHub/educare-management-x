
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentFormData } from "./types";

interface AcademicSectionProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
}

export function AcademicSection({ formData, setFormData }: AcademicSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Academic Information</h3>
      <div>
        <Label htmlFor="previous_school">Previous School</Label>
        <Input
          id="previous_school"
          value={formData.previous_school}
          onChange={(e) => setFormData({ ...formData, previous_school: e.target.value })}
        />
      </div>
    </div>
  );
}
