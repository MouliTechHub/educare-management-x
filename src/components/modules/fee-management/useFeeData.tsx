
import { useAcademicYears } from "./hooks/useAcademicYears";
import { useFeeRecords } from "./hooks/useFeeRecords";

export function useFeeData() {
  const { academicYears, currentAcademicYear, setCurrentAcademicYear } = useAcademicYears();
  const { fees, loading, refetchFees } = useFeeRecords(currentAcademicYear);

  return {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    loading,
    refetchFees
  };
}
