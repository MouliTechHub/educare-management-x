
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentFormData } from "./types";

interface AddressSectionProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
}

export function AddressSection({ formData, setFormData }: AddressSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Address Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="address_line1">Address Line 1</Label>
          <Input
            id="address_line1"
            value={formData.address_line1}
            onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="address_line2">Address Line 2</Label>
          <Input
            id="address_line2"
            value={formData.address_line2}
            onChange={(e) => setFormData({ ...formData, address_line2: e.target.value })}
          />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="pin_code">PIN Code</Label>
          <Input
            id="pin_code"
            value={formData.pin_code}
            onChange={(e) => setFormData({ ...formData, pin_code: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
