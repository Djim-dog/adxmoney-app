-- ====================================================================
-- ADXmoney App - Migration 002: Row Level Security (RLS) & Grants
-- PostgreSQL / Supabase
-- ====================================================================

-- 1. Explicit Data API Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.profiles TO service_role;
GRANT SELECT, UPDATE ON TABLE public.profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wallets TO service_role;
GRANT SELECT ON TABLE public.wallets TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.wallet_transactions TO service_role;
GRANT SELECT ON TABLE public.wallet_transactions TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaigns TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaigns TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaign_assignments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.campaign_assignments TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.affiliate_profiles TO service_role;
GRANT SELECT ON TABLE public.affiliate_profiles TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.affiliate_referrals TO service_role;
GRANT SELECT ON TABLE public.affiliate_referrals TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.withdrawals TO service_role;
GRANT SELECT ON TABLE public.withdrawals TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.activity_logs TO service_role;
GRANT SELECT ON TABLE public.activity_logs TO authenticated;

-- 2. Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 3. Security Definer Helper for Role Evaluation
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- 4. Policies

-- Profiles
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin())
WITH CHECK (auth.uid() = id OR public.is_admin());

-- Wallets (Read-only for client; modified strictly through backend RPCs)
DROP POLICY IF EXISTS "wallets_select_policy" ON public.wallets;
CREATE POLICY "wallets_select_policy" ON public.wallets
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Wallet Transactions (Read-only immutable ledger for client)
DROP POLICY IF EXISTS "transactions_select_policy" ON public.wallet_transactions;
CREATE POLICY "transactions_select_policy" ON public.wallet_transactions
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

-- Campaigns (Users only see assigned active campaigns; Admin sees and manages all)
DROP POLICY IF EXISTS "campaigns_select_policy" ON public.campaigns;
CREATE POLICY "campaigns_select_policy" ON public.campaigns
FOR SELECT TO authenticated
USING (
  public.is_admin() OR
  (status = 'ACTIVE' AND EXISTS (
    SELECT 1 FROM public.campaign_assignments
    WHERE campaign_assignments.campaign_id = campaigns.id
    AND campaign_assignments.user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "campaigns_admin_modify_policy" ON public.campaigns;
CREATE POLICY "campaigns_admin_modify_policy" ON public.campaigns
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Campaign Assignments
DROP POLICY IF EXISTS "assignments_select_policy" ON public.campaign_assignments;
CREATE POLICY "assignments_select_policy" ON public.campaign_assignments
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "assignments_admin_all" ON public.campaign_assignments;
CREATE POLICY "assignments_admin_all" ON public.campaign_assignments
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Affiliate Profiles
DROP POLICY IF EXISTS "affiliate_profiles_select_policy" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_select_policy" ON public.affiliate_profiles
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin() OR is_active = true);

DROP POLICY IF EXISTS "affiliate_profiles_admin_all" ON public.affiliate_profiles;
CREATE POLICY "affiliate_profiles_admin_all" ON public.affiliate_profiles
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Affiliate Referrals
DROP POLICY IF EXISTS "referrals_select_policy" ON public.affiliate_referrals;
CREATE POLICY "referrals_select_policy" ON public.affiliate_referrals
FOR SELECT TO authenticated
USING (auth.uid() = affiliate_user_id OR auth.uid() = referred_user_id OR public.is_admin());

-- Withdrawals (User sees their own; Admin sees and reviews all)
DROP POLICY IF EXISTS "withdrawals_select_policy" ON public.withdrawals;
CREATE POLICY "withdrawals_select_policy" ON public.withdrawals
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "withdrawals_admin_all" ON public.withdrawals;
CREATE POLICY "withdrawals_admin_all" ON public.withdrawals
FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Activity Logs
DROP POLICY IF EXISTS "logs_select_policy" ON public.activity_logs;
CREATE POLICY "logs_select_policy" ON public.activity_logs
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.is_admin());
