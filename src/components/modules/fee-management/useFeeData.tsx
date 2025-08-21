import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useEffect, useState } from 'react';
import { Fee, AcademicYear } from './types/feeTypes';

// Transform function to convert database record to Fee interface
function transformToFee(record: any): Fee {
  const student = record.student;
  const studentData = Array.isArray(student) ? student[0] : student;
  
  return {
    id: record.id,
    student_id: record.student_id,
    fee_type: record.fee_type,
    actual_fee: record.actual_fee,
    discount_amount: record.discount_amount,
    paid_amount: record.paid_amount,
    final_fee: record.final_fee || (record.actual_fee - record.discount_amount),
    balance_fee: record.balance_fee || ((record.actual_fee - record.discount_amount) - record.paid_amount),
    due_date: record.due_date,
    status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
    created_at: record.created_at,
    updated_at: record.updated_at,
    discount_notes: record.discount_notes,
    discount_updated_by: record.discount_updated_by,
    discount_updated_at: record.discount_updated_at,
    academic_year_id: record.academic_year_id,
    class_id: record.class_id,
    student: studentData ? {
      id: studentData.id || '',
      first_name: studentData.first_name || '',
      last_name: studentData.last_name || '',
      admission_number: studentData.admission_number || '',
      class_name: studentData.classes?.name || 'Unknown',
      section: studentData.classes?.section,
      class_id: studentData.class_id || '',
      gender: undefined,
      status: undefined,
      parent_phone: undefined,
      parent_email: undefined,
    } : undefined,
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
    queryKey: ['student-fee-records', stableAcademicYearId],
    queryFn: async () => {
      console.log('🔄 Fetching student fee records for year:', stableAcademicYearId);
      
      const { data, error } = await supabase
        .from('student_fee_records')
        .select(`
          *,
          student:students!student_id (
            id,
            first_name,
            last_name,
            admission_number,
            class_id,
            classes:class_id (
              name,
              section
            )
          )
        `)
        .eq('academic_year_id', stableAcademicYearId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching student fee records:', error);
        throw error;
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