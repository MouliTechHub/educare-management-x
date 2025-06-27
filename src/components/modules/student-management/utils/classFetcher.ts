
import { supabase } from "@/integrations/supabase/client";
import { Class } from "@/types/database";
import { useToast } from "@/hooks/use-toast";

export const useClassFetcher = () => {
  const { toast } = useToast();

  const fetchClasses = async (): Promise<Class[]> => {
    try {
      console.log('Fetching classes...');
      const { data, error } = await supabase
        .from("classes")
        .select("*")
        .order("name");

      if (error) {
        console.error('Error fetching classes:', error);
        throw error;
      }
      
      console.log('Fetched classes:', data);
      return data || [];
    } catch (error: any) {
      console.error("Error fetching classes:", error);
      toast({
        title: "Error fetching classes",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  return { fetchClasses };
};
