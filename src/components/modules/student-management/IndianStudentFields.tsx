
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StudentFormData } from "./types";

interface IndianStudentFieldsProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

const CASTE_CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];
const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function IndianStudentFields({ formData, setFormData }: IndianStudentFieldsProps) {
  const updateField = (field: keyof StudentFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Indian Specific Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
          <Input
            id="aadhaar_number"
            value={formData.aadhaar_number}
            onChange={(e) => updateField('aadhaar_number', e.target.value)}
            placeholder="XXXX XXXX XXXX"
            maxLength={12}
          />
        </div>

        <div>
          <Label htmlFor="caste_category">Caste Category *</Label>
          <Select value={formData.caste_category} onValueChange={(value) => updateField('caste_category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CASTE_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="religion">Religion</Label>
          <Select value={formData.religion} onValueChange={(value) => updateField('religion', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select religion" />
            </SelectTrigger>
            <SelectContent>
              {RELIGIONS.map((religion) => (
                <SelectItem key={religion} value={religion}>{religion}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="blood_group">Blood Group</Label>
          <Select value={formData.blood_group} onValueChange={(value) => updateField('blood_group', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {BLOOD_GROUPS.map((group) => (
                <SelectItem key={group} value={group}>{group}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="mother_tongue">Mother Tongue</Label>
          <Input
            id="mother_tongue"
            value={formData.mother_tongue || ''}
            onChange={(e) => updateField('mother_tongue', e.target.value)}
            placeholder="e.g., Hindi, Tamil, etc."
          />
        </div>

        <div>
          <Label htmlFor="nationality">Nationality</Label>
          <Input
            id="nationality"
            value={formData.nationality || 'Indian'}
            onChange={(e) => updateField('nationality', e.target.value)}
            placeholder="Indian"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="previous_school">Previous School</Label>
          <Input
            id="previous_school"
            value={formData.previous_school}
            onChange={(e) => updateField('previous_school', e.target.value)}
            placeholder="Name of previous school"
          />
        </div>

        <div>
          <Label htmlFor="transfer_certificate">Transfer Certificate Number</Label>
          <Input
            id="transfer_certificate"
            value={formData.transfer_certificate || ''}
            onChange={(e) => updateField('transfer_certificate', e.target.value)}
            placeholder="TC number from previous school"
          />
        </div>
      </div>
    </div>
  );
}
