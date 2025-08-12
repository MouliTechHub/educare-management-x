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

  try {
    const body = await req.json();
    const promotionDataRaw = body?.promotion_data;
    const targetAcademicYearId: string | undefined = body?.target_academic_year_id;
    const promotedByUser: string = body?.promoted_by_user || "Admin";
    const idempotencyKey: string | undefined = body?.idempotency_key;

    if (!promotionDataRaw || !Array.isArray(promotionDataRaw)) {
      return new Response(JSON.stringify({ error: "invalid_payload: promotion_data must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!targetAcademicYearId) {
      return new Response(JSON.stringify({ error: "invalid_payload: target_academic_year_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Role check - only admins can execute promotions
    const { data: isAdmin, error: roleErr } = await supabase.rpc("is_admin");
    if (roleErr) {
      console.error("is_admin RPC error", roleErr);
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

    // Resolve target classes for validation
    type PromotionItem = {
      student_id: string;
      from_academic_year_id: string;
      from_class_id: string | null;
      to_class_id: string | null;
      promotion_type: "promoted" | "repeated" | "dropout";
      reason?: string | null;
      notes?: string | null;
    };

    const promotionData: PromotionItem[] = promotionDataRaw as PromotionItem[];

    // Compute target class per item
    const nextClassCache = new Map<string, string>();
    const targetClassIds = new Set<string>();

    for (const item of promotionData) {
      if (item.promotion_type === "dropout") continue; // no target class

      let targetClassId: string | null = null;
      if (item.promotion_type === "repeated") {
        targetClassId = item.from_class_id;
      } else {
        // promoted
        targetClassId = item.to_class_id;
        if (!targetClassId && item.from_class_id) {
          const key = item.from_class_id;
          if (nextClassCache.has(key)) {
            targetClassId = nextClassCache.get(key)!;
          } else {
            const { data: nextId, error: nextErr } = await supabase.rpc("get_next_class_id", {
              current_class_id: item.from_class_id,
            });
            if (nextErr) {
              console.error("get_next_class_id RPC error", nextErr);
              return new Response(JSON.stringify({ error: nextErr.message || "failed_to_compute_target_class" }), {
                status: 400,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
              });
            }
            if (nextId) nextClassCache.set(key, nextId as string);
            targetClassId = (nextId as string) || item.from_class_id; // fallback
          }
        }
      }

      if (targetClassId) targetClassIds.add(targetClassId);
    }

    // If no target classes (e.g., all dropouts), we can just invoke RPC
    if (targetClassIds.size === 0) {
      const { data: rpcData, error: rpcError } = await supabase.rpc("promote_students_with_fees", {
        promotion_data: promotionData,
        target_academic_year_id: targetAcademicYearId,
        promoted_by_user: promotedByUser,
        idempotency_key: idempotencyKey,
      });
      if (rpcError) {
        console.error("promote_students_with_fees RPC error", rpcError);
        return new Response(JSON.stringify({ error: rpcError.message || "promotion_failed" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify(rpcData ?? {}), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate fee plans exist for every target class
    const classIdList = Array.from(targetClassIds);
    const { data: feeRows, error: feeErr } = await supabase
      .from("fee_structures")
      .select("class_id")
      .eq("academic_year_id", targetAcademicYearId)
      .eq("is_active", true)
      .in("class_id", classIdList);

    if (feeErr) {
      console.error("fee_structures query error", feeErr);
      return new Response(JSON.stringify({ error: feeErr.message || "fee_structures_query_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const presentClassIds = new Set((feeRows || []).map((r: any) => r.class_id as string));
    const missingIds = classIdList.filter((id) => !presentClassIds.has(id));

    if (missingIds.length > 0) {
      // Fetch names for formatting
      const [{ data: yearRow }, { data: classRows }] = await Promise.all([
        supabase.from("academic_years").select("year_name").eq("id", targetAcademicYearId).maybeSingle(),
        supabase.from("classes").select("id, name, section").in("id", missingIds),
      ]);

      const yearName = yearRow?.year_name || "";
      const missing = (classRows || []).map((c: any) => ({
        year: yearName,
        class: `${c.name}${c.section ? ` (${c.section})` : ""}`,
      }));

      return new Response(
        JSON.stringify({ error: "MISSING_FEE_PLANS", missing }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // All good, execute promotion atomically via RPC (it already handles fees + carry-forward)
    const { data: result, error: promotionError } = await supabase.rpc("promote_students_with_fees", {
      promotion_data: promotionData,
      target_academic_year_id: targetAcademicYearId,
      promoted_by_user: promotedByUser,
      idempotency_key: idempotencyKey,
    });

    if (promotionError) {
      console.error("promote_students_with_fees RPC error", promotionError);
      return new Response(JSON.stringify({ error: promotionError.message || "promotion_failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(result ?? {}), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Unhandled error in promotions-execute:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
