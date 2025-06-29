
import React, { useState } from "react";
import { ParentFormData } from "./types";
import { ParentFormActions, createEmptyParent } from "./ParentFormActions";
import { ParentFormCard } from "./ParentFormCard";
import { useParentFormValidation } from "./ParentFormValidation";

interface ParentFormSectionProps {
  parents: ParentFormData[];
  setParents: (parents: ParentFormData[]) => void;
}

export function ParentFormSection({ parents, setParents }: ParentFormSectionProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, Record<string, string>>>({});

  const { validateField } = useParentFormValidation({
    parents,
    setParents,
    validationErrors,
    setValidationErrors,
  });

  const addParent = () => {
    setParents([...parents, createEmptyParent()]);
  };

  const removeParent = (index: number) => {
    if (parents.length > 1) {
      setParents(parents.filter((_, i) => i !== index));
      // Remove validation errors for this parent
      const newErrors = { ...validationErrors };
      delete newErrors[index];
      setValidationErrors(newErrors);
    }
  };

  const updateParent = (index: number, field: keyof ParentFormData, value: string) => {
    const updatedParents = [...parents];
    updatedParents[index][field] = value;
    setParents(updatedParents);
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[index]?.[field]) {
      const newErrors = { ...validationErrors };
      if (!newErrors[index]) newErrors[index] = {};
      delete newErrors[index][field];
      setValidationErrors(newErrors);
    }
  };

  return (
    <div className="space-y-4">
      <ParentFormActions onAddParent={addParent} />
      
      {parents.map((parent, index) => (
        <ParentFormCard
          key={index}
          parent={parent}
          index={index}
          totalParents={parents.length}
          updateParent={updateParent}
          onRemoveParent={removeParent}
          validationErrors={validationErrors[index] || {}}
          onFieldBlur={validateField}
        />
      ))}
    </div>
  );
}
