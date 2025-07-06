
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoFeeAssignment } from './hooks/useAutoFeeAssignment';
import { Fee, StudentFeeRecord } from './types/feeTypes';
import { useQuery } from '@tanstack/react-query';

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
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Fetch academic years
  const { data: academicYears = [], error: yearError } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      console.log('📅 Fetching academic years for fee data...');
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching academic years:', error);
        throw error;
      }
      console.log('✅ Academic years fetched successfully:', data?.length || 0);
      return data || [];
    }
  });

  // Fetch fees from student_fee_records and transform to Fee type
  const { data: fees = [], error: feesError, refetch: refetchFees } = useQuery({
    queryKey: ['student-fee-records', currentAcademicYear?.id],
    queryFn: async (): Promise<Fee[]> => {
      if (!currentAcademicYear?.id) {
        console.log('⚠️ No current academic year selected, returning empty fees');
        return [];
      }

      console.log('💰 Fetching fees from student_fee_records for year:', currentAcademicYear.id);
      
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
        .eq('academic_year_id', currentAcademicYear.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching student fee records:', error);
        throw error;
      }
      
      console.log('✅ Student fee records fetched successfully:', data?.length || 0);
      
      // Transform the records to Fee type
      const transformedFees = (data || []).map(transformToFee);
      console.log('🔄 Transformed records to Fee type:', transformedFees.length);
      
      return transformedFees;
    },
    enabled: !!currentAcademicYear?.id && typeof currentAcademicYear.id === 'string'
  });

  // Set current academic year when academic years are loaded
  useEffect(() => {
    if (academicYears.length > 0 && !currentAcademicYear) {
      const current = academicYears.find(year => year.is_current) || academicYears[0];
      console.log('🎯 Setting current academic year:', current?.year_name, 'ID:', current?.id);
      setCurrentAcademicYear(current);
    }
  }, [academicYears, currentAcademicYear]);

  // Update loading state based on both queries
  useEffect(() => {
    const isAcademicYearsLoading = academicYears.length === 0;
    const isFeesLoading = currentAcademicYear?.id && fees.length === 0 && !feesError;
    
    setLoading(isAcademicYearsLoading || isFeesLoading);
  }, [fees, academicYears, currentAcademicYear, feesError]);

  if (yearError) {
    console.error('❌ Academic year error:', yearError);
  }
  
  if (feesError) {
    console.error('❌ Fees data error:', feesError);
  }

  return {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    loading,
    refetchFees
  };
}
