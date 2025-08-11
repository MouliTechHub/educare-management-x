import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AcademicYear {
  id: string;
  year_name: string;
  start_date: string;
  end_date: string;
  is_current: boolean;
  created_at: string;
  updated_at: string;
}

type Mode = "system" | "manual";

interface AcademicYearContextValue {
  academicYears: AcademicYear[];
  systemCurrentYearId: string | null;
  selectedYearId: string | null; // effective selected year (system or manual)
  mode: Mode;
  setManualYear: (id: string) => void; // switch to manual and set id
  followSystemYear: () => void; // switch back to system
  refreshYears: () => Promise<void>;
}

const AcademicYearContext = createContext<AcademicYearContextValue | undefined>(undefined);

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [systemCurrentYearId, setSystemCurrentYearId] = useState<string | null>(null);
  const [selectedYearId, setSelectedYearId] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("system");

  const refreshYears = async () => {
    const { data, error } = await supabase
      .from("academic_years")
      .select("*")
      .order("start_date", { ascending: false });

    if (error) {
      console.error("Error fetching academic years:", error);
      toast({ title: "Error", description: "Failed to load academic years", variant: "destructive" });
      return;
    }

    setAcademicYears(data || []);
    const current = (data || []).find((y) => y.is_current) || null;
    const currentId = current?.id || null;
    const previousSystemId = systemCurrentYearId;
    setSystemCurrentYearId(currentId);

    // If following system, update selection to new system id
    if (mode === "system") {
      setSelectedYearId(currentId);
    }

    // Notify on change
    if (previousSystemId && currentId && previousSystemId !== currentId) {
      toast({
        title: "Academic year changed",
        description: `${current?.year_name || "Current year"} is now active across the app`,
      });
    }
  };

  useEffect(() => {
    refreshYears();
    // Subscribe to realtime changes for academic_years
    const channel = supabase
      .channel("academic_years_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "academic_years" },
        () => {
          // Any insert/update/delete could impact current year or list
          refreshYears();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // In case provider mounts before initial fetch completes, ensure selection tracks system
  useEffect(() => {
    if (mode === "system" && systemCurrentYearId && selectedYearId !== systemCurrentYearId) {
      setSelectedYearId(systemCurrentYearId);
    }
  }, [mode, systemCurrentYearId, selectedYearId]);

  const value = useMemo<AcademicYearContextValue>(() => ({
    academicYears,
    systemCurrentYearId,
    selectedYearId,
    mode,
    setManualYear: (id: string) => {
      setMode("manual");
      setSelectedYearId(id);
    },
    followSystemYear: () => {
      setMode("system");
      setSelectedYearId(systemCurrentYearId);
    },
    refreshYears,
  }), [academicYears, systemCurrentYearId, selectedYearId, mode]);

  return <AcademicYearContext.Provider value={value}>{children}</AcademicYearContext.Provider>;
};

export const useAcademicYear = () => {
  const ctx = useContext(AcademicYearContext);
  if (!ctx) throw new Error("useAcademicYear must be used within AcademicYearProvider");
  return ctx;
};
