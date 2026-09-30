package com.adxmoney.app.data.models

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class UserProfile(
    val id: String,
    val name: String? = null,
    val email: String? = null,
    val phone: String? = null,
    val role: String = "user",
    @SerialName("first_login") val firstLogin: Boolean = true,
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Wallet(
    val id: String,
    @SerialName("user_id") val userId: String,
    val balance: Double = 0.0,
    @SerialName("reserved_balance") val reservedBalance: Double = 0.0,
    @SerialName("updated_at") val updatedAt: String? = null
)

@Serializable
data class WalletTransaction(
    val id: String,
    @SerialName("wallet_id") val walletId: String,
    @SerialName("user_id") val userId: String,
    val type: String,
    val amount: Double,
    val description: String,
    @SerialName("reference_id") val referenceId: String? = null,
    val status: String = "COMPLETED",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Campaign(
    val id: String,
    val title: String,
    val description: String,
    val platform: String,
    @SerialName("target_url") val targetUrl: String,
    val instructions: String,
    @SerialName("reward_amount") val rewardAmount: Double,
    val status: String = "ACTIVE",
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class CampaignAssignment(
    val id: String,
    @SerialName("campaign_id") val campaignId: String,
    @SerialName("user_id") val userId: String,
    val status: String = "ASSIGNED",
    @SerialName("completed_at") val completedAt: String? = null,
    @SerialName("created_at") val createdAt: String? = null
)

@Serializable
data class Withdrawal(
    val id: String,
    @SerialName("user_id") val userId: String,
    val amount: Double,
    val method: String,
    @SerialName("payment_details") val paymentDetails: Map<String, String> = emptyMap(),
    val status: String = "PENDING",
    @SerialName("requested_at") val requestedAt: String? = null,
    @SerialName("processed_at") val processedAt: String? = null,
    @SerialName("rejection_reason") val rejectionReason: String? = null
)

@Serializable
data class AffiliateProfile(
    val id: String,
    @SerialName("user_id") val userId: String,
    @SerialName("affiliate_code") val affiliateCode: String,
    @SerialName("is_active") val isActive: Boolean = true,
    @SerialName("total_referrals") val totalReferrals: Int = 0,
    @SerialName("total_earned") val totalEarned: Double = 0.0
)
