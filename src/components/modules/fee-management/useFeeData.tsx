import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Fee, AcademicYear } from './types/feeTypes';

// Transform function to convert v_fee_grid record to Fee interface
function transformToFee(record: any): Fee {
  return {
    id: record.tuition_fee_record_id || record.pyd_fee_record_id || '', // Use primary record ID
    student_id: record.student_id,
    fee_type: 'Consolidated', // Since we're showing consolidated data
    actual_fee: record.actual_fee ?? 0,
    discount_amount: record.discount_amount ?? 0,
    paid_amount: record.paid_amount ?? 0,
    final_fee: record.final_fee ?? 0,
    balance_fee: record.balance_fee ?? 0,
    due_date: record.due_date,
    status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
    created_at: record.created_at,
    updated_at: record.updated_at,
    discount_notes: record.discount_notes,
    discount_updated_by: record.discount_updated_by,
    discount_updated_at: record.discount_updated_at,
    academic_year_id: record.academic_year_id,
    class_id: record.class_id,
    previous_year_dues: record.previous_year_dues ?? 0,
    // Record IDs for actions
    tuition_fee_record_id: record.tuition_fee_record_id,
    pyd_fee_record_id: record.pyd_fee_record_id,
    // Optional totals
    final_fee_with_pyd: record.final_fee_with_pyd ?? 0,
    balance_fee_with_pyd: record.balance_fee_with_pyd ?? 0,
    student: {
      id: record.student_id_ref || record.student_id,
      first_name: record.first_name || '',
      last_name: record.last_name || '',
      admission_number: record.admission_number || '',
      class_name: record.class_name || 'Unknown',
      section: record.section,
      class_id: record.student_class_id || record.class_id,
      gender: undefined,
      status: undefined,
      parent_phone: undefined,
      parent_email: undefined,
    },
  };
}

export function useFeeData() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  
  const stableAcademicYearId = currentAcademicYear?.id || '';

  const {
    data: fees = [],
    isLoading: loading,
    error,
    refetch
  } = useQuery({
    queryKey: ['fee-grid', stableAcademicYearId],
    queryFn: async () => {
      console.log('🔄 Fetching fee grid data for year:', stableAcademicYearId);
      
      const { data, error } = await supabase
        .from('v_fee_grid_consolidated')
        .select('*')
        .eq('academic_year_id', stableAcademicYearId)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('❌ Error fetching fee grid data:', error);
        throw error;
      }

      // Sanity check logging - log one sample record
      if (data && data.length > 0) {
        console.debug('[FeeGrid] sample', {
          id: data[0].tuition_fee_record_id || data[0].pyd_fee_record_id,
          actual_fee: data[0].actual_fee,
          discount_amount: data[0].discount_amount,
          paid_amount: data[0].paid_amount,
          final_fee: data[0].final_fee,
          balance_fee: data[0].balance_fee,
          previous_year_dues: data[0].previous_year_dues,
        });
      }

      const transformedFees = (data || []).map(transformToFee);
      return transformedFees;
    },
    enabled: !!stableAcademicYearId,
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Set up event listener for payment events
  useEffect(() => {
    const handlePaymentRecorded = () => {
      console.log('💳 Payment event detected, refetching fee data...');
      refetch();
    };

    window.addEventListener('paymentRecorded', handlePaymentRecorded);
    return () => {
      window.removeEventListener('paymentRecorded', handlePaymentRecorded);
    };
  }, [refetch]);

  // Fetch academic years
  useEffect(() => {
    const fetchAcademicYears = async () => {
      const { data } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (data) {
        setAcademicYears(data);
        const current = data.find(year => year.is_current);
        if (current) {
          setCurrentAcademicYear(current);
        }
      }
    };

    fetchAcademicYears();
  }, []);

  if (error) {
    console.error('❌ Fee data query error:', error);
  }

  return {
    fees,
    loading,
    error: error as Error | null,
    refetch,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear
  };
}