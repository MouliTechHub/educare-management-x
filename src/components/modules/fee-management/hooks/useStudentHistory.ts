
import { useState } from "react";
import { Fee } from "../types/feeTypes";

export function useStudentHistory() {
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedStudentFees, setSelectedStudentFees] = useState<Fee[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState("");

  const openHistoryDialog = (student: Fee['student'], fees: Fee[]) => {
    if (!student) return;
    
    const studentFees = fees.filter(fee => fee.student_id === student.id);
    setSelectedStudentFees(studentFees);
    setSelectedStudentName(`${student.first_name} ${student.last_name}`);
    setHistoryDialogOpen(true);
  };

  return {
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedStudentFees,
    selectedStudentName,
    openHistoryDialog
  };
}
