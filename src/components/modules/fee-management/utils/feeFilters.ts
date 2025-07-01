
import { Fee } from "../types/feeTypes";

export function applyFeeFilters(
  fees: Fee[],
  searchTerm: string,
  filters: {
    class_id: string;
    section: string;
    status: string;
    fee_type: string;
    due_date_from: string;
    due_date_to: string;
  }
) {
  return fees.filter((fee) => {
    const matchesSearch = fee.student && 
      (`${fee.student.first_name} ${fee.student.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.student.admission_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fee.fee_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (fee.student.class_name && fee.student.class_name.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesClass = filters.class_id === "all" || 
      (fee.student?.class_id === filters.class_id);
    
    const matchesSection = filters.section === "all" || 
      (fee.student?.section === filters.section);
    
    const matchesStatus = filters.status === "all" || 
      fee.status.toLowerCase() === filters.status.toLowerCase();
    
    const matchesFeeType = filters.fee_type === "all" || 
      fee.fee_type === filters.fee_type;
    
    const matchesDueDateFrom = !filters.due_date_from || 
      new Date(fee.due_date) >= new Date(filters.due_date_from);
    
    const matchesDueDateTo = !filters.due_date_to || 
      new Date(fee.due_date) <= new Date(filters.due_date_to);
    
    return matchesSearch && matchesClass && matchesSection && 
           matchesStatus && matchesFeeType && matchesDueDateFrom && matchesDueDateTo;
  });
}
