package com.adxmoney.app.data.repository

import com.adxmoney.app.data.client.ADXSupabase
import com.adxmoney.app.data.models.Campaign
import com.adxmoney.app.data.models.UserProfile
import com.adxmoney.app.data.models.Withdrawal
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import io.github.jan.supabase.postgrest.query.Order
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.JsonPrimitive
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class AdminRepository {
    private val client = ADXSupabase.client

    suspend fun getAllUsers(): Result<List<UserProfile>> = withContext(Dispatchers.IO) {
        try {
            val users = client.postgrest["profiles"]
                .select(columns = Columns.ALL) {
                    order("created_at", Order.DESCENDING)
                }
                .decodeList<UserProfile>()
            Result.success(users)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAllCampaigns(): Result<List<Campaign>> = withContext(Dispatchers.IO) {
        try {
            val campaigns = client.postgrest["campaigns"]
                .select(columns = Columns.ALL) {
                    order("created_at", Order.DESCENDING)
                }
                .decodeList<Campaign>()
            Result.success(campaigns)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun createCampaign(campaign: Campaign): Result<Campaign> = withContext(Dispatchers.IO) {
        try {
            val created = client.postgrest["campaigns"]
                .insert(campaign)
                .decodeSingle<Campaign>()
            Result.success(created)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun assignCampaign(campaignId: String, userIds: List<String>): Result<JsonObject> = withContext(Dispatchers.IO) {
        try {
            val params = buildJsonObject {
                put("p_campaign_id", campaignId)
                put("p_user_ids", JsonArray(userIds.map { JsonPrimitive(it) }))
            }
            val res = client.postgrest.rpc("admin_assign_campaign", params).decodeAs<JsonObject>()
            Result.success(res)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAllWithdrawals(): Result<List<Withdrawal>> = withContext(Dispatchers.IO) {
        try {
            val list = client.postgrest["withdrawals"]
                .select(columns = Columns.ALL) {
                    order("requested_at", Order.DESCENDING)
                }
                .decodeList<Withdrawal>()
            Result.success(list)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun processWithdrawal(withdrawalId: String, action: String, reason: String? = null): Result<JsonObject> = withContext(Dispatchers.IO) {
        try {
            val params = buildJsonObject {
                put("p_withdrawal_id", withdrawalId)
                put("p_action", action) // "APPROVE", "PAID", "REJECT"
                if (!reason.isNullOrBlank()) {
                    put("p_rejection_reason", reason)
                }
            }
            val res = client.postgrest.rpc("admin_process_withdrawal", params).decodeAs<JsonObject>()
            Result.success(res)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun toggleAffiliate(userId: String, isActive: Boolean, code: String? = null): Result<JsonObject> = withContext(Dispatchers.IO) {
        try {
            val params = buildJsonObject {
                put("p_user_id", userId)
                put("p_is_active", isActive)
                if (!code.isNullOrBlank()) {
                    put("p_custom_code", code.trim().uppercase())
                }
            }
            val res = client.postgrest.rpc("admin_toggle_affiliate", params).decodeAs<JsonObject>()
            Result.success(res)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
