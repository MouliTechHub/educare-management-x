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
    mutationFn: async (yearData: Omit<AcademicYear, 'id' | 'created_at' | 'updated_at'>) => {
      // If marking as current, first unset all other current years
      if (yearData.is_current) {
        await supabase
          .from("academic_years")
          .update({ is_current: false })
          .neq("id", "");
      }

      const { data, error } = await supabase
        .from("academic_years")
        .insert([yearData])
        .select()
        .single();

      if (error) throw error;
      return data;
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
      // If marking as current, first unset all other current years
      if (yearData.is_current) {
        await supabase
          .from("academic_years")
          .update({ is_current: false })
          .neq("id", yearData.id);
      }

      const { data, error } = await supabase
        .from("academic_years")
        .update(yearData)
        .eq("id", yearData.id)
        .select()
        .single();

      if (error) throw error;
      return data;
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