
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDiscountData() {
  // Fetch current academic year
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  // Fetch fee structures
  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee-structures'],
    queryFn: async () => {
      const currentYear = academicYears.find(year => year.is_current);
      if (!currentYear) return [];
      
      const { data, error } = await supabase
        .from('fee_structures')
        .select('*')
        .eq('academic_year_id', currentYear.id)
        .eq('is_active', true);
      
      if (error) throw error;
      return data || [];
    },
    enabled: academicYears.length > 0
  });

  // Fetch existing fee records from consolidated system
  const { data: existingFees = [] } = useQuery({
    queryKey: ['existing-student-fee-records'],
    queryFn: async () => {
      const currentYear = academicYears.find(year => year.is_current);
      if (!currentYear) return [];
      
      const { data, error } = await supabase
        .from('student_fee_records')
        .select('*')
        .eq('academic_year_id', currentYear.id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: academicYears.length > 0
  });

  return {
    academicYears,
    feeStructures,
    existingFees
  };
}
