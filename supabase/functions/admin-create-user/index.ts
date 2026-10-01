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

    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPhone = phone ? phone.trim() : '';

    console.log(`[admin-create-user] Tentando criar usuário: ${cleanEmail}`);

    if (!cleanEmail) {
      return new Response(JSON.stringify({ error: 'O e-mail é obrigatório.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 1. Verificar se o e-mail já existe na tabela profiles
    const { data: existingProfileByEmail, error: emailCheckError } = await supabaseAdmin
      .from('profiles')
      .select('id, email')
      .ilike('email', cleanEmail)
      .maybeSingle();

    if (existingProfileByEmail) {
      return new Response(JSON.stringify({ error: 'Este e-mail já está associado a outra conta no sistema.' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2. Verificar se o número de telefone já existe na tabela profiles (se informado)
    if (cleanPhone) {
      const { data: existingProfileByPhone, error: phoneCheckError } = await supabaseAdmin
        .from('profiles')
        .select('id, phone')
        .eq('phone', cleanPhone)
        .maybeSingle();

      if (existingProfileByPhone) {
        return new Response(JSON.stringify({ error: 'Este número de telefone já está associado a outra conta no sistema.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // 3. Criar usuário no Auth (Admin API)
    const { data: createdData, error: userError } = await supabaseAdmin.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: { 
        name, 
        role, 
        phone: cleanPhone,
        first_login: first_login ?? true 
      },
    })

    if (userError) {
      console.error("[admin-create-user] Erro ao criar auth user:", userError.message);
      if (userError.message.includes("already registered") || userError.message.includes("already exists")) {
        return new Response(JSON.stringify({ error: 'Este e-mail já está associado a outra conta no sistema.' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      throw userError
    }

    const userId = createdData.user.id

    // 4. Criar perfil na tabela public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        email: cleanEmail,
        name: name.trim(),
        phone: cleanPhone || null,
        role: role || 'user',
        first_login: first_login ?? true,
        primary_link: primary_link ? primary_link.trim() : null,
        tiktok: tiktok ? tiktok.trim() : null,
        instagram: instagram ? instagram.trim() : null,
        youtube: youtube ? youtube.trim() : null,
        country: country || 'Angola',
        is_active: true,
        updated_at: new Date().toISOString()
      })

    if (profileError) {
      console.error("[admin-create-user] Erro ao criar perfil:", profileError.message);
      // Limpar auth user se falhar perfil
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error("Erro ao criar perfil do usuário: " + profileError.message);
    }

    // 5. Garantir carteira
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({ user_id: userId, balance: 0, reserved_balance: 0 })
      .select()

    if (walletError && !walletError.message.includes("duplicate key")) {
      console.error("[admin-create-user] Erro ao criar carteira:", walletError.message);
    }

    console.log(`[admin-create-user] Usuário ${cleanEmail} criado com sucesso. ID: ${userId}`);

    return new Response(JSON.stringify({ message: 'Usuário criado com sucesso', user: createdData.user }), {
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
