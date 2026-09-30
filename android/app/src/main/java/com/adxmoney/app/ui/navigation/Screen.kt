package com.adxmoney.app.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object FirstAccess : Screen("first_access")
    object Home : Screen("home")
    object Campaigns : Screen("campaigns")
    object Wallet : Screen("wallet")
    object RequestWithdrawal : Screen("request_withdrawal")
    object History : Screen("history")
    object AdminDashboard : Screen("admin_dashboard")
    object AdminUsers : Screen("admin_users")
    object AdminCampaigns : Screen("admin_campaigns")
    object AdminWithdrawals : Screen("admin_withdrawals")
}
