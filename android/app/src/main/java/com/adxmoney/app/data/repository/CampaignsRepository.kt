package com.adxmoney.app.data.repository

import com.adxmoney.app.data.client.ADXSupabase
import com.adxmoney.app.data.models.Campaign
import com.adxmoney.app.data.models.CampaignAssignment
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class CampaignsRepository {
    private val client = ADXSupabase.client

    suspend fun getAssignedCampaigns(): Result<List<Campaign>> = withContext(Dispatchers.IO) {
        try {
            val user = client.auth.currentUserOrNull() ?: return@withContext Result.failure(Exception("Não autenticado"))
            // Busca apenas campanhas atribuídas ativas através do RLS
            val campaigns = client.postgrest["campaigns"]
                .select(columns = Columns.ALL)
                .decodeList<Campaign>()
            Result.success(campaigns)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getAssignments(): Result<List<CampaignAssignment>> = withContext(Dispatchers.IO) {
        try {
            val user = client.auth.currentUserOrNull() ?: return@withContext Result.failure(Exception("Não autenticado"))
            val assignments = client.postgrest["campaign_assignments"]
                .select(columns = Columns.ALL) {
                    filter { eq("user_id", user.id) }
                }
                .decodeList<CampaignAssignment>()
            Result.success(assignments)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completeCampaign(campaignId: String): Result<JsonObject> = withContext(Dispatchers.IO) {
        try {
            val params = buildJsonObject {
                put("p_campaign_id", campaignId)
            }
            val result = client.postgrest.rpc("complete_campaign_execution", params).decodeAs<JsonObject>()
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
