
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { ParentFormData } from "./types";
import { ParentFormBasicInfo } from "./ParentFormBasicInfo";
import { ParentFormContactInfo } from "./ParentFormContactInfo";
import { ParentFormProfessionalInfo } from "./ParentFormProfessionalInfo";

interface ParentFormCardProps {
  parent: ParentFormData;
  index: number;
  totalParents: number;
  updateParent: (index: number, field: keyof ParentFormData, value: string) => void;
  onRemoveParent: (index: number) => void;
  validationErrors: Record<string, string>;
  onFieldBlur: (index: number, field: keyof ParentFormData, value: string) => void;
}

export function ParentFormCard({
  parent,
  index,
  totalParents,
  updateParent,
  onRemoveParent,
  validationErrors,
  onFieldBlur,
}: ParentFormCardProps) {
  return (
    <div className="border p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Parent {index + 1}</h4>
        {totalParents > 1 && (
          <Button
            type="button"
            onClick={() => onRemoveParent(index)}
            variant="outline"
            size="sm"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>

      <ParentFormBasicInfo
        parent={parent}
        index={index}
        updateParent={updateParent}
        validationErrors={validationErrors}
        onFieldBlur={onFieldBlur}
      />

      <ParentFormProfessionalInfo
        parent={parent}
        index={index}
        updateParent={updateParent}
        validationErrors={validationErrors}
        onFieldBlur={onFieldBlur}
      />

      <ParentFormContactInfo
        parent={parent}
        index={index}
        updateParent={updateParent}
        validationErrors={validationErrors}
        onFieldBlur={onFieldBlur}
      />
    </div>
  );
}
