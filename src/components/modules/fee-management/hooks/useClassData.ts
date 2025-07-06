
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Class } from "../types/feeTypes";

export function useClassData() {
  const [classes, setClasses] = useState<Class[]>([]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from("classes")
        .select("id, name, section, homeroom_teacher_id, created_at, updated_at")
        .order("name");

      if (error) throw error;
      setClasses(data || []);
    } catch (error: any) {
      console.error("Error fetching classes:", error);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  return {
    classes,
    fetchClasses
  };
}
