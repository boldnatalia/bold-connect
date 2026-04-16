import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CONEXA_BASE_URL = "https://bold.conexa.app/index.php/api/v2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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

    // Busca usuário no Conexa
    const personUrl = `${CONEXA_BASE_URL}/persons?email=${userEmail}`;
    console.log("Buscando usuário na URL:", personUrl);

    const personResponse = await fetch(personUrl, {
      headers: { 'Authorization': `Bearer ${conexaToken}` }
    });

    if (!personResponse.ok) {
        const errorText = await personResponse.text();
        throw new Error(`Status: ${personResponse.status} | URL: ${personUrl} | Detalhes: ${errorText}`);
    }

    const personData = await personResponse.json();
    if (!personData.data || personData.data.length === 0) {
      throw new Error(`E-mail ${userEmail} não encontrado no Conexa.`);
    }

    const personId = personData.data[0].id;
    const customerId = personData.data[0].customerId;

    // Formata data e hora
    const startDateTime = `${date}T${startTime}:00-03:00`;
    const endDateTime = `${date}T${endTime}:00-03:00`;

    const bookingPayload = {
      customerId: customerId,
      personId: personId,
      roomId: roomId,
      startTime: startDateTime,
      finalTime: endDateTime,
    };

    const bookingResponse = await fetch(`${CONEXA_BASE_URL}/room/booking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${conexaToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(bookingPayload)
    });

    if (!bookingResponse.ok) {
      const errorDetails = await bookingResponse.json();
      throw new Error(JSON.stringify(errorDetails));
    }

    return new Response(
      JSON.stringify({ success: true, message: "Reserva confirmada!" }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
