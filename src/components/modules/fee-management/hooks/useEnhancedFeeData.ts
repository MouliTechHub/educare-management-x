import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface EnhancedFeeRecord {
  id: string;
  student_id: string;
  class_id: string;
  academic_year_id: string;
  fee_type: string;
  actual_fee: number;
  discount_amount: number;
  paid_amount: number;
  balance_fee: number;
  due_date: string;
  status: string;
  priority_order: number;
  payment_blocked: boolean;
  blocked_reason?: string;
  is_carry_forward: boolean;
  carry_forward_source_id?: string;
  created_at: string;
  updated_at: string;
  student?: {
    id: string;
    first_name: string;
    last_name: string;
    admission_number: string;
    class_id: string;
    classes?: {
      name: string;
      section: string;
    };
  };
  academic_year?: {
    id: string;
    year_name: string;
    is_current: boolean;
  };
  carry_forward_source?: {
    id: string;
    from_academic_year_id: string;
    original_amount: number;
    carry_forward_type: string;
  };
}

export function useEnhancedFeeData(academicYearId?: string) {
  const [feeRecords, setFeeRecords] = useState<EnhancedFeeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<any>(null);
  const { toast } = useToast();

  const fetchAcademicYears = async () => {
    try {
      const { data, error } = await supabase
        .from("academic_years")
        .select("*")
        .order("start_date", { ascending: false });

      if (error) throw error;

      setAcademicYears(data || []);
      const current = data?.find(year => year.is_current) || data?.[0];
      setCurrentAcademicYear(current);
    } catch (error: any) {
      console.error("Error fetching academic years:", error);
      toast({
        title: "Error",
        description: "Failed to fetch academic years",
        variant: "destructive",
      });
    }
  };

  const fetchEnhancedFeeData = async (yearId?: string) => {
    if (!yearId && !currentAcademicYear?.id) return;
    
    setLoading(true);
    try {
      const targetYearId = yearId || currentAcademicYear?.id;
      
      const { data, error } = await supabase
        .from("student_fee_records")
        .select(`
          *,
          students!inner (
            id,
            first_name,
            last_name,
            admission_number,
            class_id,
            classes (
              name,
              section
            )
          ),
          academic_years (
            id,
            year_name,
            is_current
          ),
          fee_carry_forward:carry_forward_source_id (
            id,
            from_academic_year_id,
            original_amount,
            carry_forward_type
          )
        `)
        .eq("academic_year_id", targetYearId)
        .order("priority_order", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;

      console.log("✅ Enhanced fee data fetched:", data?.length || 0, "records");
      setFeeRecords(data || []);
    } catch (error: any) {
      console.error("❌ Error fetching enhanced fee data:", error);
      toast({
        title: "Error",
        description: "Failed to fetch fee data",
        variant: "destructive",
      });
      setFeeRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const getStudentFeeHistory = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("student_fee_records")
        .select(`
          *,
          academic_years (
            year_name,
            is_current
          ),
          fee_carry_forward:carry_forward_source_id (
            id,
            from_academic_year_id,
            original_amount,
            carry_forward_type
          )
        `)
        .eq("student_id", studentId)
        .order("academic_year_id", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error("Error fetching student fee history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch student fee history",
        variant: "destructive",
      });
      return [];
    }
  };

  const getStudentPaymentHistory = async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from("fee_payment_records")
        .select(`
          *,
          student_fee_records (
            fee_type,
            academic_year_id,
            academic_years (
              year_name
            )
          ),
          payment_allocations (
            allocated_amount,
            allocation_order,
            student_fee_records (
              fee_type,
              academic_years (
                year_name
              )
            )
          )
        `)
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error("Error fetching payment history:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment history",
        variant: "destructive",
      });
      return [];
    }
  };

  const blockStudentPayment = async (
    studentId: string,
    reason: string,
    blockedBy: string = "Admin"
  ) => {
    try {
      const { error } = await supabase
        .from("student_fee_records")
        .update({
          payment_blocked: true,
          blocked_reason: reason,
          blocked_at: new Date().toISOString(),
          blocked_by: blockedBy,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("academic_year_id", currentAcademicYear?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student payment blocked successfully",
      });

      // Refresh data
      fetchEnhancedFeeData();
    } catch (error: any) {
      console.error("Error blocking payment:", error);
      toast({
        title: "Error",
        description: "Failed to block student payment",
        variant: "destructive",
      });
    }
  };

  const unblockStudentPayment = async (studentId: string) => {
    try {
      const { error } = await supabase
        .from("student_fee_records")
        .update({
          payment_blocked: false,
          blocked_reason: null,
          blocked_at: null,
          blocked_by: null,
          updated_at: new Date().toISOString(),
        })
        .eq("student_id", studentId)
        .eq("academic_year_id", currentAcademicYear?.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Student payment unblocked successfully",
      });

      // Refresh data
      fetchEnhancedFeeData();
    } catch (error: any) {
      console.error("Error unblocking payment:", error);
      toast({
        title: "Error",
        description: "Failed to unblock student payment",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, []);

  useEffect(() => {
    if (currentAcademicYear?.id || academicYearId) {
      fetchEnhancedFeeData(academicYearId);
    }
  }, [currentAcademicYear, academicYearId]);

  return {
    feeRecords,
    loading,
    academicYears,
    currentAcademicYear,
    setCurrentAcademicYear,
    fetchEnhancedFeeData,
    getStudentFeeHistory,
    getStudentPaymentHistory,
    blockStudentPayment,
    unblockStudentPayment,
    refetchFees: () => fetchEnhancedFeeData(academicYearId),
  };
}