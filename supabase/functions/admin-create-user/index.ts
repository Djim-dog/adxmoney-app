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

    // 1. Criar usuário no Auth (Admin API) com tratamento robusto para e-mail já existente
    let userData;
    const { data: createdData, error: userError } = await supabaseAdmin.auth.admin.createUser({
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
      console.log("[admin-create-user] Erro ao criar auth user (pode já existir no auth):", userError.message);
      if (userError.message.includes("already registered") || userError.message.includes("already exists")) {
        // Localizar o utilizador existente no auth para atualizar a senha e reativá-lo
        const { data: listData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
        if (listError) {
          throw listError;
        }
        const existingAuthUser = listData?.users?.find(u => u.email?.toLowerCase() === email.trim().toLowerCase());
        
        if (existingAuthUser) {
          const { data: updatedAuthData, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(existingAuthUser.id, {
            password: password,
            user_metadata: { 
              name, 
              role, 
              phone,
              first_login: first_login ?? true 
            }
          });
          if (updateAuthError) {
            throw updateAuthError;
          }
          userData = { user: updatedAuthData.user };
          console.log(`[admin-create-user] Utilizador já existia no Auth. Senha e metadados atualizados para ID: ${existingAuthUser.id}`);
        } else {
          return new Response(JSON.stringify({ error: "Este e-mail já está registado no sistema de autenticação." }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        throw userError;
      }
    } else {
      userData = createdData;
    }

    const userId = userData.user.id

    // 2. Criar ou atualizar perfil na tabela public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: userId,
        email: email.trim(),
        name: name.trim(),
        phone: phone ? phone.trim() : null,
        role: role || 'user',
        first_login: first_login ?? true,
        primary_link: primary_link ? primary_link.trim() : null,
        tiktok: tiktok ? tiktok.trim() : null,
        instagram: instagram ? instagram.trim() : null,
        youtube: youtube ? youtube.trim() : null,
        country: country || 'Angola',
        is_active: true,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' })

    if (profileError) {
      console.error("[admin-create-user] Erro ao atualizar perfil:", profileError.message);
      throw profileError
    }

    // 3. Garantir carteira
    const { error: walletError } = await supabaseAdmin
      .from('wallets')
      .insert({ user_id: userId, balance: 0, reserved_balance: 0 })
      .select()

    if (walletError && !walletError.message.includes("duplicate key")) {
      console.error("[admin-create-user] Erro ao criar carteira:", walletError.message);
    }

    console.log(`[admin-create-user] Usuário ${email} processado com sucesso. ID: ${userId}`);

    return new Response(JSON.stringify({ message: 'Usuário criado/atualizado com sucesso', user: userData.user }), {
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
