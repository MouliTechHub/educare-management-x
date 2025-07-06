
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoFeeAssignment } from './hooks/useAutoFeeAssignment';
import { Fee } from './types/feeTypes';

export const useFeeData = () => {
  const [fees, setFees] = useState<Fee[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { assignFeesToStudents } = useAutoFeeAssignment();

  const fetchAcademicYears = async () => {
    const { data, error } = await supabase
      .from('academic_years')
      .select('*')
      .order('is_current', { ascending: false })
      .order('start_date', { ascending: false });

    if (error) {
      console.error('Error fetching academic years:', error);
      return;
    }

    setAcademicYears(data || []);
    const current = data?.find(year => year.is_current);
    if (current && !currentAcademicYear) {
      setCurrentAcademicYear(current.id);
    }
  };

  const fetchFees = async (academicYearId: string) => {
    if (!academicYearId) return;

    console.log('🔄 Auto-assigning fees before fetching data...');
    await assignFeesToStudents(academicYearId);

    console.log('📊 Fetching fees for academic year:', academicYearId);

    try {
      // Fetch from the single student_fee_records table
      const { data: feeRecords, error } = await supabase
        .from('student_fee_records')
        .select(`
          id,
          student_id,
          class_id,
          fee_type,
          actual_fee,
          discount_amount,
          paid_amount,
          final_fee,
          balance_fee,
          due_date,
          status,
          academic_year_id,
          created_at,
          updated_at,
          discount_notes,
          discount_updated_by,
          discount_updated_at,
          students!inner (
            id,
            first_name,
            last_name,
            admission_number,
            class_id,
            classes!inner (
              id,
              name,
              section
            )
          )
        `)
        .eq('academic_year_id', academicYearId)
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Error fetching fee records:', error);
        setFees([]);
        return;
      }

      console.log('✅ Fee data fetched:', feeRecords?.length || 0, 'records');

      // Transform data to match Fee interface
      const processedFees: Fee[] = (feeRecords || []).map(record => ({
        id: record.id,
        student_id: record.student_id,
        fee_type: record.fee_type,
        actual_fee: record.actual_fee,
        discount_amount: record.discount_amount,
        paid_amount: record.paid_amount,
        final_fee: record.final_fee || (record.actual_fee - record.discount_amount),
        balance_fee: record.balance_fee || (record.actual_fee - record.discount_amount - record.paid_amount),
        due_date: record.due_date,
        status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
        created_at: record.created_at,
        updated_at: record.updated_at,
        discount_notes: record.discount_notes,
        discount_updated_by: record.discount_updated_by,
        discount_updated_at: record.discount_updated_at,
        academic_year_id: record.academic_year_id,
        class_id: record.class_id,
        student: {
          id: record.students.id,
          first_name: record.students.first_name,
          last_name: record.students.last_name,
          admission_number: record.students.admission_number,
          class_name: record.students.classes.name,
          section: record.students.classes.section,
          class_id: record.students.class_id,
          gender: undefined,
          status: undefined,
          parent_phone: undefined,
          parent_email: undefined
        }
      }));

      const uniqueFeeTypes = [...new Set(processedFees.map(f => f.fee_type))];
      console.log('🔍 Unique fee types found:', uniqueFeeTypes);
      console.log('✅ Final processed fees:', processedFees.length);

      setFees(processedFees);
    } catch (error) {
      console.error('Error in fetchFees:', error);
      setFees([]);
    } finally {
      setLoading(false);
    }
  };

  const refetchFees = () => {
    if (currentAcademicYear) {
      setLoading(true);
      fetchFees(currentAcademicYear);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (currentAcademicYear) {
      fetchFees(currentAcademicYear);
    }
  }, [currentAcademicYear]);

  return {
    fees,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    loading,
    refetchFees
  };
};
