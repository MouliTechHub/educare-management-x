
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StudentFormData } from "./types";

interface TransportSectionProps {
  formData: StudentFormData;
  setFormData: (data: StudentFormData) => void;
}

export function TransportSection({ formData, setFormData }: TransportSectionProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold border-b pb-2">Transport Information</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="transport_route">Transport Route</Label>
          <Input
            id="transport_route"
            value={formData.transport_route}
            onChange={(e) => setFormData({ ...formData, transport_route: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="transport_stop">Transport Stop</Label>
          <Input
            id="transport_stop"
            value={formData.transport_stop}
            onChange={(e) => setFormData({ ...formData, transport_stop: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
