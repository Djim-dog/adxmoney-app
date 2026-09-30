# ADXmoney Database Specification & Architecture

## 1. Visão Geral
O banco de dados do ADXmoney é hospedado no PostgreSQL (Supabase). Ele foi desenhado para garantir **integridade financeira auditável**, **segurança contra fraude** e **isolamento estrito entre usuários**.

Nenhuma alteração de saldo, bônus de afiliado ou recompensa de campanha pode ser gravada diretamente pelo aplicativo cliente (seja Android nativo ou Web). Todas as mutações financeiras são efetuadas por **Stored Procedures com `SECURITY DEFINER` e Row Level Security (RLS)**.

---

## 2. Dicionário de Dados

### 2.1 `profiles`
Contém a identidade do usuário e o papel de acesso na aplicação.
- `id` (UUID, PK): Chave estrangeira para `auth.users(id)` com `ON DELETE CASCADE`.
- `name` (TEXT): Nome completo do usuário.
- `email` (TEXT): Email do usuário.
- `phone` (TEXT): Telefone / WhatsApp de contato.
- `role` (TEXT): Papel no sistema (`admin` ou `user`). Padrão: `'user'`.
- `first_login` (BOOLEAN): Controla a obrigatoriedade da etapa de Primeiro Acesso. Padrão: `true`.
- `is_active` (BOOLEAN): Estado da conta. Padrão: `true`.
- `created_at`, `updated_at` (TIMESTAMPTZ).

### 2.2 `wallets`
Carteira mestra do usuário.
- `id` (UUID, PK).
- `user_id` (UUID, UNIQUE): Dono da carteira.
- `balance` (NUMERIC(14,2)): Saldo líquido disponível para saque ou uso (CHECK >= 0).
- `reserved_balance` (NUMERIC(14,2)): Saldo bloqueado em solicitações de saque pendentes (CHECK >= 0).
- `updated_at` (TIMESTAMPTZ).

### 2.3 `wallet_transactions`
Ledger financeiro imutável. Cada crédito, débito ou reserva gera um registro com timestamp.
- `id` (UUID, PK).
- `wallet_id` (UUID, FK -> `wallets.id`).
- `user_id` (UUID, FK -> `auth.users.id`).
- `type` (TEXT):
  - `SIGNUP_BONUS`: Bônus de entrada (+250 Kz).
  - `AFFILIATE_COMMISSION`: Comissão de afiliado (+500 Kz).
  - `CAMPAIGN_REWARD`: Recompensa de conclusão de campanha.
  - `WITHDRAWAL_LOCK`: Bloqueio de saldo para solicitação de saque (valor negativo).
  - `WITHDRAWAL_PAID`: Liquidação definitiva do saque processado.
  - `WITHDRAWAL_REFUND`: Estorno de saque rejeitado (valor positivo de volta ao disponível).
  - `MANUAL_ADJUSTMENT`: Ajuste contábil auditado.
- `amount` (NUMERIC(14,2)).
- `description` (TEXT).
- `reference_id` (TEXT): ID de referência da campanha, saque ou código.
- `status` (TEXT): `PENDING`, `COMPLETED`, `CANCELLED`, `FAILED`.

### 2.4 `campaigns`
Campanhas criadas pelo Administrador.
- `id` (UUID, PK).
- `title` (TEXT): Título da campanha.
- `description` (TEXT): Descrição detalhada.
- `platform` (TEXT): `TikTok`, `Instagram`, `YouTube`.
- `target_url` (TEXT): Link de destino para o usuário executar.
- `instructions` (TEXT): Instruções de execução.
- `reward_amount` (NUMERIC(14,2)): Valor pago ao usuário (CHECK > 0).
- `status` (TEXT): `ACTIVE`, `PAUSED`, `COMPLETED`.
- `period_start`, `period_end` (TIMESTAMPTZ).

### 2.5 `campaign_assignments`
Atribuição de campanhas a usuários específicos.
- `id` (UUID, PK).
- `campaign_id` (UUID, FK -> `campaigns.id`).
- `user_id` (UUID, FK -> `auth.users.id`).
- `status` (TEXT): `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- `completed_at` (TIMESTAMPTZ).
- UNIQUE Constraint: `(campaign_id, user_id)`.

### 2.6 `affiliate_profiles`
Identidade de afiliado separada do perfil de usuário comum.
- `id` (UUID, PK).
- `user_id` (UUID, UNIQUE, FK -> `auth.users.id`).
- `affiliate_code` (TEXT, UNIQUE): Ex: `ADX123456`.
- `is_active` (BOOLEAN): Ativação controlada exclusivamente pelo Admin.
- `total_referrals` (INTEGER): Total de conversões válidas.
- `total_earned` (NUMERIC(14,2)): Total de comissões ganhas em Kz.

### 2.7 `affiliate_referrals`
Registro de conversões com proteção rigorosa contra duplicidade.
- `id` (UUID, PK).
- `affiliate_user_id` (UUID, FK): Usuário dono do código.
- `referred_user_id` (UUID, UNIQUE, FK): Novo usuário convertido (UNIQUE garante conversão única na vida do usuário).
- `bonus_user` (NUMERIC): 250.00 Kz.
- `commission_affiliate` (NUMERIC): 500.00 Kz.

### 2.8 `withdrawals`
Solicitações de saque.
- `id` (UUID, PK).
- `user_id` (UUID, FK).
- `amount` (NUMERIC(14,2)): Valor solicitado.
- `method` (TEXT): Ex: Multicaixa Express, Transferência Bancária (IBAN).
- `payment_details` (JSONB): Chave PIX / IBAN / Titular / Telefone.
- `status` (TEXT): `PENDING`, `APPROVED`, `REJECTED`, `PAID`.
- `requested_at`, `processed_at` (TIMESTAMPTZ).
- `processed_by` (UUID, FK).
- `rejection_reason` (TEXT).

### 2.9 `activity_logs`
Trilha de auditoria das operações de usuários e administradores.
- `id`, `user_id`, `action_type`, `title`, `details`, `metadata`, `created_at`.

---

## 3. Segurança & RPCs (Remote Procedure Calls)

| RPC | Permissão | Descrição |
|-----|-----------|-----------|
| `complete_first_access(p_name, p_phone, p_affiliate_code)` | Autenticado | Finaliza primeiro acesso, aplica bônus de 250 Kz e comissão de 500 Kz via código com validação e idempotência. |
| `complete_campaign_execution(p_campaign_id)` | Autenticado | Conclui a campanha atribuída, credita a recompensa na carteira e cria transação imutável. |
| `request_withdrawal(p_amount, p_method, p_payment_details)` | Autenticado | Bloqueia o valor disponível (movendo para `reserved_balance`) e cria solicitação com status `PENDING`. |
| `admin_process_withdrawal(p_withdrawal_id, p_action, p_rejection_reason)` | Apenas Admin | Processa saque: aprova, paga (debitando de `reserved_balance`) ou rejeita (estornando para `balance`). |
| `admin_assign_campaign(p_campaign_id, p_user_ids)` | Apenas Admin | Atribui campanhas para um ou múltiplos usuários. |
| `admin_toggle_affiliate(p_user_id, p_is_active, p_custom_code)` | Apenas Admin | Habilita ou desabilita o status de afiliado do usuário. |
