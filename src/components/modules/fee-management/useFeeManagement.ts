
import { useState } from "react";
import { useClassData } from "./hooks/useClassData";
import { useFilterState } from "./hooks/useFilterState";
import { useStudentHistory } from "./hooks/useStudentHistory";
import { applyFeeFilters } from "./utils/feeFilters";

export function useFeeManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { classes } = useClassData();
  const { filters, setFilters } = useFilterState();
  const {
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedStudentFees,
    selectedStudentName,
    openHistoryDialog
  } = useStudentHistory();

  const applyFilters = (fees: any[]) => {
    return applyFeeFilters(fees, searchTerm, filters);
  };

  return {
    classes,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedStudentFees,
    selectedStudentName,
    openHistoryDialog,
    applyFilters
  };
}
