
import { useAcademicYear } from "@/contexts/AcademicYearContext";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export function useAcademicYears() {
  const {
    academicYears,
    selectedYearId,
    setManualYear,
  } = useAcademicYear();

  return {
    academicYears: academicYears as AcademicYear[],
    currentAcademicYear: selectedYearId || "",
    setCurrentAcademicYear: (id: string) => setManualYear(id),
  };
}
