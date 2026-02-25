import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const testEmail = 'teste@boldworkplace.com.br'
    const testPassword = 'Teste@123'

    // Check if user already exists
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existing = existingUsers?.users?.find(u => u.email === testEmail)

    if (existing) {
      // Reset password just in case
      await supabaseAdmin.auth.admin.updateUserById(existing.id, { password: testPassword })
      return new Response(
        JSON.stringify({ message: 'Test user already exists, password reset', userId: existing.id }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    // Create user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
    })

    if (authError) throw authError

    const userId = authData.user.id

    // Get a floor
    const { data: floorData } = await supabaseAdmin
      .from('floors')
      .select('id')
      .limit(1)
      .single()

    // Create profile
    await supabaseAdmin.from('profiles').insert({
      user_id: userId,
      full_name: 'Usuário Teste',
      cpf: '12345678900',
      company: 'Empresa Teste',
      floor_id: floorData?.id || null,
      room: '101',
    })

    // Role is already 'tenant' by default trigger

    return new Response(
      JSON.stringify({ message: 'Test user created', userId, email: testEmail }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return new Response(
      JSON.stringify({ error: message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    )
  }
})
