package com.adxmoney.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.adxmoney.app.ui.navigation.Screen

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ADXMoneyApp()
                }
            }
        }
    }
}

@Composable
fun ADXMoneyApp() {
    val navController = rememberNavController()
    NavHost(navController = navController, startDestination = Screen.Login.route) {
        composable(Screen.Login.route) {
            // LoginScreen(navController)
        }
        composable(Screen.FirstAccess.route) {
            // FirstAccessScreen(navController)
        }
        composable(Screen.Home.route) {
            // HomeScreen(navController)
        }
        composable(Screen.Campaigns.route) {
            // CampaignsScreen(navController)
        }
        composable(Screen.Wallet.route) {
            // WalletScreen(navController)
        }
        composable(Screen.RequestWithdrawal.route) {
            // RequestWithdrawalScreen(navController)
        }
        composable(Screen.History.route) {
            // HistoryScreen(navController)
        }
        composable(Screen.AdminDashboard.route) {
            // AdminDashboardScreen(navController)
        }
    }
}
