import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface AuditLogEntry {
  id: string;
  student_id: string;
  fee_record_id: string;
  action_type: string;
  old_values: any;
  new_values: any;
  amount_affected: number;
  academic_year_id: string;
  performed_by: string;
  performed_at: string;
  ip_address?: string;
  notes?: string;
  reference_number?: string;
  student?: {
    first_name: string;
    last_name: string;
    admission_number: string;
  };
  academic_year?: {
    year_name: string;
  };
}

export function useAuditLog(filters?: {
  studentId?: string;
  academicYearId?: string;
  actionType?: string;
  dateFrom?: string;
  dateTo?: string;
}) {
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAuditLog = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("fee_audit_log")
        .select(`
          *,
          students:student_id (
            first_name,
            last_name,
            admission_number
          ),
          academic_years:academic_year_id (
            year_name
          )
        `)
        .order("performed_at", { ascending: false });

      // Apply filters
      if (filters?.studentId) {
        query = query.eq("student_id", filters.studentId);
      }
      if (filters?.academicYearId) {
        query = query.eq("academic_year_id", filters.academicYearId);
      }
      if (filters?.actionType) {
        query = query.eq("action_type", filters.actionType);
      }
      if (filters?.dateFrom) {
        query = query.gte("performed_at", filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte("performed_at", filters.dateTo);
      }

      const { data, error } = await query;

      if (error) throw error;

      setAuditLog(data || []);
    } catch (error: any) {
      console.error("Error fetching audit log:", error);
      toast({
        title: "Error",
        description: "Failed to fetch audit log",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const logAction = async (
    studentId: string,
    feeRecordId: string,
    actionType: string,
    academicYearId: string,
    performedBy: string,
    oldValues?: any,
    newValues?: any,
    amountAffected?: number,
    notes?: string,
    referenceNumber?: string
  ) => {
    try {
      const { error } = await supabase.rpc("log_fee_audit", {
        p_student_id: studentId,
        p_fee_record_id: feeRecordId,
        p_action_type: actionType,
        p_academic_year_id: academicYearId,
        p_performed_by: performedBy,
        p_old_values: oldValues,
        p_new_values: newValues,
        p_amount_affected: amountAffected || 0,
        p_notes: notes,
        p_reference_number: referenceNumber,
      });

      if (error) throw error;

      // Refresh audit log
      fetchAuditLog();
    } catch (error: any) {
      console.error("Error logging action:", error);
      toast({
        title: "Error",
        description: "Failed to log audit action",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchAuditLog();
  }, [filters]);

  return {
    auditLog,
    loading,
    fetchAuditLog,
    logAction,
  };
}