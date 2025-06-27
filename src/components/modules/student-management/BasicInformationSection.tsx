
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Class } from "@/types/database";
import { bloodGroups, religions, casteCategories } from "./constants";
import { StudentFormData } from "./types";

interface BasicInformationSectionProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
  classes: Class[];
}

export function BasicInformationSection({ formData, setFormData, classes }: BasicInformationSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="admission_number">Admission Number *</Label>
          <Input
            id="admission_number"
            value={formData.admission_number}
            onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
            required
            placeholder="Must be unique"
          />
          <p className="text-xs text-gray-500 mt-1">Each student must have a unique admission number</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="date_of_birth">Date of Birth *</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth}
            onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="gender">Gender *</Label>
          <Select value={formData.gender} onValueChange={(value) => setFormData({ ...formData, gender: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
          <Input
            id="aadhaar_number"
            value={formData.aadhaar_number}
            onChange={(e) => setFormData({ ...formData, aadhaar_number: e.target.value })}
            placeholder="12-digit Aadhaar number"
            maxLength={12}
          />
          <p className="text-xs text-gray-500 mt-1">12-digit unique identification number</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="class_id">Class</Label>
          <Select value={formData.class_id} onValueChange={(value) => setFormData({ ...formData, class_id: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} {cls.section && `- ${cls.section}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="blood_group">Blood Group</Label>
          <Select value={formData.blood_group} onValueChange={(value) => setFormData({ ...formData, blood_group: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {bloodGroups.map((group) => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="religion">Religion</Label>
          <Select value={formData.religion} onValueChange={(value) => setFormData({ ...formData, religion: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select religion" />
            </SelectTrigger>
            <SelectContent>
              {religions.map((religion) => (
                <SelectItem key={religion} value={religion}>
                  {religion}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="caste_category">Caste/Category</Label>
          <Select value={formData.caste_category} onValueChange={(value) => setFormData({ ...formData, caste_category: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {casteCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
              <SelectItem value="Alumni">Alumni</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
