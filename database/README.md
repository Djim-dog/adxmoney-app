# Migrações do Banco de Dados ADXmoney (PostgreSQL / Supabase)

Esta pasta contém o histórico linear e imutável das migrações do banco de dados do **ADXmoney App**.

## Ordem de Execução

1. **`001_initial_schema.sql`**
   - Criação das tabelas fundamentais: `profiles`, `wallets`, `wallet_transactions`, `campaigns`, `campaign_assignments`, `affiliate_profiles`, `affiliate_referrals`, `withdrawals`, `activity_logs`.
   - Índices de performance para busca em carteiras, transações e campanhas.

2. **`002_rls.sql`**
   - Concessão explícita de Data API Grants (`service_role` e `authenticated`).
   - Habilitação de Row Level Security (RLS) em 100% das tabelas.
   - Função `is_admin()` com `SECURITY DEFINER`.
   - Políticas de isolamento rígido de usuários e acesso irrestrito para administradores auditados.

3. **`003_functions.sql`**
   - Trigger `handle_new_user()` para inicialização automática de perfil e carteira com saldo zero.
   - Stored Procedure `complete_first_access()`: validação de código de afiliado, idempotência de conversão, crédito de bônus (+250 Kz) e comissão (+500 Kz).
   - Stored Procedure `complete_campaign_execution()`: trava de atribuição, crédito na carteira e geração de transação imutável no ledger.
   - Stored Procedure `request_withdrawal()`: validação de saldo e bloqueio do valor disponível para reservado.
   - Stored Procedure `admin_process_withdrawal()`: aprovação, pagamento e estorno automático com devolução ao saldo disponível em caso de recusa.

## Regras Obrigatórias
- **Nunca alterar silenciosamente** arquivos já executados.
- Novas alterações devem gerar novos arquivos incrementais (`004_...sql`, `005_...sql`).
