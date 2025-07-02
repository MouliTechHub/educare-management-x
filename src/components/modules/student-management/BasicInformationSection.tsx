
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Class } from "@/types/database";
import { useState } from "react";

interface BasicInformationSectionProps {
  formData: any;
  setFormData: (data: any) => void;
  classes: Class[];
}

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal", "Delhi", "Jammu and Kashmir", "Ladakh"
];

const CASTE_CATEGORIES = ["SC", "ST", "OC", "BC-A", "BC-B", "BC-C", "BC-D", "BC-E", "EWS"];
const RELIGIONS = ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Parsi", "Other"];
const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export function BasicInformationSection({ formData, setFormData, classes }: BasicInformationSectionProps) {
  const [aadhaarError, setAadhaarError] = useState<string>('');

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleAadhaarBlur = (value: string) => {
    if (value.trim()) {
      if (!/^[0-9]{12}$/.test(value.replace(/\s/g, ''))) {
        setAadhaarError('Aadhaar number must be exactly 12 digits');
      } else {
        const formatted = value.replace(/\s/g, '');
        handleInputChange('aadhaar_number', formatted);
        setAadhaarError('');
      }
    } else {
      setAadhaarError('');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Basic Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Personal Information Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name *</Label>
            <Input
              id="first_name"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name *</Label>
            <Input
              id="last_name"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="admission_number">Admission Number *</Label>
            <Input
              id="admission_number"
              value={formData.admission_number}
              onChange={(e) => handleInputChange('admission_number', e.target.value)}
              required
            />
          </div>
        </div>

        {/* Dates and Gender Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth *</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date_of_join">Date of Joining (Admission Date) *</Label>
            <Input
              id="date_of_join"
              type="date"
              value={formData.date_of_join || ''}
              onChange={(e) => handleInputChange('date_of_join', e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Gender *</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange('gender', value)}
            >
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
        </div>

        {/* Class and Status Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="class_id">Class *</Label>
            <Select
              value={formData.class_id || undefined}
              onValueChange={(value) => handleInputChange('class_id', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} {cls.section && `- Section ${cls.section}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status || "Active"}
              onValueChange={(value) => handleInputChange('status', value)}
            >
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

        {/* Identity Information Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="aadhaar_number">Aadhaar Number</Label>
            <Input
              id="aadhaar_number"
              value={formData.aadhaar_number || ''}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 12);
                handleInputChange('aadhaar_number', value);
                if (aadhaarError) setAadhaarError('');
              }}
              onBlur={(e) => handleAadhaarBlur(e.target.value)}
              placeholder="XXXX XXXX XXXX"
              maxLength={14}
            />
            {aadhaarError && (
              <p className="text-xs text-destructive mt-1">{aadhaarError}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">12-digit unique identity number</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="caste_category">Caste Category *</Label>
            <Select value={formData.caste_category || undefined} onValueChange={(value) => handleInputChange('caste_category', value)}>
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

          <div className="space-y-2">
            <Label htmlFor="religion">Religion</Label>
            <Select value={formData.religion || undefined} onValueChange={(value) => handleInputChange('religion', value)}>
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
        </div>

        {/* Additional Information Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="blood_group">Blood Group</Label>
            <Select value={formData.blood_group || undefined} onValueChange={(value) => handleInputChange('blood_group', value)}>
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

          <div className="space-y-2">
            <Label htmlFor="mother_tongue">Mother Tongue</Label>
            <Input
              id="mother_tongue"
              value={formData.mother_tongue || ''}
              onChange={(e) => handleInputChange('mother_tongue', e.target.value)}
              placeholder="e.g., Hindi, Tamil, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nationality">Nationality</Label>
            <Input
              id="nationality"
              value={formData.nationality || 'Indian'}
              onChange={(e) => handleInputChange('nationality', e.target.value)}
              placeholder="Indian"
            />
          </div>
        </div>

        {/* School Information Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="previous_school">Previous School</Label>
            <Input
              id="previous_school"
              value={formData.previous_school || ''}
              onChange={(e) => handleInputChange('previous_school', e.target.value)}
              placeholder="Name of previous school"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="transfer_certificate">Transfer Certificate Number</Label>
            <Input
              id="transfer_certificate"
              value={formData.transfer_certificate || ''}
              onChange={(e) => handleInputChange('transfer_certificate', e.target.value)}
              placeholder="TC number from previous school"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
