import { useState, useEffect } from "react";
import { useInactiveStudentFetcher, InactiveStudent } from "./utils/inactiveStudentFetcher";

export function useInactiveStudentData() {
  const [inactiveStudents, setInactiveStudents] = useState<InactiveStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchInactiveStudents, reactivateStudent: reactivateStudentUtil } = useInactiveStudentFetcher();

  const loadInactiveStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await fetchInactiveStudents();
      setInactiveStudents(studentsData);
    } catch (error) {
      console.error('Error loading inactive students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateStudent = async (id: string) => {
    try {
      await reactivateStudentUtil(id);
      await loadInactiveStudents(); // Refresh the list
    } catch (error) {
      console.error('Error reactivating student:', error);
    }
  };

  useEffect(() => {
    loadInactiveStudents();
  }, []);

  return {
    inactiveStudents,
    loading,
    fetchInactiveStudents: loadInactiveStudents,
    reactivateStudent: handleReactivateStudent,
  };
}