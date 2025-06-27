
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useDatabaseConnection = () => {
  const { toast } = useToast();

  const testDatabaseConnection = async () => {
    try {
      console.log('Testing database connection...');
      const { data, error } = await supabase.from('students').select('count').limit(1);
      if (error) {
        console.error('Database connection test failed:', error);
        toast({
          title: "Database Connection Error",
          description: "Unable to connect to the database. Please check your connection.",
          variant: "destructive",
        });
      } else {
        console.log('Database connection successful');
      }
    } catch (error) {
      console.error('Database connection test error:', error);
    }
  };

  return { testDatabaseConnection };
};
