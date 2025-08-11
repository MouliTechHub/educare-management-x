
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoFeeAssignment } from './hooks/useAutoFeeAssignment';
import { Fee, StudentFeeRecord } from './types/feeTypes';
import { useQuery } from '@tanstack/react-query';
import { useAcademicYear } from '@/contexts/AcademicYearContext';

// Function to transform StudentFeeRecord to Fe
function transformToFee(record: StudentFeeRecord): Fee {
  // Ensure status is one of the allowed values, default to 'Pending'
  const validStatuses: Array<'Pending' | 'Paid' | 'Overdue' | 'Partial'> = ['Pending', 'Paid', 'Overdue', 'Partial'];
  const status = validStatuses.includes(record.status as any) ? (record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial') : 'Pending';
  
  return {
    id: record.id,
    student_id: record.student_id,
    fee_type: record.fee_type,
    actual_fee: record.actual_fee,
    discount_amount: record.discount_amount,
    paid_amount: record.paid_amount,
    final_fee: record.final_fee || (record.actual_fee - record.discount_amount),
    balance_fee: record.balance_fee || ((record.actual_fee - record.discount_amount) - record.paid_amount),
    due_date: record.due_date || '',
    status: status,
    created_at: record.created_at,
    updated_at: record.updated_at,
    discount_notes: record.discount_notes || undefined,
    discount_updated_by: record.discount_updated_by || undefined,
    discount_updated_at: record.discount_updated_at || undefined,
    academic_year_id: record.academic_year_id,
    class_id: record.class_id,
    student: record.student ? {
      id: record.student.id,
      first_name: record.student.first_name,
      last_name: record.student.last_name,
      admission_number: record.student.admission_number,
      class_name: record.student.classes?.name || '',
      section: record.student.classes?.section || undefined,
      class_id: record.student.class_id,
    } : undefined
  };
}

export function useFeeData() {
  const { academicYears, selectedYearId, setManualYear } = useAcademicYear();
  const [loading, setLoading] = useState(true);

  const stableAcademicYearId = selectedYearId || '';

  const { data: fees = [], error: feesError, refetch: refetchFees, isLoading: feesLoading } = useQuery({
    queryKey: ['student-fee-records', stableAcademicYearId],
    queryFn: async (): Promise<Fee[]> => {
      if (!stableAcademicYearId) {
        console.log('⚠️ No current academic year selected, returning empty fees');
        return [];
      }

      console.log('💰 Fetching fees from student_fee_records for year:', stableAcademicYearId);
      const { data, error } = await supabase
        .from('student_fee_records')
        .select(`
          *,
          student:students(
            id,
            first_name,
            last_name,
            admission_number,
            class_id,
            classes(name, section)
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
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000,
  });

  useEffect(() => {
    const handlePaymentRecorded = () => {
      refetchFees();
    };
    window.addEventListener('payment-recorded', handlePaymentRecorded);
    return () => window.removeEventListener('payment-recorded', handlePaymentRecorded);
  }, [refetchFees]);

  useEffect(() => {
    setLoading(feesLoading);
  }, [feesLoading]);

  if (feesError) {
    console.error('❌ Fees data error:', feesError);
  }

  const currentAcademicYear = academicYears.find((y) => y.id === selectedYearId);

  return {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear: (year: any) => setManualYear(typeof year === 'string' ? year : year?.id),
    loading,
    refetchFees
  };
}
