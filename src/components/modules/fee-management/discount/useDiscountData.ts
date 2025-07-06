
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

  // Remove the existingFees query that might be causing issues
  // Only return what's actually needed
  return {
    academicYears,
    feeStructures
  };
}
