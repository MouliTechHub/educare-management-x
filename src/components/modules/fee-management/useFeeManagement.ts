
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Class, Fee } from './types/feeTypes';

interface EnhancedFilterState {
  classId: string;
  section: string;
  status: string;
  feeType: string;
  dueDateFrom: string;
  dueDateTo: string;
  hasDiscount: string;
  paymentStatus: string;
  searchParent: string;
}

export function useFeeManagement() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<EnhancedFilterState>({
    classId: '',
    section: '',
    status: '',
    feeType: '',
    dueDateFrom: '',
    dueDateTo: '',
    hasDiscount: '',
    paymentStatus: '',
    searchParent: ''
  });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedStudentFees, setSelectedStudentFees] = useState<Fee[]>([]);
  const [selectedStudentName, setSelectedStudentName] = useState('');

  // Fetch classes
  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section, homeroom_teacher_id, created_at, updated_at")
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
    }
  };

  const openHistoryDialog = (student: any, fees: Fee[]) => {
    setSelectedStudentName(`${student.first_name} ${student.last_name}`);
    setSelectedStudentFees(fees);
    setHistoryDialogOpen(true);
  };

  const applyFilters = (fees: Fee[]) => {
    return fees.filter(fee => {
      // Class filter
      if (filters.classId && filters.classId !== 'all' && fee.class_id !== filters.classId) {
        return false;
      }

      // Section filter
      if (filters.section && filters.section !== 'all' && fee.student?.section !== filters.section) {
        return false;
      }

      // Status filter
      if (filters.status && filters.status !== 'all' && fee.status !== filters.status) {
        return false;
      }

      // Fee type filter
      if (filters.feeType && filters.feeType !== 'all' && fee.fee_type !== filters.feeType) {
        return false;
      }

      // Date range filters
      if (filters.dueDateFrom && fee.due_date && new Date(fee.due_date) < new Date(filters.dueDateFrom)) {
        return false;
      }

      if (filters.dueDateTo && fee.due_date && new Date(fee.due_date) > new Date(filters.dueDateTo)) {
        return false;
      }

      // Discount filter
      if (filters.hasDiscount === 'yes' && fee.discount_amount <= 0) {
        return false;
      }
      if (filters.hasDiscount === 'no' && fee.discount_amount > 0) {
        return false;
      }

      // Payment status filter
      if (filters.paymentStatus === 'has_payment' && fee.paid_amount <= 0) {
        return false;
      }
      if (filters.paymentStatus === 'no_payment' && fee.paid_amount > 0) {
        return false;
      }

      // Parent search filter
      if (filters.searchParent) {
        const searchLower = filters.searchParent.toLowerCase();
        const hasParentMatch = 
          fee.student?.parent_phone?.toLowerCase().includes(searchLower) ||
          fee.student?.parent_email?.toLowerCase().includes(searchLower);
        if (!hasParentMatch) {
          return false;
        }
      }

      return true;
    });
  };

  return {
    classes,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    historyDialogOpen,
    setHistoryDialogOpen,
    selectedStudentFees,
    selectedStudentName,
    openHistoryDialog,
    applyFilters
  };
}
