package com.adxmoney.app.data.client

import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.gotrue.Auth
import io.github.jan.supabase.postgrest.Postgrest
import io.github.jan.supabase.realtime.Realtime

object ADXSupabase {
    // Configurações de conexão Supabase com publishable/anon key
    private const val SUPABASE_URL = "https://wznepehesjmhpateaoby.supabase.co"
    private const val SUPABASE_ANON_KEY = "sb_publishable_a-PC_xRoLAns2Uio71jt_Q_ir5HQX--"

    val client: SupabaseClient by lazy {
        createSupabaseClient(
            supabaseUrl = SUPABASE_URL,
            supabaseKey = SUPABASE_ANON_KEY
        ) {
            install(Auth)
            install(PostgREST)
            install(Realtime)
        }
    }
}
