
import { useState } from "react";
import { FilterState } from "../types/feeTypes";

export function useFilterState() {
  const [filters, setFilters] = useState<FilterState>({
    class_id: "all",
    section: "all",
    status: "all",
    fee_type: "all",
    due_date_from: "",
    due_date_to: "",
    has_discount: "all",
    payment_status: "all",
    search_parent: ""
  });

  const updateFilter = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return {
    filters,
    setFilters,
    updateFilter
  };
}
