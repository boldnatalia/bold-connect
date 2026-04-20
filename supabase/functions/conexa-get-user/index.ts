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

    return new Response(
      JSON.stringify({
        success: true,
        name: foundPerson.name ?? null,
        customerId: foundPerson.customerId ?? null,
        cpf: foundPerson.cpf ?? foundPerson.document ?? null,
        company: foundPerson.companyName ?? foundPerson.corporateName ?? foundPerson.company ?? null,
        raw: foundPerson,
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
