import { useState, useEffect } from "react";
import { useStatusBasedStudentFetcher, StudentWithStatus } from "../utils/statusBasedStudentFetcher";

export function useStatusBasedStudents(status: string) {
  const [students, setStudents] = useState<StudentWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const { 
    fetchStudentsByStatus, 
    reactivateStudent: reactivateStudentUtil 
  } = useStatusBasedStudentFetcher();

  const loadStudents = async () => {
    try {
      setLoading(true);
      const studentsData = await fetchStudentsByStatus(status);
      setStudents(studentsData);
    } catch (error) {
      console.error(`Error loading ${status} students:`, error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateStudent = async (studentId: string) => {
    try {
      await reactivateStudentUtil(studentId);
      await loadStudents(); // Refresh the list
    } catch (error) {
      console.error('Error reactivating student:', error);
    }
  };

  useEffect(() => {
    loadStudents();
  }, [status]);

  return {
    students,
    loading,
    refreshStudents: loadStudents,
    reactivateStudent: handleReactivateStudent,
  };
}