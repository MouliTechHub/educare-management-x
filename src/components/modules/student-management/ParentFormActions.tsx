
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ParentFormData } from "./types";

interface ParentFormActionsProps {
  onAddParent: () => void;
}

export function ParentFormActions({ onAddParent }: ParentFormActionsProps) {
  return (
    <div className="flex items-center justify-between">
      <h3 className="text-lg font-semibold border-b pb-2">Parent Information</h3>
      <Button type="button" onClick={onAddParent} variant="outline" size="sm">
        <Plus className="w-4 h-4 mr-1" />
        Add Parent
      </Button>
    </div>
  );
}

export function createEmptyParent(): ParentFormData {
  return {
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
    aadhaar_number: "",
    pan_number: "",
    education_qualification: "",
  };
}
