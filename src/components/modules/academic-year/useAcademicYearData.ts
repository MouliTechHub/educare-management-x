import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AcademicYear } from "@/types/database";

export function useAcademicYearData() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch academic years
  const { data: academicYears = [], isLoading, error } = useQuery({
    queryKey: ["academic-years", searchTerm],
    queryFn: async () => {
      let query = supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (searchTerm) {
        query = query.ilike("year_name", `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Create academic year mutation
  const createMutation = useMutation({
    mutationFn: async (
      yearData: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>
    ) => {
      // Always insert first; then, if needed, set current atomically via RPC
      const { data: inserted, error: insertError } = await supabase
        .from("academic_years")
        .insert([
          {
            year_name: yearData.year_name,
            start_date: yearData.start_date,
            end_date: yearData.end_date,
            // insert as not current; RPC will flip it atomically if requested
            is_current: false,
          },
        ])
        .select()
        .single();

      if (insertError) throw insertError;

      if (yearData.is_current) {
        const { data, error } = await (supabase.rpc as any)(
          "set_current_academic_year",
          { p_year_id: inserted.id }
        );
        if (error) throw error;
        return data;
      }

      return inserted;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast({
        title: "Success",
        description: "Academic year created successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create academic year.",
        variant: "destructive",
      });
    },
  });

  // Update academic year mutation
  const updateMutation = useMutation({
    mutationFn: async (yearData: AcademicYear) => {
      const { id, year_name, start_date, end_date, is_current } = yearData;

      // Update non-status fields first
      const { error: updError } = await supabase
        .from("academic_years")
        .update({ year_name, start_date, end_date })
        .eq("id", id);
      if (updError) throw updError;

      if (is_current) {
        // Atomically set this as the single current year
        const { data, error } = await (supabase.rpc as any)(
          "set_current_academic_year",
          { p_year_id: id }
        );
        if (error) throw error;
        return data;
      } else {
        // Ensure it's not current
        const { data, error } = await supabase
          .from("academic_years")
          .update({ is_current: false })
          .eq("id", id)
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast({
        title: "Success",
        description: "Academic year updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update academic year.",
        variant: "destructive",
      });
    },
  });

  // Delete academic year mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("academic_years")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["academic-years"] });
      toast({
        title: "Success",
        description: "Academic year deleted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete academic year.",
        variant: "destructive",
      });
    },
  });

  // Pagination
  const totalPages = Math.ceil(academicYears.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedYears = academicYears.slice(startIndex, endIndex);

  return {
    academicYears: paginatedYears,
    allAcademicYears: academicYears,
    isLoading,
    error,
    searchTerm,
    setSearchTerm,
    currentPage,
    setCurrentPage,
    totalPages,
    createYear: createMutation.mutate,
    updateYear: updateMutation.mutate,
    deleteYear: deleteMutation.mutate,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}