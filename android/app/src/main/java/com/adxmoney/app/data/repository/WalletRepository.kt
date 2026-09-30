package com.adxmoney.app.data.repository

import com.adxmoney.app.data.client.ADXSupabase
import com.adxmoney.app.data.models.Wallet
import com.adxmoney.app.data.models.WalletTransaction
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class WalletRepository {
    private val client = ADXSupabase.client

    suspend fun getWallet(): Result<Wallet> = withContext(Dispatchers.IO) {
        try {
            val user = client.auth.currentUserOrNull() ?: return@withContext Result.failure(Exception("Não autenticado"))
            val wallet = client.postgrest["wallets"]
                .select(columns = Columns.ALL) {
                    filter { eq("user_id", user.id) }
                }
                .decodeSingle<Wallet>()
            Result.success(wallet)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getTransactions(): Result<List<WalletTransaction>> = withContext(Dispatchers.IO) {
        try {
            val user = client.auth.currentUserOrNull() ?: return@withContext Result.failure(Exception("Não autenticado"))
            val txs = client.postgrest["wallet_transactions"]
                .select(columns = Columns.ALL) {
                    filter { eq("user_id", user.id) }
                    order("created_at", Order.DESCENDING)
                }
                .decodeList<WalletTransaction>()
            Result.success(txs)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
