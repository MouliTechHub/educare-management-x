
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoFeeAssignment } from './hooks/useAutoFeeAssignment';
import { Fee } from './types/feeTypes';
import { useQuery } from '@tanstack/react-query';

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

  // Fetch fees from student_fee_records ONLY - no references to fees table
  const { data: fees = [], error: feesError, refetch: refetchFees } = useQuery({
    queryKey: ['student-fee-records', currentAcademicYear?.id],
    queryFn: async () => {
      if (!currentAcademicYear) {
        console.log('⚠️ No current academic year selected, returning empty fees');
        return [];
      }

      console.log('💰 Fetching fees from student_fee_records for year:', currentAcademicYear.id);
      
      // ONLY query student_fee_records table - no fees table references
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
      return data || [];
    },
    enabled: !!currentAcademicYear
  });

  // Set current academic year when academic years are loaded
  useEffect(() => {
    if (academicYears.length > 0 && !currentAcademicYear) {
      const current = academicYears.find(year => year.is_current) || academicYears[0];
      console.log('🎯 Setting current academic year:', current?.year_name);
      setCurrentAcademicYear(current);
    }
  }, [academicYears, currentAcademicYear]);

  // Update loading state
  useEffect(() => {
    setLoading(false);
  }, [fees, academicYears]);

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
