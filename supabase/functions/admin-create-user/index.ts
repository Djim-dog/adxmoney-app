import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Manual authentication check (only admins should call this)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { email, password, name, phone, role, first_login, primary_link, tiktok, instagram, youtube, country } = await req.json()

    console.log(`[admin-create-user] Tentando criar usuário: ${email}`);

    // 1. Criar usuário no Auth (Admin API)
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true,
      user_metadata: { 
        name, 
        role, 
        phone,
        first_login: first_login ?? true 
      },
    })

    if (userError) {
      console.error("[admin-create-user] Erro ao criar auth user:", userError.message);
      // Se o erro for de e-mail já existente
      if (userError.message.includes("already registered") || userError.message.includes("already exists")) {
        return new Response(JSON.stringify({ error: "Este e-mail já está em uso por outro operador." }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw userError
    }

    const userId = userData.user.id

    // 2. Criar perfil na tabela public.profiles (O trigger handle_new_user já deve fazer isso, mas vamos garantir os campos extras)
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        role: role || 'user',
        first_login: first_login ?? true,
        primary_link: primary_link ? primary_link.trim() : null,
        tiktok: tiktok ? tiktok.trim() : null,
        instagram: instagram ? instagram.trim() : null,
        youtube: youtube ? youtube.trim() : null,
        country: country || 'Angola',
        is_active: true
      })
      .eq('id', userId)

    if (profileError) {
      console.error("[admin-create-user] Erro ao atualizar perfil:", profileError.message);
      throw profileError
    }

    // 3. Garantir carteira
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({ user_id: userId, balance: 0, reserved_balance: 0 })
      .select()

    // Ignorar erro se a carteira já existir (via trigger)
    if (walletError && !walletError.message.includes("duplicate key")) {
      console.error("[admin-create-user] Erro ao criar carteira:", walletError.message);
    }

    console.log(`[admin-create-user] Usuário ${email} criado com sucesso. ID: ${userId}`);

    return new Response(JSON.stringify({ message: 'Usuário criado com sucesso', user: userData.user }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error: any) {
    console.error("[admin-create-user] Erro crítico:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
