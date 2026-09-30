package com.adxmoney.app.data.repository

import com.adxmoney.app.data.client.ADXSupabase
import com.adxmoney.app.data.models.UserProfile
import io.github.jan.supabase.gotrue.auth
import io.github.jan.supabase.gotrue.providers.builtin.Email
import io.github.jan.supabase.postgrest.postgrest
import io.github.jan.supabase.postgrest.query.Columns
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put

class AuthRepository {
    private val client = ADXSupabase.client

    suspend fun signIn(email: String, pass: String): Result<UserProfile> = withContext(Dispatchers.IO) {
        try {
            client.auth.signInWith(Email) {
                this.email = email
                this.password = pass
            }
            val user = client.auth.currentUserOrNull() ?: return@withContext Result.failure(Exception("Usuário não encontrado"))
            val profile = client.postgrest["profiles"]
                .select(columns = Columns.ALL) {
                    filter { eq("id", user.id) }
                }
                .decodeSingle<UserProfile>()
            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getProfile(userId: String): Result<UserProfile> = withContext(Dispatchers.IO) {
        try {
            val profile = client.postgrest["profiles"]
                .select(columns = Columns.ALL) {
                    filter { eq("id", userId) }
                }
                .decodeSingle<UserProfile>()
            Result.success(profile)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun completeFirstAccess(name: String, phone: String, affiliateCode: String?): Result<JsonObject> = withContext(Dispatchers.IO) {
        try {
            val params = buildJsonObject {
                put("p_name", name)
                put("p_phone", phone)
                if (!affiliateCode.isNullOrBlank()) {
                    put("p_affiliate_code", affiliateCode.trim().uppercase())
                }
            }
            val result = client.postgrest.rpc("complete_first_access", params).decodeAs<JsonObject>()
            Result.success(result)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun signOut(): Result<Unit> = withContext(Dispatchers.IO) {
        try {
            client.auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
