
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
      // Fetch from both tables to ensure we get all fee records
      const [enhancedFeesResult, legacyFeesResult] = await Promise.allSettled([
        // Enhanced system - student_fee_records
        supabase
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
          .order('due_date', { ascending: true }),
        
        // Legacy system - fees table
        supabase
          .from('fees')
          .select(`
            id,
            student_id,
            fee_type,
            actual_amount,
            discount_amount,
            total_paid,
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
          .order('due_date', { ascending: true })
      ]);

      let allFees: Fee[] = [];
      const processedFeeKeys = new Set<string>(); // To avoid duplicates

      // Process enhanced fees first
      if (enhancedFeesResult.status === 'fulfilled' && enhancedFeesResult.value.data) {
        const enhancedFees = enhancedFeesResult.value.data.map((record: any) => {
          const feeKey = `${record.student_id}-${record.fee_type}-${record.academic_year_id}`;
          processedFeeKeys.add(feeKey);
          
          return {
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
          };
        });
        
        allFees.push(...enhancedFees);
        console.log('✅ Enhanced fee records processed:', enhancedFees.length);
      }

      // Process legacy fees (only add if not already processed)
      if (legacyFeesResult.status === 'fulfilled' && legacyFeesResult.value.data) {
        const legacyFees = legacyFeesResult.value.data
          .filter((record: any) => {
            const feeKey = `${record.student_id}-${record.fee_type}-${record.academic_year_id}`;
            return !processedFeeKeys.has(feeKey);
          })
          .map((record: any) => ({
            id: record.id,
            student_id: record.student_id,
            fee_type: record.fee_type,
            actual_fee: record.actual_amount,
            discount_amount: record.discount_amount,
            paid_amount: record.total_paid,
            final_fee: record.actual_amount - record.discount_amount,
            balance_fee: record.actual_amount - record.discount_amount - record.total_paid,
            due_date: record.due_date,
            status: record.status as 'Pending' | 'Paid' | 'Overdue' | 'Partial',
            created_at: record.created_at,
            updated_at: record.updated_at,
            discount_notes: record.discount_notes,
            discount_updated_by: record.discount_updated_by,
            discount_updated_at: record.discount_updated_at,
            academic_year_id: record.academic_year_id,
            class_id: record.students.class_id,
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
        
        allFees.push(...legacyFees);
        console.log('✅ Legacy fee records processed:', legacyFees.length);
      }

      const uniqueFeeTypes = [...new Set(allFees.map(f => f.fee_type))];
      console.log('🔍 Unique fee types found:', uniqueFeeTypes);
      console.log('✅ Final processed fees:', allFees.length);

      setFees(allFees);
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
