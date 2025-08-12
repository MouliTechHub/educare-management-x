import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnonKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase environment variables" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const body = await req.json().catch(() => ({}));
    const targetAcademicYearId: string | undefined = body?.target_academic_year_id;
    if (!targetAcademicYearId) {
      return new Response(JSON.stringify({ error: "invalid_payload: target_academic_year_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Require admin
    const { data: isAdmin, error: roleErr } = await supabase.rpc("is_admin");
    if (roleErr) {
      console.error("fees-backfill is_admin error", roleErr);
      return new Response(JSON.stringify({ error: roleErr.message || "role_check_failed" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "forbidden: admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find previous academic year (by start_date ordering)
    const { data: years, error: yearsErr } = await supabase
      .from("academic_years")
      .select("id,start_date")
      .order("start_date", { ascending: true });
    if (yearsErr) throw yearsErr;

    const targetIndex = (years || []).findIndex((y: any) => y.id === targetAcademicYearId);
    const prevYearId = targetIndex > 0 ? (years as any[])[targetIndex - 1]?.id : null;

    // Active fee structures for the target year
    const { data: feeStructures, error: fsErr } = await supabase
      .from("fee_structures")
      .select("class_id, fee_type, amount")
      .eq("academic_year_id", targetAcademicYearId)
      .eq("is_active", true);
    if (fsErr) throw fsErr;

    const classToStructures = new Map<string, { fee_type: string; amount: number }[]>();
    (feeStructures || []).forEach((fs: any) => {
      const list = classToStructures.get(fs.class_id) || [];
      list.push({ fee_type: fs.fee_type, amount: fs.amount });
      classToStructures.set(fs.class_id, list);
    });

    const classesWithPlans = Array.from(classToStructures.keys());
    if (classesWithPlans.length === 0) {
      return new Response(JSON.stringify({ backfilled: 0, previous_dues_created: 0, message: "No active fee structures for target year" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Active students in classes that have plans
    const { data: students, error: stErr } = await supabase
      .from("students")
      .select("id, class_id")
      .eq("status", "Active")
      .in("class_id", classesWithPlans);
    if (stErr) throw stErr;

    const studentIds = (students || []).map((s: any) => s.id);
    if (studentIds.length === 0) {
      return new Response(JSON.stringify({ backfilled: 0, previous_dues_created: 0, message: "No students to backfill" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Existing records in target year for these students
    const { data: existing, error: exErr } = await supabase
      .from("student_fee_records")
      .select("student_id, fee_type")
      .eq("academic_year_id", targetAcademicYearId)
      .in("student_id", studentIds);
    if (exErr) throw exErr;

    const existingSet = new Set((existing || []).map((r: any) => `${r.student_id}|${r.fee_type}`));

    // Build inserts for normal fees
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueDateStr = dueDate.toISOString().split("T")[0];

    const inserts: any[] = [];
    for (const s of students || []) {
      const structures = classToStructures.get(s.class_id) || [];
      for (const fs of structures) {
        const key = `${s.id}|${fs.fee_type}`;
        if (!existingSet.has(key)) {
          inserts.push({
            student_id: s.id,
            class_id: s.class_id,
            academic_year_id: targetAcademicYearId,
            fee_type: fs.fee_type,
            actual_fee: fs.amount,
            discount_amount: 0,
            paid_amount: 0,
            balance_fee: fs.amount,
            due_date: dueDateStr,
            status: "Pending",
          });
        }
      }
    }

    let backfilled = 0;
    if (inserts.length > 0) {
      const { error: insErr, count } = await supabase
        .from("student_fee_records")
        .insert(inserts, { count: "exact" });
      if (insErr) throw insErr;
      backfilled = count || inserts.length;
    }

    // Previous year dues
    let previous_dues_created = 0;
    if (prevYearId) {
      const { data: prevFees, error: prevErr } = await supabase
        .from("student_fee_records")
        .select("student_id, balance_fee, status")
        .eq("academic_year_id", prevYearId)
        .gt("balance_fee", 0);
      if (prevErr) throw prevErr;

      const prevSumByStudent = new Map<string, number>();
      (prevFees || []).forEach((f: any) => {
        const prev = prevSumByStudent.get(f.student_id) || 0;
        prevSumByStudent.set(f.student_id, prev + (f.balance_fee || 0));
      });

      const duesInserts: any[] = [];
      for (const sid of studentIds) {
        const amount = prevSumByStudent.get(sid) || 0;
        if (amount > 0 && !existingSet.has(`${sid}|Previous Year Dues`)) {
          duesInserts.push({
            student_id: sid,
            class_id: (students || []).find((s: any) => s.id === sid)?.class_id || null,
            academic_year_id: targetAcademicYearId,
            fee_type: "Previous Year Dues",
            actual_fee: amount,
            discount_amount: 0,
            paid_amount: 0,
            balance_fee: amount,
            due_date: dueDateStr,
            status: "Pending",
          });
        }
      }

      if (duesInserts.length > 0) {
        const { error: duesErr, count: duesCount } = await supabase
          .from("student_fee_records")
          .insert(duesInserts, { count: "exact" });
        if (duesErr) throw duesErr;
        previous_dues_created = duesCount || duesInserts.length;
      }
    }

    return new Response(JSON.stringify({ backfilled, previous_dues_created }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("fees-backfill error", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
