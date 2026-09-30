package com.adxmoney.app

import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.adxmoney.app.data.repository.AuthRepository
import com.adxmoney.app.ui.navigation.Screen
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = Color(0xFF020617) // Slate 950
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
    val authRepo = remember { AuthRepository() }
    val scope = rememberCoroutineScope()
    var isCheckingAuth by remember { mutableStateOf(true) }

    LaunchedEffect(Unit) {
        val session = authRepo.getCurrentSession()
        if (session != null) {
            val user = authRepo.getCurrentUser()
            if (user != null) {
                val profileResult = authRepo.getUserProfile(user.id)
                val role = profileResult.getOrNull()?.role ?: "user"
                if (role == "admin") {
                    navController.navigate(Screen.AdminDashboard.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                } else {
                    navController.navigate(Screen.Home.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            }
        }
        isCheckingAuth = false
    }

    if (isCheckingAuth) {
        Box(
            modifier = Modifier.fillMaxSize().background(Color(0xFF020617)),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator(color = Color(0xFF10B981))
        }
        return
    }

    NavHost(navController = navController, startDestination = Screen.Login.route) {
        composable(Screen.Login.route) {
            AndroidLoginScreen(
                onLoginSuccess = { role ->
                    if (role == "admin") {
                        navController.navigate(Screen.AdminDashboard.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    } else {
                        navController.navigate(Screen.Home.route) {
                            popUpTo(Screen.Login.route) { inclusive = true }
                        }
                    }
                }
            )
        }
        composable(Screen.Home.route) {
            AndroidUserScreen(onLogout = {
                scope.launch {
                    authRepo.signOut()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            })
        }
        composable(Screen.AdminDashboard.route) {
            AndroidAdminScreen(onLogout = {
                scope.launch {
                    authRepo.signOut()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            })
        }
    }
}

@Composable
fun AndroidLoginScreen(onLoginSuccess: (String) -> Unit) {
    val authRepo = remember { AuthRepository() }
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var loading by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("ADXMONEY", color = Color.White, fontSize = 28.sp, fontWeight = FontWeight.Bold)
        Text("Área Operacional", color = Color(0xFF94A3B8), fontSize = 14.sp)
        Spacer(modifier = Modifier.height(32.dp))

        OutlinedTextField(
            value = email,
            onValueChange = { email = it },
            label = { Text("E-mail", color = Color(0xFF94A3B8)) },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = Color(0xFF10B981),
                unfocusedBorderColor = Color(0xFF334155)
            )
        )
        Spacer(modifier = Modifier.height(16.dp))

        OutlinedTextField(
            value = password,
            onValueChange = { password = it },
            label = { Text("Senha", color = Color(0xFF94A3B8)) },
            visualTransformation = PasswordVisualTransformation(),
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = Color.White,
                unfocusedTextColor = Color.White,
                focusedBorderColor = Color(0xFF10B981),
                unfocusedBorderColor = Color(0xFF334155)
            )
        )
        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = {
                if (email.isBlank() || password.isBlank()) {
                    Toast.makeText(context, "Preencha todos os campos", Toast.LENGTH_SHORT).show()
                    return@Button
                }
                loading = true
                scope.launch {
                    val result = authRepo.signIn(email.trim(), password)
                    result.fold(
                        onSuccess = {
                            val user = authRepo.getCurrentUser()
                            val role = if (user != null) {
                                val p = authRepo.getUserProfile(user.id).getOrNull()
                                p?.role ?: "user"
                            } else "user"
                            loading = false
                            onLoginSuccess(role)
                        },
                        onFailure = { error ->
                            loading = false
                            Toast.makeText(context, error.message ?: "Erro no login", Toast.LENGTH_LONG).show()
                        }
                    )
                }
            },
            enabled = !loading,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            shape = RoundedCornerShape(12.dp),
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF10B981))
        ) {
            if (loading) {
                CircularProgressIndicator(color = Color.White, modifier = Modifier.size(20.dp))
            } else {
                Text("Entrar", fontWeight = FontWeight.Bold, color = Color.White)
            }
        }
    }
}

@Composable
fun AndroidUserScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Painel do Usuário", color = Color(0xFF10B981), fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Bem-vindo ao aplicativo ADXmoney.", color = Color(0xFF94A3B8), fontSize = 14.sp)
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onLogout,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Sair da Conta", color = Color.White)
        }
    }
}

@Composable
fun AndroidAdminScreen(onLogout: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFF020617))
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Text("Painel de Administração", color = Color(0xFF10B981), fontSize = 22.sp, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(8.dp))
        Text("Painel exclusivo para administradores.", color = Color(0xFF94A3B8), fontSize = 14.sp)
        Spacer(modifier = Modifier.height(24.dp))
        Button(
            onClick = onLogout,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFE11D48)),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Sair da Conta", color = Color.White)
        }
    }
}
