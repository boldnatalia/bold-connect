import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CONEXA_BASE_URL = "https://bold.conexa.app/index.php/api/v2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user || !user.email) throw new Error("Usuário não autenticado.")

    const userEmail = user.email.toLowerCase();
    const conexaToken = Deno.env.get('CONEXA_API_TOKEN');
    if (!conexaToken) throw new Error("Token do Conexa não configurado.");

    let offset = 0;
    const limit = 100;
    let foundPerson: Record<string, any> | null = null;

    while (!foundPerson) {
      const url = `${CONEXA_BASE_URL}/persons?limit=${limit}&offset=${offset}&active=1`;
      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${conexaToken}`, 'Accept': 'application/json' },
      });
      if (!response.ok) throw new Error("Erro ao buscar usuários no Conexa.");

      const data = await response.json();
      if (!data?.data || data.data.length === 0) break;

      for (const person of data.data) {
        const emails: string[] = (person.emails || []).map((e: string) => String(e).toLowerCase());
        if (emails.includes(userEmail)) {
          foundPerson = person;
          break;
        }
      }

      if (foundPerson || !data.pagination?.hasNext) break;
      offset += limit;
    }

    if (!foundPerson) {
      return new Response(
        JSON.stringify({ success: false, name: null, message: "Usuário não encontrado no Conexa." }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Buscar detalhes completos da pessoa (endpoint /person/:id costuma ter mais campos como cpf)
    let detail: Record<string, any> = foundPerson;
    const personId = foundPerson.id ?? foundPerson.personId ?? foundPerson.customerId;
    if (personId) {
      try {
        const detailRes = await fetch(`${CONEXA_BASE_URL}/person/${personId}`, {
          headers: { 'Authorization': `Bearer ${conexaToken}`, 'Accept': 'application/json' },
        });
        if (detailRes.ok) {
          const detailJson = await detailRes.json();
          detail = detailJson?.data ?? detailJson ?? foundPerson;
        }
      } catch (e) {
        console.warn('[Conexa] erro ao buscar detalhe:', e);
      }
    }

    const merged: Record<string, any> = { ...foundPerson, ...detail };

    const cpf =
      merged.cpf ?? merged.CPF ?? merged.document ?? merged.documentNumber ??
      merged.cpfCnpj ?? merged.cpf_cnpj ?? null;

    const company =
      merged.companyName ?? merged.corporateName ?? merged.company ??
      merged.razaoSocial ?? merged.razao_social ?? merged.tradeName ??
      merged.fantasyName ?? merged.unitName ?? null;

    return new Response(
      JSON.stringify({
        success: true,
        name: merged.name ?? null,
        customerId: merged.customerId ?? merged.id ?? null,
        cpf,
        company,
        raw: merged,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
