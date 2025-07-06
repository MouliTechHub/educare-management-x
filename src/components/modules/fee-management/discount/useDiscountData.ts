
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useDiscountData() {
  console.log('🔍 useDiscountData: Fetching data for discount dialog');

  // Fetch current academic year
  const { data: academicYears = [] } = useQuery({
    queryKey: ['academic-years-for-discount'],
    queryFn: async () => {
      console.log('📅 Fetching academic years...');
      const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching academic years:', error);
        throw error;
      }
      console.log('✅ Academic years fetched:', data?.length || 0);
      return data || [];
    }
  });

  // Return only what's needed - no fee structures or other queries that might reference fees table
  return {
    academicYears
  };
}
