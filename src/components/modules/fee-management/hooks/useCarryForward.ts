import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface CarryForwardRecord {
  id: string;
  student_id: string;
  from_academic_year_id: string;
  to_academic_year_id: string;
  original_amount: number;
  carried_amount: number;
  carry_forward_type: string;
  status: string;
  created_at: string;
  created_by: string;
  notes?: string;
  student?: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  from_year?: {
    year_name: string;
  };
  to_year?: {
    year_name: string;
  };
}

export function useCarryForward() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const getCarryForwardRecords = async (filters?: {
    studentId?: string;
    fromYearId?: string;
    toYearId?: string;
    status?: string;
  }) => {
    try {
      let query = supabase
        .from("fee_carry_forward")
        .select(`
          *,
          students:student_id (
            first_name,
            last_name,
            admission_number
          ),
          from_year:from_academic_year_id (
            year_name
          ),
          to_year:to_academic_year_id (
            year_name
          )
        `)
        .order("created_at", { ascending: false });

      // Apply filters
      if (filters?.studentId) {
        query = query.eq("student_id", filters.studentId);
      }
      if (filters?.fromYearId) {
        query = query.eq("from_academic_year_id", filters.fromYearId);
      }
      if (filters?.toYearId) {
        query = query.eq("to_academic_year_id", filters.toYearId);
      }
      if (filters?.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []) as unknown as CarryForwardRecord[];
    } catch (error: any) {
      console.error("Error fetching carry forward records:", error);
      toast({
        title: "Error",
        description: "Failed to fetch carry forward records",
        variant: "destructive",
      });
      return [];
    }
  };

  const carryForwardFees = async (
    studentId: string,
    fromAcademicYearId: string,
    toAcademicYearId: string,
    carryForwardType: string = "manual",
    createdBy: string = "Admin"
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("carry_forward_student_fees", {
        p_student_id: studentId,
        p_from_academic_year_id: fromAcademicYearId,
        p_to_academic_year_id: toAcademicYearId,
        p_carry_forward_type: carryForwardType,
        p_created_by: createdBy,
      });

      if (error) throw error;

      const result = data as {
        success: boolean;
        carry_forward_id?: string;
        new_fee_record_id?: string;
        outstanding_amount?: number;
        message: string;
      };

      if (result.success) {
        toast({
          title: "Success",
          description: result.message,
        });
      } else {
        toast({
          title: "Info",
          description: result.message,
          variant: "default",
        });
      }

      return result;
    } catch (error: any) {
      console.error("Error carrying forward fees:", error);
      toast({
        title: "Error",
        description: "Failed to carry forward fees",
        variant: "destructive",
      });
      return { success: false, message: "Failed to carry forward fees" };
    } finally {
      setLoading(false);
    }
  };

  const bulkCarryForward = async (
    studentIds: string[],
    fromAcademicYearId: string,
    toAcademicYearId: string,
    carryForwardType: string = "bulk",
    createdBy: string = "Admin"
  ) => {
    setLoading(true);
    const results = [];
    
    try {
      for (const studentId of studentIds) {
        const result = await carryForwardFees(
          studentId,
          fromAcademicYearId,
          toAcademicYearId,
          carryForwardType,
          createdBy
        );
        results.push({ studentId, ...result });
      }

      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      toast({
        title: "Bulk Carry Forward Complete",
        description: `${successful} successful, ${failed} failed`,
      });

      return results;
    } catch (error: any) {
      console.error("Error in bulk carry forward:", error);
      toast({
        title: "Error",
        description: "Bulk carry forward failed",
        variant: "destructive",
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  const waiveCarryForward = async (
    carryForwardId: string,
    reason: string,
    waivedBy: string = "Admin"
  ) => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("fee_carry_forward")
        .update({
          status: "waived",
          notes: reason,
          updated_at: new Date().toISOString(),
        })
        .eq("id", carryForwardId);

      if (error) throw error;

      // Also update the corresponding fee record
      const { data: feeRecord } = await supabase
        .from("student_fee_records")
        .select("actual_fee")
        .eq("carry_forward_source_id", carryForwardId)
        .single();

      const { error: feeUpdateError } = await supabase
        .from("student_fee_records")
        .update({
          status: "Waived",
          discount_amount: feeRecord?.actual_fee || 0,
          discount_notes: `Carry forward waived: ${reason}`,
          discount_updated_by: waivedBy,
          discount_updated_at: new Date().toISOString(),
        })
        .eq("carry_forward_source_id", carryForwardId);

      if (feeUpdateError) throw feeUpdateError;

      toast({
        title: "Success",
        description: "Carry forward amount waived successfully",
      });

      return true;
    } catch (error: any) {
      console.error("Error waiving carry forward:", error);
      toast({
        title: "Error",
        description: "Failed to waive carry forward",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getCarryForwardRecords,
    carryForwardFees,
    bulkCarryForward,
    waiveCarryForward,
  };
}