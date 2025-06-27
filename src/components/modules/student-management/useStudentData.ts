
import { useState, useEffect } from "react";
import { Student, Class } from "@/types/database";
import { useStudentFetcher } from "./utils/studentFetcher";
import { useClassFetcher } from "./utils/classFetcher";
import { useStudentDeleter } from "./utils/studentDeleter";
import { useDatabaseConnection } from "./utils/databaseConnection";

export function useStudentData() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  const { fetchStudents } = useStudentFetcher();
  const { fetchClasses } = useClassFetcher();
  const { deleteStudent: deleteStudentUtil } = useStudentDeleter();
  const { testDatabaseConnection } = useDatabaseConnection();

  const loadStudents = async () => {
    try {
      const studentsData = await fetchStudents();
      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClasses = async () => {
    try {
      const classesData = await fetchClasses();
      setClasses(classesData);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const handleDeleteStudent = async (id: string) => {
    await deleteStudentUtil(id);
    loadStudents();
  };

  useEffect(() => {
    loadStudents();
    loadClasses();
    testDatabaseConnection();
  }, []);

  return {
    students,
    classes,
    loading,
    fetchStudents: loadStudents,
    deleteStudent: handleDeleteStudent,
  };
}
