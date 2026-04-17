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
    const { roomId, date, startTime, endTime } = await req.json()

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error("Usuário não autenticado.")

    const userEmail = user.email;
    const conexaToken = Deno.env.get('CONEXA_API_TOKEN');

    if (!conexaToken) throw new Error("Token do Conexa não configurado.");

    // ==========================================
    // BUSCA PAGINADA DE USUÁRIO (Workaround)
    // ==========================================
    let offset = 0;
    const limit = 100;
    let personId = null;
    let customerId = null;
    let userFound = false;

    while (!userFound) {
      const url = `${CONEXA_BASE_URL}/persons?limit=${limit}&offset=${offset}&active=1`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${conexaToken}` } });

      if (!response.ok) {
          const err = await response.text();
          throw new Error(`Erro ao listar pessoas: ${err}`);
      }

      const data = await response.json();
      if (!data.data || data.data.length === 0) break;

      // Procura o e-mail na página atual
      for (const person of data.data) {
        if (person.emails && person.emails.includes(userEmail)) {
          personId = person.personId || person.id;
          customerId = person.customerId;
          userFound = true;
          break;
        }
      }

      if (userFound) break;
      if (!data.pagination || !data.pagination.hasNext) break;

      offset += limit;
    }

    if (!userFound || !personId || !customerId) {
        throw new Error(`Seu e-mail (${userEmail}) não foi encontrado no sistema. Por favor, contate a portaria.`);
    }

    // ==========================================
    // CRIA A RESERVA
    // ==========================================
    // Garante que a data está no formato YYYY-MM-DD
    const formattedDate = new Date(date).toISOString().split('T')[0];

    // O Conexa exige formato W3C com timezone, ex: 2026-04-20T09:00:00-03:00
    // Assumindo fuso horário do Brasil (-03:00) para este MVP
    const startDateTime = `${formattedDate}T${startTime}:00-03:00`;
    const endDateTime = `${formattedDate}T${endTime}:00-03:00`;

    const bookingPayload = {
      customerId: customerId,
      personId: personId,
      roomId: roomId,
      date: formattedDate, // Adicionado campo date isolado
      startTime: startDateTime,
      finalTime: endDateTime,
    };

    console.log("Payload a enviar para reserva:", bookingPayload);

    const bookingResponse = await fetch(`${CONEXA_BASE_URL}/room/booking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${conexaToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(bookingPayload)
    });

    if (!bookingResponse.ok) {
        const errorDetails = await bookingResponse.text();
        throw new Error(`Erro na Reserva: ${errorDetails}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Reserva confirmada no Conexa!" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
