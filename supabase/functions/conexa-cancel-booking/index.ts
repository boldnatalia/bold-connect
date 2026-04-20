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
    const { bookingId } = await req.json()
    if (!bookingId) throw new Error("ID da reserva não fornecido.");

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    )

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
    if (userError || !user) throw new Error("Usuário não autenticado.")

    const conexaToken = Deno.env.get('CONEXA_API_TOKEN');
    if (!conexaToken) throw new Error("Token do Conexa não configurado.");

    const cancelUrl = `${CONEXA_BASE_URL}/room/booking/${bookingId}/cancel`;
    console.log("Cancelando reserva:", cancelUrl);

    const response = await fetch(cancelUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${conexaToken}`,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Erro do Conexa ao cancelar:", err);
      throw new Error(`Erro ao cancelar no Conexa: ${err}`);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Reserva cancelada com sucesso." }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
