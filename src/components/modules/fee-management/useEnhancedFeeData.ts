import { useFeeRecords } from "./hooks/useFeeRecords";
import { useAcademicYears } from "./hooks/useAcademicYears";
import { useFeeActions } from "./hooks/useFeeActions";

export function useEnhancedFeeData() {
  const { academicYears, currentAcademicYear, selectedAcademicYear, setSelectedAcademicYear } = useAcademicYears();
  const { feeRecords, loading, refetchFeeRecords } = useFeeRecords(selectedAcademicYear);
  const { updateDiscount, recordPayment, getChangeHistory, getPaymentHistory } = useFeeActions();

  return {
    feeRecords,
    academicYears,
    currentAcademicYear,
    selectedAcademicYear,
    setSelectedAcademicYear,
    loading,
    updateDiscount,
    recordPayment,
    getChangeHistory,
    getPaymentHistory,
    refetchFeeRecords
  };
}
