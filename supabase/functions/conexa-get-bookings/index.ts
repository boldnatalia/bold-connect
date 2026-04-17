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

    // 1. Encontra o customerId do usuário
    let offset = 0;
    const limit = 100;
    let customerId = null;
    let userFound = false;

    while (!userFound) {
      const url = `${CONEXA_BASE_URL}/persons?limit=${limit}&offset=${offset}&active=1`;
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${conexaToken}` } });
      if (!response.ok) throw new Error("Erro ao buscar usuário");
      
      const data = await response.json();
      if (!data.data || data.data.length === 0) break;

      for (const person of data.data) {
        if (person.emails && person.emails.includes(userEmail)) {
          customerId = person.customerId;
          userFound = true;
          break;
        }
      }
      if (userFound || !data.pagination || !data.pagination.hasNext) break;
      offset += limit;
    }

    if (!customerId) throw new Error("Usuário não encontrado no Conexa.");

    // 2. Busca as reservas futuras desse customerId
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayW3C = today.toISOString().split('.')[0] + "-03:00"; 

    const bookingsUrl = `${CONEXA_BASE_URL}/room/bookings?customerId[]=${customerId}&isActive=1&limit=50&bookingDateTimeFrom=${todayW3C}`;
    
    const bookingsResponse = await fetch(bookingsUrl, {
      headers: { 
        'Authorization': `Bearer ${conexaToken}`,
        'Accept': 'application/json'
      }
    });

    if (!bookingsResponse.ok) throw new Error("Erro ao buscar reservas");

    const bookingsData = await bookingsResponse.json();

    // LOG do primeiro booking pra ajudar a mapear o frontend
    if (bookingsData.data && bookingsData.data.length > 0) {
      console.log("Exemplo de booking retornado:", JSON.stringify(bookingsData.data[0], null, 2));
    } else {
      console.log("Nenhuma reserva retornada. Resposta completa:", JSON.stringify(bookingsData));
    }

    return new Response(
      JSON.stringify({ success: true, bookings: bookingsData.data || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
