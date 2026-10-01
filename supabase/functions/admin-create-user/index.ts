import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Cabeçalho de autorização ausente." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "https://wznepehesjmhpateaoby.supabase.co";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // 1. Cliente com o token do usuário autenticado para validar se quem chama é realmente Admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userError } = await userClient.auth.getUser();
    if (userError || !callerUser) {
      return new Response(
        JSON.stringify({ error: "Sessão inválida ou expirada." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar na tabela profiles se o chamador possui role 'admin'
    const { data: callerProfile, error: profileCheckError } = await userClient
      .from("profiles")
      .select("role")
      .eq("id", callerUser.id)
      .single();

    if (profileCheckError || callerProfile?.role !== "admin") {
      return new Response(
        JSON.stringify({ error: "Acesso negado: Apenas administradores podem criar utilizadores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Processar payload de criação do utilizador
    const { email, password, name, phone, role, primary_link, tiktok, instagram, youtube, country } = await req.json();

    if (!email || !password) {
      return new Response(
        JSON.stringify({ error: "E-mail e senha são obrigatórios." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (password.length < 6) {
      return new Response(
        JSON.stringify({ error: "A senha deve conter no mínimo 6 caracteres." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Cliente com Service Role para chamar a API oficial do Supabase Auth Admin
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const cleanEmail = email.toLowerCase().trim();
    const userRole = role || "user";

    // Criar usuário via Supabase Auth Admin API (Garante criação 100% íntegra de auth.users e auth.identities)
    const { data: createdAuthData, error: createAuthError } = await adminClient.auth.admin.createUser({
      email: cleanEmail,
      password: password,
      email_confirm: true,
      user_metadata: {
        name: name || "",
        first_name: name ? name.split(" ")[0] : "",
        phone: phone || "",
        role: userRole,
      },
    });

    if (createAuthError) {
      console.error("[admin-create-user] Erro ao criar auth user:", createAuthError);
      return new Response(
        JSON.stringify({ error: createAuthError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = createdAuthData.user.id;

    // 4. Criar ou atualizar o perfil público
    const { error: profileUpsertError } = await adminClient
      .from("profiles")
      .upsert({
        id: newUserId,
        email: cleanEmail,
        name: name || "",
        phone: phone || "",
        role: userRole,
        primary_link: primary_link || null,
        tiktok: tiktok || null,
        instagram: instagram || null,
        youtube: youtube || null,
        country: country || "Angola",
        first_login: true,
        is_active: true,
      });

    if (profileUpsertError) {
      console.error("[admin-create-user] Erro ao criar profile:", profileUpsertError);
    }

    // 5. Criar carteira inicial
    await adminClient
      .from("wallets")
      .upsert({
        user_id: newUserId,
        balance: 0.00,
        reserved_balance: 0.00,
      });

    // 6. Criar perfil de afiliado padrão
    await adminClient
      .from("affiliate_profiles")
      .upsert({
        user_id: newUserId,
        affiliate_code: "ADX" + Math.random().toString(36).substring(2, 8).toUpperCase(),
        is_active: false,
        total_referrals: 0,
        total_earned: 0.00,
      });

    // 7. Registrar log de atividade da administração
    await adminClient
      .from("activity_logs")
      .insert({
        user_id: callerUser.id,
        action_type: "ADMIN_USER_CREATED",
        title: "Novo utilizador criado via Auth Admin API",
        details: `Utilizador: ${cleanEmail} | Perfil: ${userRole}`,
      });

    return new Response(
      JSON.stringify({
        success: true,
        user: {
          id: newUserId,
          email: cleanEmail,
          name: name,
          role: userRole,
        },
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[admin-create-user] Erro inesperado:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno do servidor." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
