
import { useMemo } from "react";

interface Fee {
  id: string;
  student_id: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  fee_type: string;
  due_date: string;
  payment_date: string | null;
  status: 'Pending' | 'Paid' | 'Overdue';
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  discount_notes: string | null;
  discount_updated_by: string | null;
  discount_updated_at: string | null;
  academic_year_id: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_name?: string;
    section?: string;
    parent_phone?: string;
    parent_email?: string;
    class_id?: string;
  };
}

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export function useYearWiseSummary(fees: Fee[], academicYears: AcademicYear[], selectedAcademicYear: string) {
  return useMemo(() => {
    const currentYear = academicYears.find(year => year.id === selectedAcademicYear);
    
    if (!currentYear) {
      return {
        academicYear: '',
        totalCollected: 0,
        totalPending: 0,
        totalDiscount: 0,
        totalStudents: 0,
        collectionRate: 0,
        overdueCount: 0
      };
    }

    const yearFees = fees.filter(fee => fee.academic_year_id === selectedAcademicYear);
    
    const totalCollected = yearFees.reduce((sum, fee) => sum + (fee.total_paid || 0), 0);
    const totalDiscount = yearFees.reduce((sum, fee) => sum + (fee.discount_amount || 0), 0);
    const totalPending = yearFees.reduce((sum, fee) => {
      const finalFee = (fee.actual_amount || 0) - (fee.discount_amount || 0);
      const balance = finalFee - (fee.total_paid || 0);
      return sum + Math.max(0, balance);
    }, 0);
    
    const totalExpected = totalCollected + totalPending + totalDiscount;
    const collectionRate = totalExpected > 0 ? (totalCollected / totalExpected) * 100 : 0;
    
    const uniqueStudents = new Set(yearFees.map(fee => fee.student_id));
    const totalStudents = uniqueStudents.size;
    
    const overdueCount = yearFees.filter(fee => 
      fee.status === 'Pending' && fee.due_date && new Date(fee.due_date) < new Date()
    ).length;

    return {
      academicYear: currentYear.year_name,
      totalCollected,
      totalPending,
      totalDiscount,
      totalStudents,
      collectionRate,
      overdueCount
    };
  }, [fees, academicYears, selectedAcademicYear]);
}
