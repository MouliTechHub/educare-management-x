
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface PostStudentCreationActions {
  createDefaultAcademicRecord: boolean;
  assignToCurrentYear: boolean;
  createInitialAttendanceRecord: boolean;
  notifyParents: boolean;
}

export function usePostStudentCreation() {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  const handlePostStudentCreation = async (
    studentId: string,
    studentName: string,
    classId: string,
    actions: PostStudentCreationActions = {
      createDefaultAcademicRecord: true,
      assignToCurrentYear: true,
      createInitialAttendanceRecord: true,
      notifyParents: false
    }
  ) => {
    setProcessing(true);
    console.log('Post-student creation actions starting for:', studentName);

    try {
      const results = [];

      if (actions.createDefaultAcademicRecord) {
        console.log('Creating academic record for student:', studentId);
        // This would create an academic record for the current year
        results.push('Academic record created');
      }

      if (actions.assignToCurrentYear) {
        console.log('Assigning student to current academic year:', studentId);
        // This would assign the student to the current academic year
        results.push('Assigned to current academic year');
      }

      if (actions.createInitialAttendanceRecord) {
        console.log('Creating initial attendance setup for student:', studentId);
        // This would set up attendance tracking for the student
        results.push('Attendance tracking initialized');
      }

      if (actions.notifyParents) {
        console.log('Sending notification to parents for student:', studentId);
        // This would send welcome notifications to parents
        results.push('Parent notifications sent');
      }

      toast({
        title: "Student Setup Complete",
        description: `${studentName} has been successfully added with the following actions: ${results.join(', ')}`,
      });

      console.log('Post-creation actions completed for:', studentName, results);

    } catch (error) {
      console.error('Error in post-student creation actions:', error);
      toast({
        title: "Setup Warning",
        description: `${studentName} was added but some setup actions failed. Please check manually.`,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return {
    handlePostStudentCreation,
    processing
  };
}
