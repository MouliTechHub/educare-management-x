
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAutoFeeAssignment } from './hooks/useAutoFeeAssignment';

export interface Fee {
  id: string;
  student_id: string;
  fee_type: string;
  amount: number;
  actual_amount: number;
  discount_amount: number;
  total_paid: number;
  due_date: string;
  payment_date: string | null;
  status: string;
  notes?: string;
  academic_year_id: string;
  receipt_number: string | null;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_id: string;
    class_name?: string;
    section?: string;
  };
}

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
      // Fetch from enhanced fee system first
      const { data: enhancedFees, error: enhancedError } = await supabase
        .from('student_fee_records')
        .select(`
          id,
          student_id,
          fee_type,
          actual_fee,
          discount_amount,
          paid_amount,
          due_date,
          status,
          academic_year_id,
          created_at,
          updated_at,
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

      if (enhancedError) {
        console.error('Error fetching enhanced fees:', enhancedError);
      }

      console.log('✅ Enhanced fee data fetched:', enhancedFees?.length || 0, 'records');

      // Fetch from main fees table for additional data and to ensure consistency
      const { data: mainFees, error: mainError } = await supabase
        .from('fees')
        .select(`
          id,
          student_id,
          fee_type,
          amount,
          actual_amount,
          discount_amount,
          total_paid,
          due_date,
          payment_date,
          status,
          notes,
          academic_year_id,
          receipt_number,
          created_at,
          updated_at,
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

      if (mainError) {
        console.error('Error fetching main fees:', mainError);
      }

      console.log('✅ Legacy fee data fetched:', mainFees?.length || 0, 'records');

      // Process and merge fee data
      const processedFees: Fee[] = [];
      const seenCombinations = new Set();

      // Process main fees first (they are the primary source)
      if (mainFees) {
        for (const fee of mainFees) {
          const key = `${fee.student_id}-${fee.fee_type}-${fee.academic_year_id}`;
          if (!seenCombinations.has(key)) {
            seenCombinations.add(key);
            processedFees.push({
              id: fee.id,
              student_id: fee.student_id,
              fee_type: fee.fee_type,
              amount: fee.amount,
              actual_amount: fee.actual_amount,
              discount_amount: fee.discount_amount,
              total_paid: fee.total_paid,
              due_date: fee.due_date,
              payment_date: fee.payment_date,
              status: fee.status,
              notes: fee.notes,
              academic_year_id: fee.academic_year_id,
              receipt_number: fee.receipt_number,
              created_at: fee.created_at,
              updated_at: fee.updated_at,
              student: {
                id: fee.students.id,
                first_name: fee.students.first_name,
                last_name: fee.students.last_name,
                admission_number: fee.students.admission_number,
                class_id: fee.students.class_id,
                class_name: fee.students.classes.name,
                section: fee.students.classes.section,
              }
            });
          }
        }
      }

      // Add enhanced fees that are not in main fees
      if (enhancedFees) {
        for (const fee of enhancedFees) {
          const key = `${fee.student_id}-${fee.fee_type}-${fee.academic_year_id}`;
          if (!seenCombinations.has(key)) {
            seenCombinations.add(key);
            processedFees.push({
              id: fee.id,
              student_id: fee.student_id,
              fee_type: fee.fee_type,
              amount: fee.actual_fee,
              actual_amount: fee.actual_fee,
              discount_amount: fee.discount_amount,
              total_paid: fee.paid_amount,
              due_date: fee.due_date,
              payment_date: null,
              status: fee.status,
              notes: '',
              academic_year_id: fee.academic_year_id,
              receipt_number: null,
              created_at: fee.created_at,
              updated_at: fee.updated_at,
              student: {
                id: fee.students.id,
                first_name: fee.students.first_name,
                last_name: fee.students.last_name,
                admission_number: fee.students.admission_number,
                class_id: fee.students.class_id,
                class_name: fee.students.classes.name,
                section: fee.students.classes.section,
              }
            });
          }
        }
      }

      const uniqueFeeTypes = [...new Set(processedFees.map(f => f.fee_type))];
      console.log('🔍 Unique fee types found:', uniqueFeeTypes);

      console.log('✅ Final processed fees:', processedFees.length);
      
      // Add debug logging for fees with student data
      const feesWithStudents = processedFees.filter(f => f.student);
      console.log('📊 Fees with student data:', feesWithStudents.length);
      
      // Log unique combinations
      const combinations = processedFees.map(f => `${f.student?.first_name} ${f.student?.last_name} - ${f.fee_type}`);
      console.log('🔍 Unique fee combinations:', [...new Set(combinations)].length);

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
