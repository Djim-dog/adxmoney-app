# ADXmoney App — Plataforma Operacional & Aplicativo Android Nativo

Bem-vindo ao repositório do **ADXmoney App**.

Este projeto contém a especificação e implementação arquitetural completa do ADXmoney, desenvolvido com **PostgreSQL / Supabase**, código **Android nativo em Kotlin/Jetpack Compose** (localizado na pasta `android/`) e um console de operação/validação interativo em tempo real com dados 100% reais do banco de dados.

---

## 📌 Sumário
1. [Arquitetura & Especificação](#arquitetura--especificação)
2. [Estrutura de Pastas](#estrutura-de-pastas)
3. [Segurança e Integridade Financeira](#segurança-e-integridade-financeira)
4. [Banco de Dados & Migrações](#banco-de-dados--migrações)
5. [Como Executar o Aplicativo Android Nativo](#como-executar-o-aplicativo-android-nativo)
6. [Handoff para o Próximo Desenvolvedor (ChatGPT / Grok)](#handoff-para-o-próximo-desenvolvedor)

---

## 🏛 Arquitetura & Especificação

- **Backend**: Supabase (PostgreSQL 15+, GoTrue Auth, Row Level Security habilitado em 100% das tabelas, Stored Procedures atômicas com `SECURITY DEFINER`).
- **Android Nativo (`android/`)**:
  - Kotlin + Jetpack Compose
  - Android Architecture Components (ViewModel, StateFlow, Coroutines)
  - Navigation Component
  - Repository Pattern
  - Supabase Kotlin Client (`io.github.jan-tennert.supabase:postgrest-kt`, `gotrue-kt`)
  - Sem uso de WebViews.
- **Painel de Validação Operacional**:
  - React 18 + Vite + Tailwind CSS + Lucide Icons + Supabase JS Client
  - Permite validar imediatamente todos os fluxos de Admin e Usuário (Primeiro Acesso, Campanhas, Atribuições, Carteira, Afiliados, Saques e Auditoria).

---

## 📂 Estrutura de Pastas

```
├── android/                   # Projeto Nativo Android Kotlin / Jetpack Compose
│   ├── app/
│   │   ├── build.gradle.kts   # Configuração de build, dependências do Jetpack e Supabase
│   │   └── src/main/
│   │       ├── AndroidManifest.xml
│   │       └── java/com/adxmoney/app/
│   │           ├── ADXMoneyApplication.kt
│   │           ├── data/       # Supabase Client, Data Models e Repositories
│   │           └── ui/         # Navigation, Screens, ViewModels e Temas Compose
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── database/                  # Migrações PostgreSQL imutáveis e auditadas
│   ├── 001_initial_schema.sql # Tabelas base (perfis, carteiras, campanhas, saques, etc.)
│   ├── 002_rls.sql            # Concessão de API Grants e Políticas de Row Level Security
│   ├── 003_functions.sql      # Stored Procedures para primeiro acesso, saques e campanhas
│   └── README.md
├── src/                       # Console operacional de visualização e controle real
├── ARCHITECTURE.md            # Detalhamento técnico da arquitetura
├── DATABASE.md                # Dicionário de dados e regras financeiras
└── README.md                  # Este documento
```

---

## 🔒 Segurança e Integridade Financeira

1. **Sem dados fictícios**: O sistema não exibe saldos, campanhas ou saques simulados. Se a base não tiver registros reais, o estado vazio oficial é apresentado.
2. **Imutabilidade e Idempotência**:
   - Conversões de afiliado têm chave única `UNIQUE(referred_user_id)` no banco. Nenhuma repetição de login ou reinstalação gera novo bônus.
   - O saldo disponível é bloqueado imediatamente ao solicitar um saque.
   - Se o saque for rejeitado pelo Admin, o valor reservado é estornado automaticamente para o saldo disponível através de uma transação auditada.
3. **Nenhuma chave privilegiada no aplicativo**:
   - Apenas a chave pública anônima é utilizada pelos clientes.
   - Operações financeiras críticas são executadas através de stored procedures com validações de privilégio e `FOR UPDATE` locks no banco de dados.

---

## 🚀 Como Executar o Aplicativo Android Nativo

1. Abra a pasta `android/` no **Android Studio Hedgehog (2023.1.1) ou versão mais recente**.
2. Certifique-se de estar utilizando o **JDK 17** no Gradle.
3. Aguarde o Gradle Sync concluir o download das bibliotecas:
   - Jetpack Compose BOM
   - Supabase kt (Auth, PostgREST)
   - KotlinX Serialization
   - Navigation Compose
4. Execute o build pelo terminal do Android Studio:
   ```bash
   ./gradlew assembleDebug
   ```
5. Instale o APK no emulador ou dispositivo físico conectado:
   ```bash
   ./gradlew installDebug
   ```

---

## 🤝 Handoff para o Próximo Desenvolvedor

Para o desenvolvedor que assumir a continuidade deste projeto (ChatGPT, Grok ou engenheiro sênior):
1. Leia atentamente `ARCHITECTURE.md` e `DATABASE.md`.
2. As tabelas e regras de segurança já estão implantadas no Supabase associado.
3. As entidades Kotlin espelham exatamente os esquemas do PostgreSQL com `@Serializable`.
4. Os casos de uso cobrem os dois papéis (`admin` e `user`).
5. O acabamento de branding definitivo e logotipos pode ser adicionado diretamente na camada de UI.
