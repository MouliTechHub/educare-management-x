
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
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const { toast } = useToast();

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      console.log('Academic years fetched:', data?.length || 0);
      setAcademicYears(data || []);
      
      const current = data?.find(year => year.is_current);
      if (current) {
        setCurrentAcademicYear(current);
        if (!selectedAcademicYear) {
          setSelectedAcademicYear(current.id);
        }
      }
    } catch (error: any) {
      console.error('Error fetching academic years:', error);
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

  useEffect(() => {
    if (!selectedAcademicYear && currentAcademicYear) {
      setSelectedAcademicYear(currentAcademicYear.id);
    }
  }, [currentAcademicYear, selectedAcademicYear]);

  return {
    academicYears,
    currentAcademicYear,
    selectedAcademicYear,
    setSelectedAcademicYear
  };
}
