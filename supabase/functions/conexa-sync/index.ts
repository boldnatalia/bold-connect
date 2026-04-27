import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CONEXA_BASE_URL = "https://bold.conexa.app/index.php/api/v2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function fetchAllPages(path: string, token: string) {
  const all: any[] = [];
  let offset = 0;
  const limit = 100;
  let pageNum = 0;
  while (true) {
    const url = `${CONEXA_BASE_URL}/${path}?limit=${limit}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Conexa ${path} ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const page = json?.data ?? [];
    all.push(...page);
    pageNum++;
    console.log(`[conexa-sync] ${path} página ${pageNum} (offset=${offset}): ${page.length} registros`);
    if (!json?.pagination?.hasNext || page.length === 0) break;
    offset += limit;
  }
  console.log(`[conexa-sync] ${path} TOTAL recebido: ${all.length} registros`);
  return all;
}

function isActive(item: any): boolean {
  // Conexa pode usar várias formas; consideramos ativo por padrão se não houver flag explícita falsa
  if (item == null) return false;
  if (item.active === 0 || item.active === false || item.isActive === false || item.status === 'inactive') return false;
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Validate caller role
    const { data: claimsData, error: claimsErr } = await supabaseAdmin.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const callerId = claimsData.claims.sub as string;
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId);
    const allowed = roles?.some((r) => r.role === "admin" || r.role === "central_atendimento");
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Apenas Admin/Central pode sincronizar." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const conexaToken = Deno.env.get("CONEXA_API_TOKEN");
    if (!conexaToken) throw new Error("Token Conexa não configurado.");

    // 1. Customers
    const customers = await fetchAllPages("customers", conexaToken);
    const customerRows = customers.map((c: any) => ({
      conexa_id: c.id ?? c.customerId,
      name: c.name ?? c.corporateName ?? c.razaoSocial ?? "",
      trade_name: c.tradeName ?? c.fantasyName ?? c.fantasia ?? null,
      document: c.document ?? c.cpfCnpj ?? c.cnpj ?? null,
      email: Array.isArray(c.emails) ? c.emails[0] : (c.email ?? null),
      phone: Array.isArray(c.phones) ? c.phones[0] : (c.phone ?? null),
      is_active: c.active === 1 || c.active === true || c.isActive === true || true,
      raw: c,
      synced_at: new Date().toISOString(),
    })).filter((r: any) => r.conexa_id != null);

    if (customerRows.length > 0) {
      const { error } = await supabaseAdmin
        .from("customers")
        .upsert(customerRows, { onConflict: "conexa_id" });
      if (error) throw new Error(`Upsert customers: ${error.message}`);
    }

    // Map conexa_id -> customers.id
    const { data: customerMap } = await supabaseAdmin
      .from("customers")
      .select("id, conexa_id");
    const idMap = new Map<number, string>();
    customerMap?.forEach((c: any) => idMap.set(Number(c.conexa_id), c.id));

    // 2. Persons
    const persons = await fetchAllPages("persons", conexaToken);
    const personRows = persons.map((p: any) => {
      const conexaId = p.id ?? p.personId;
      const custConexaId = p.customerId ?? p.customer_id ?? null;
      return {
        conexa_id: conexaId,
        customer_conexa_id: custConexaId,
        customer_id: custConexaId ? (idMap.get(Number(custConexaId)) ?? null) : null,
        name: p.name ?? "",
        emails: Array.isArray(p.emails) ? p.emails.map((e: string) => String(e).toLowerCase()) : [],
        phone: Array.isArray(p.phones) ? p.phones[0] : (p.phone ?? null),
        document: p.cpf ?? p.document ?? null,
        is_active: p.active === 1 || p.active === true || p.isActive === true || true,
        raw: p,
        synced_at: new Date().toISOString(),
      };
    }).filter((r: any) => r.conexa_id != null);

    if (personRows.length > 0) {
      // Chunked upsert to avoid payload limits
      const chunkSize = 500;
      for (let i = 0; i < personRows.length; i += chunkSize) {
        const chunk = personRows.slice(i, i + chunkSize);
        const { error } = await supabaseAdmin
          .from("persons")
          .upsert(chunk, { onConflict: "conexa_id" });
        if (error) throw new Error(`Upsert persons: ${error.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        customers: customerRows.length,
        persons: personRows.length,
        synced_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("[conexa-sync]", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
