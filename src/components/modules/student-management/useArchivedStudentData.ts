import { useState, useEffect } from "react";
import { useArchivedStudentFetcher, ArchivedStudent } from "./utils/archivedStudentFetcher";

export function useArchivedStudentData() {
  const [archivedStudents, setArchivedStudents] = useState<ArchivedStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchArchivedStudents, restoreStudent: restoreStudentUtil } = useArchivedStudentFetcher();

  const loadArchivedStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await fetchArchivedStudents();
      setArchivedStudents(studentsData);
    } catch (error) {
      console.error('Error loading archived students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreStudent = async (id: string) => {
    try {
      await restoreStudentUtil(id);
      await loadArchivedStudents(); // Refresh the list
    } catch (error) {
      console.error('Error restoring student:', error);
    }
  };

  useEffect(() => {
    loadArchivedStudents();
  }, []);

  return {
    archivedStudents,
    loading,
    fetchArchivedStudents: loadArchivedStudents,
    restoreStudent: handleRestoreStudent,
  };
}