import { useState, useMemo } from "react";
import { TeacherSalary } from "@/types/database";

interface SalaryFilters {
  teacherId: string;
  status: string;
  month: string;
  year: string;
  paymentDateFrom: string;
  paymentDateTo: string;
}

export function useTeacherSalaryFilters(salaries: TeacherSalary[], searchTerm: string) {
  const [filters, setFilters] = useState<SalaryFilters>({
    teacherId: '',
    status: 'all',
    month: 'all',
    year: 'all',
    paymentDateFrom: '',
    paymentDateTo: ''
  });

  const updateFilter = (key: keyof SalaryFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      teacherId: '',
      status: 'all',
      month: 'all',
      year: 'all',
      paymentDateFrom: '',
      paymentDateTo: ''
    });
  };

  const filteredSalaries = useMemo(() => {
    return salaries.filter(salary => {
      // Search term filter (would need teacher data joined)
      if (searchTerm) {
        // This would need to be implemented with teacher data
        // const searchLower = searchTerm.toLowerCase();
        // For now, skip search term filtering in this hook
      }

      // Teacher filter
      if (filters.teacherId && salary.teacher_id !== filters.teacherId) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && salary.status !== filters.status) {
        return false;
      }

      // Month filter
      if (filters.month && filters.month !== 'all' && salary.month !== parseInt(filters.month)) {
        return false;
      }

      // Year filter
      if (filters.year && filters.year !== 'all' && salary.year !== parseInt(filters.year)) {
        return false;
      }

      // Payment date filters
      if (filters.paymentDateFrom && salary.payment_date && salary.payment_date < filters.paymentDateFrom) {
        return false;
      }
      if (filters.paymentDateTo && salary.payment_date && salary.payment_date > filters.paymentDateTo) {
        return false;
      }

      return true;
    });
  }, [salaries, searchTerm, filters]);

  return {
    filters,
    filteredSalaries,
    updateFilter,
    clearFilters
  };
}