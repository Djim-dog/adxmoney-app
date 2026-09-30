# ADXmoney Architecture Specification

## 1. Visão Geral da Arquitetura

O **ADXmoney App** segue rigorosamente os princípios da **Clean Architecture** e do **Google Recommended Android Architecture Guide**:

```
┌────────────────────────────────────────────────────────┐
│                     UI Layer                           │
│  Jetpack Compose Screen & Composables (Android)        │
│  StateFlow / UI State / Event-Driven Actions           │
└──────────────────────────┬─────────────────────────────┘
                           │ Observes State / Dispatches Events
┌──────────────────────────▼─────────────────────────────┐
│                  ViewModel Layer                       │
│  AuthViewModel, HomeViewModel, CampaignsViewModel,     │
│  WalletViewModel, WithdrawalsViewModel, AdminViewModel │
└──────────────────────────┬─────────────────────────────┘
                           │ Calls Use Cases / Repositories
┌──────────────────────────▼─────────────────────────────┐
│                 Repository Layer                       │
│  AuthRepository, WalletRepository,                     │
│  CampaignsRepository, WithdrawalsRepository,           │
│  AffiliatesRepository, AdminRepository                 │
└──────────────────────────┬─────────────────────────────┘
                           │ Network / RPC / Data Mapping
┌──────────────────────────▼─────────────────────────────┐
│              Remote Data Source (Supabase)             │
│  Supabase GoTrue (Auth)                                │
│  PostgREST (Tables com RLS)                            │
│  Remote Procedure Calls (RPCs Seguras com Definer)     │
└────────────────────────────────────────────────────────┘
```

---

## 2. Princípios de Segurança e Integridade Financeira

1. **Zero Client Manipulation**:
   O aplicativo cliente **nunca** faz `UPDATE wallets SET balance = ...`. Qualquer crédito ou débito ocorre via Stored Procedures no PostgreSQL (`complete_first_access`, `complete_campaign_execution`, `request_withdrawal`, `admin_process_withdrawal`).
2. **Nenhuma Service Role Key no APK**:
   O cliente Android e a Web utilizam exclusivamente a `SUPABASE_PUBLISHABLE_KEY` (ou `ANON_KEY`). Nenhuma chave mestra ou de serviço é incluída no código do cliente.
3. **Idempotência de Bônus e Conversão**:
   A conversão de afiliado possui restrição `UNIQUE(referred_user_id)` no PostgreSQL, impossibilitando que trocas de aparelho ou múltiplos logins gerem bônus indevidos.
4. **Reserva Imediata em Saques**:
   Ao solicitar um saque de 3.000 Kz com 5.000 Kz de saldo:
   - Saldo disponível passa instantaneamente a 2.000 Kz.
   - Saldo reservado passa a 3.000 Kz.
   - Em caso de recusa pelo Admin, a RPC executa o estorno automático para o saldo disponível com registro de auditoria.

---

## 3. Estrutura do Projeto Android (`android/`)

```
android/
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
└── app/
    ├── build.gradle.kts
    └── src/
        └── main/
            ├── AndroidManifest.xml
            └── java/com/adxmoney/app/
                ├── ADXMoneyApplication.kt
                ├── data/
                │   ├── client/
                │   │   └── SupabaseClient.kt
                │   ├── models/
                │   │   ├── UserProfile.kt
                │   │   ├── Wallet.kt
                │   │   ├── WalletTransaction.kt
                │   │   ├── Campaign.kt
                │   │   ├── CampaignAssignment.kt
                │   │   ├── Withdrawal.kt
                │   │   └── AffiliateProfile.kt
                │   └── repository/
                │       ├── AuthRepository.kt
                │       ├── WalletRepository.kt
                │       ├── CampaignsRepository.kt
                │       ├── WithdrawalsRepository.kt
                │       └── AdminRepository.kt
                ├── ui/
                │   ├── theme/
                │   │   ├── Color.kt
                │   │   ├── Theme.kt
                │   │   └── Type.kt
                │   ├── navigation/
                │   │   ├── AppNavHost.kt
                │   │   └── Screen.kt
                │   ├── screens/
                │   │   ├── auth/
                │   │   │   ├── LoginScreen.kt
                │   │   │   └── FirstAccessScreen.kt
                │   │   ├── home/
                │   │   │   └── HomeScreen.kt
                │   │   ├── campaigns/
                │   │   │   └── CampaignsScreen.kt
                │   │   ├── wallet/
                │   │   │   ├── WalletScreen.kt
                │   │   │   └── RequestWithdrawalScreen.kt
                │   │   ├── history/
                │   │   │   └── HistoryScreen.kt
                │   │   └── admin/
                │   │       ├── AdminDashboardScreen.kt
                │   │       ├── AdminUsersScreen.kt
                │   │       ├── AdminCampaignsScreen.kt
                │   │       └── AdminWithdrawalsScreen.kt
                │   └── viewmodel/
                │       ├── AuthViewModel.kt
                │       ├── HomeViewModel.kt
                │       ├── CampaignsViewModel.kt
                │       ├── WalletViewModel.kt
                │       └── AdminViewModel.kt
```

---

## 4. Guia de Handoff para o Próximo Desenvolvedor (ChatGPT / Grok)

Ao assumir o projeto:
1. **Audite o banco e as migrações** em `database/` para confirmar que as constraints e RLS permanecem intactos.
2. Abra a pasta `android/` no **Android Studio Hedgehog / Ladybug ou superior**.
3. Sincronize o projeto Gradle com JDK 17+.
4. As credenciais do Supabase estão configuradas em `SupabaseClient.kt` e no arquivo de ambiente.
5. Compile e gere o APK de teste via `./gradlew assembleDebug`.
