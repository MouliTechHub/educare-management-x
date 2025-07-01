
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
}

export function useAcademicYears() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<string>("");
  const { toast } = useToast();

  const fetchAcademicYears = async () => {
    try {
      console.log('🔄 Fetching academic years...');
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      console.log('✅ Academic years fetched:', data?.length || 0);
      setAcademicYears(data || []);
      
      // Set current year as default
      const currentYear = data?.find(year => year.is_current);
      if (currentYear) {
        console.log('✅ Setting current academic year:', currentYear.year_name);
        setCurrentAcademicYear(currentYear.id);
      } else if (data && data.length > 0) {
        console.log('⚠️ No current year found, using first year:', data[0].year_name);
        setCurrentAcademicYear(data[0].id);
      } else {
        console.log('❌ No academic years found');
      }
    } catch (error: any) {
      console.error("❌ Error fetching academic years:", error);
      toast({
        title: "Error fetching academic years",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  return {
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear
  };
}
