package com.adxmoney.app.data.repository

import com.adxmoney.app.data.client.ADXSupabase
import com.adxmoney.app.data.models.Withdrawal
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class WithdrawalsRepository {
    private val client = ADXSupabase.client

    suspend fun getWithdrawals(): Result<List<Withdrawal>> = withContext(Dispatchers.IO) {
        try {
            val user = client.auth.currentUserOrNull() ?: return@withContext Result.failure(Exception("Não autenticado"))
            val list = client.postgrest["withdrawals"]
                .select(columns = Columns.ALL) {
                    filter { eq("user_id", user.id) }
                    order("requested_at", Order.DESCENDING)
                }
                .decodeList<Withdrawal>()
            Result.success(list)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun requestWithdrawal(amount: Double, method: String, details: Map<String, String>): Result<JsonObject> = withContext(Dispatchers.IO) {
        try {
            val jsonDetails = buildJsonObject {
                details.forEach { (k, v) -> put(k, v) }
            }
            val params = buildJsonObject {
                put("p_amount", amount)
                put("p_method", method)
                put("p_payment_details", jsonDetails)
            }
            val result = client.postgrest.rpc("request_withdrawal", params).decodeAs<JsonObject>()
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
