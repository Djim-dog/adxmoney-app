package com.adxmoney.app

import android.app.Application

class ADXMoneyApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Inicialização do cliente Supabase e canais de log de auditoria
    }
}
