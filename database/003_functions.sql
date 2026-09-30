-- ====================================================================
-- ADXmoney App - Migration 003: Core Stored Procedures & Triggers
-- PostgreSQL / Supabase
-- ====================================================================

-- 1. Trigger on auth.users for profile and initial wallet creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, first_name, last_name, email, role, first_login, is_active)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', (new.raw_user_meta_data ->> 'first_name') || ' ' || (new.raw_user_meta_data ->> 'last_name'), split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    COALESCE(new.raw_user_meta_data ->> 'role', 'user'),
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  INSERT INTO public.wallets (user_id, balance, reserved_balance)
  VALUES (new.id, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. First Access Completion RPC
CREATE OR REPLACE FUNCTION public.complete_first_access(
  p_name text,
  p_phone text,
  p_affiliate_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_first_login BOOLEAN;
  v_affiliate RECORD;
  v_clean_code TEXT;
  v_user_wallet_id UUID;
  v_affiliate_wallet_id UUID;
  v_bonus_applied BOOLEAN := FALSE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT first_login INTO v_first_login FROM public.profiles WHERE id = v_user_id;
  IF v_first_login IS NOT TRUE THEN
    RAISE EXCEPTION 'O primeiro acesso já foi concluído para esta conta.';
  END IF;

  INSERT INTO public.wallets (user_id, balance, reserved_balance)
  VALUES (v_user_id, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_user_wallet_id FROM public.wallets WHERE user_id = v_user_id;

  IF p_affiliate_code IS NOT NULL AND length(trim(p_affiliate_code)) > 0 THEN
    v_clean_code := upper(trim(p_affiliate_code));

    SELECT * INTO v_affiliate
    FROM public.affiliate_profiles
    WHERE upper(affiliate_code) = v_clean_code AND is_active = true;

    IF v_affiliate.id IS NULL THEN
      RAISE EXCEPTION 'Código de afiliado inválido ou inativo.';
    END IF;

    IF v_affiliate.user_id = v_user_id THEN
      RAISE EXCEPTION 'Você não pode utilizar seu próprio código de afiliado.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.affiliate_referrals WHERE referred_user_id = v_user_id) THEN
      RAISE EXCEPTION 'Usuário já possui conversão de afiliado registrada.';
    END IF;

    -- Converte: Usuário +250 Kz, Afiliado +500 Kz
    INSERT INTO public.affiliate_referrals (
      affiliate_user_id,
      referred_user_id,
      affiliate_code,
      bonus_user,
      commission_affiliate,
      status
    ) VALUES (
      v_affiliate.user_id,
      v_user_id,
      v_clean_code,
      250.00,
      500.00,
      'COMPLETED'
    );

    UPDATE public.wallets
    SET balance = balance + 250.00, updated_at = NOW()
    WHERE id = v_user_wallet_id;

    INSERT INTO public.wallet_transactions (
      wallet_id, user_id, type, amount, description, reference_id, status
    ) VALUES (
      v_user_wallet_id, v_user_id, 'SIGNUP_BONUS', 250.00, 'Bônus de primeiro acesso via convite', v_clean_code, 'COMPLETED'
    );

    INSERT INTO public.wallets (user_id, balance, reserved_balance)
    VALUES (v_affiliate.user_id, 0.00, 0.00)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT id INTO v_affiliate_wallet_id FROM public.wallets WHERE user_id = v_affiliate.user_id;

    UPDATE public.wallets
    SET balance = balance + 500.00, updated_at = NOW()
    WHERE id = v_affiliate_wallet_id;

    INSERT INTO public.wallet_transactions (
      wallet_id, user_id, type, amount, description, reference_id, status
    ) VALUES (
      v_affiliate_wallet_id, v_affiliate.user_id, 'AFFILIATE_COMMISSION', 500.00, 'Comissão de novo usuário indicado: ' || COALESCE(p_name, 'Novo Usuário'), v_user_id::text, 'COMPLETED'
    );

    UPDATE public.affiliate_profiles
    SET total_referrals = total_referrals + 1,
        total_earned = total_earned + 500.00,
        updated_at = NOW()
    WHERE id = v_affiliate.id;

    v_bonus_applied := TRUE;
  END IF;

  UPDATE public.profiles
  SET name = COALESCE(NULLIF(trim(p_name), ''), name),
      phone = COALESCE(NULLIF(trim(p_phone), ''), phone),
      first_login = false,
      updated_at = NOW()
  WHERE id = v_user_id;

  INSERT INTO public.activity_logs (user_id, action_type, title, details)
  VALUES (
    v_user_id,
    'FIRST_ACCESS_COMPLETED',
    'Primeiro acesso concluído',
    CASE WHEN v_bonus_applied THEN 'Com bônus de afiliado de 250 Kz aplicado.' ELSE 'Concluído sem código de afiliado.' END
  );

  RETURN jsonb_build_object(
    'success', true,
    'bonus_applied', v_bonus_applied,
    'bonus_amount', CASE WHEN v_bonus_applied THEN 250.00 ELSE 0.00 END
  );
END;
$$;

-- 3. Campaign Execution Completion RPC
CREATE OR REPLACE FUNCTION public.complete_campaign_execution(
  p_campaign_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_assignment RECORD;
  v_campaign RECORD;
  v_wallet_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT * INTO v_campaign
  FROM public.campaigns
  WHERE id = p_campaign_id;

  IF v_campaign.id IS NULL THEN
    RAISE EXCEPTION 'Campanha não encontrada.';
  END IF;

  IF v_campaign.status != 'ACTIVE' THEN
    RAISE EXCEPTION 'Esta campanha não está ativa no momento.';
  END IF;

  SELECT * INTO v_assignment
  FROM public.campaign_assignments
  WHERE campaign_id = p_campaign_id AND user_id = v_user_id
  FOR UPDATE;

  IF v_assignment.id IS NULL THEN
    RAISE EXCEPTION 'Esta campanha não está atribuída à sua conta.';
  END IF;

  IF v_assignment.status = 'COMPLETED' THEN
    RAISE EXCEPTION 'Você já concluiu esta campanha anteriormente.';
  END IF;

  INSERT INTO public.wallets (user_id, balance, reserved_balance)
  VALUES (v_user_id, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT id INTO v_wallet_id FROM public.wallets WHERE user_id = v_user_id FOR UPDATE;

  UPDATE public.campaign_assignments
  SET status = 'COMPLETED',
      completed_at = NOW()
  WHERE id = v_assignment.id;

  UPDATE public.wallets
  SET balance = balance + v_campaign.reward_amount,
      updated_at = NOW()
  WHERE id = v_wallet_id;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount,
    description,
    reference_id,
    status
  ) VALUES (
    v_wallet_id,
    v_user_id,
    'CAMPAIGN_REWARD',
    v_campaign.reward_amount,
    'Conclusão da campanha: ' || v_campaign.title,
    p_campaign_id::text,
    'COMPLETED'
  );

  INSERT INTO public.activity_logs (user_id, action_type, title, details)
  VALUES (
    v_user_id,
    'CAMPAIGN_COMPLETED',
    'Campanha concluída: ' || v_campaign.title,
    'Recompensa de ' || v_campaign.reward_amount || ' Kz creditada na carteira.'
  );

  RETURN jsonb_build_object(
    'success', true,
    'reward_amount', v_campaign.reward_amount,
    'campaign_title', v_campaign.title
  );
END;
$$;

-- 4. User Withdrawal Request RPC (with immediate balance locking)
CREATE OR REPLACE FUNCTION public.request_withdrawal(
  p_amount NUMERIC,
  p_method TEXT,
  p_payment_details JSONB
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_wallet RECORD;
  v_withdrawal_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'O valor do saque deve ser maior que zero.';
  END IF;

  IF p_method IS NULL OR length(trim(p_method)) = 0 THEN
    RAISE EXCEPTION 'Informe o método de pagamento para o saque.';
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_user_id
  FOR UPDATE;

  IF v_wallet.id IS NULL THEN
    RAISE EXCEPTION 'Carteira não encontrada.';
  END IF;

  IF v_wallet.balance < p_amount THEN
    RAISE EXCEPTION 'Saldo disponível insuficiente para realizar este saque.';
  END IF;

  UPDATE public.wallets
  SET balance = balance - p_amount,
      reserved_balance = reserved_balance + p_amount,
      updated_at = NOW()
  WHERE id = v_wallet.id;

  INSERT INTO public.withdrawals (
    user_id,
    amount,
    method,
    payment_details,
    status,
    requested_at
  ) VALUES (
    v_user_id,
    p_amount,
    trim(p_method),
    COALESCE(p_payment_details, '{}'::jsonb),
    'PENDING',
    NOW()
  )
  RETURNING id INTO v_withdrawal_id;

  INSERT INTO public.wallet_transactions (
    wallet_id,
    user_id,
    type,
    amount,
    description,
    reference_id,
    status
  ) VALUES (
    v_wallet.id,
    v_user_id,
    'WITHDRAWAL_LOCK',
    -p_amount,
    'Reserva de saldo para solicitação de saque #' || substr(v_withdrawal_id::text, 1, 8),
    v_withdrawal_id::text,
    'COMPLETED'
  );

  INSERT INTO public.activity_logs (user_id, action_type, title, details)
  VALUES (
    v_user_id,
    'WITHDRAWAL_REQUESTED',
    'Solicitação de saque criada',
    'Valor: ' || p_amount || ' Kz via ' || p_method
  );

  RETURN jsonb_build_object(
    'success', true,
    'withdrawal_id', v_withdrawal_id,
    'amount', p_amount,
    'status', 'PENDING'
  );
END;
$$;

-- 5. Admin Process Withdrawal RPC (Approve, Paid, Reject with Refund)
CREATE OR REPLACE FUNCTION public.admin_process_withdrawal(
  p_withdrawal_id UUID,
  p_action TEXT,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_role TEXT;
  v_withdrawal RECORD;
  v_wallet RECORD;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT role INTO v_admin_role FROM public.profiles WHERE id = v_admin_id;
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem processar saques.';
  END IF;

  SELECT * INTO v_withdrawal
  FROM public.withdrawals
  WHERE id = p_withdrawal_id
  FOR UPDATE;

  IF v_withdrawal.id IS NULL THEN
    RAISE EXCEPTION 'Solicitação de saque não encontrada.';
  END IF;

  IF v_withdrawal.status IN ('PAID', 'REJECTED') THEN
    RAISE EXCEPTION 'Este saque já foi finalizado anteriormente.';
  END IF;

  SELECT * INTO v_wallet
  FROM public.wallets
  WHERE user_id = v_withdrawal.user_id
  FOR UPDATE;

  IF p_action = 'APPROVE' THEN
    UPDATE public.withdrawals
    SET status = 'APPROVED',
        processed_at = NOW(),
        processed_by = v_admin_id
    WHERE id = p_withdrawal_id;

  ELSIF p_action = 'PAID' THEN
    UPDATE public.wallets
    SET reserved_balance = GREATEST(0.00, reserved_balance - v_withdrawal.amount),
        updated_at = NOW()
    WHERE id = v_wallet.id;

    UPDATE public.withdrawals
    SET status = 'PAID',
        processed_at = NOW(),
        processed_by = v_admin_id
    WHERE id = p_withdrawal_id;

    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      type,
      amount,
      description,
      reference_id,
      status
    ) VALUES (
      v_wallet.id,
      v_withdrawal.user_id,
      'WITHDRAWAL_PAID',
      0.00,
      'Saque liquidado e transferido ao usuário (' || v_withdrawal.amount || ' Kz)',
      p_withdrawal_id::text,
      'COMPLETED'
    );

  ELSIF p_action = 'REJECT' THEN
    -- ESTORNO: Devolver o saldo reservado ao saldo disponível
    UPDATE public.wallets
    SET balance = balance + v_withdrawal.amount,
        reserved_balance = GREATEST(0.00, reserved_balance - v_withdrawal.amount),
        updated_at = NOW()
    WHERE id = v_wallet.id;

    UPDATE public.withdrawals
    SET status = 'REJECTED',
        rejection_reason = COALESCE(p_rejection_reason, 'Motivo não especificado pela administração'),
        processed_at = NOW(),
        processed_by = v_admin_id
    WHERE id = p_withdrawal_id;

    INSERT INTO public.wallet_transactions (
      wallet_id,
      user_id,
      type,
      amount,
      description,
      reference_id,
      status
    ) VALUES (
      v_wallet.id,
      v_withdrawal.user_id,
      'WITHDRAWAL_REFUND',
      v_withdrawal.amount,
      'Estorno de saque rejeitado: ' || COALESCE(p_rejection_reason, 'Dados incorretos'),
      p_withdrawal_id::text,
      'COMPLETED'
    );

  ELSE
    RAISE EXCEPTION 'Ação inválida. Use APPROVE, PAID ou REJECT.';
  END IF;

  INSERT INTO public.activity_logs (user_id, action_type, title, details)
  VALUES (
    v_admin_id,
    'ADMIN_WITHDRAWAL_' || p_action,
    'Saque #' || substr(p_withdrawal_id::text, 1, 8) || ' processado: ' || p_action,
    'Usuário: ' || v_withdrawal.user_id || ' | Valor: ' || v_withdrawal.amount || ' Kz'
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'withdrawal_id', p_withdrawal_id,
    'status', (SELECT status FROM public.withdrawals WHERE id = p_withdrawal_id)
  );
END;
$$;

-- 6. Admin Create User RPC (Secure backend-only provisioning)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email text,
  p_password text,
  p_name text,
  p_phone text DEFAULT NULL,
  p_role text DEFAULT 'user'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_admin_id UUID;
  v_admin_role TEXT;
  v_new_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  SELECT role INTO v_admin_role FROM public.profiles WHERE id = v_admin_id;
  IF v_admin_role != 'admin' THEN
    RAISE EXCEPTION 'Acesso negado: apenas administradores podem criar usuários.';
  END IF;

  IF p_email IS NULL OR length(trim(p_email)) < 5 THEN
    RAISE EXCEPTION 'E-mail inválido.';
  END IF;

  IF p_password IS NULL OR length(p_password) < 6 THEN
    RAISE EXCEPTION 'A senha deve conter no mínimo 6 caracteres.';
  END IF;

  IF EXISTS (SELECT 1 FROM auth.users WHERE lower(email) = lower(trim(p_email))) THEN
    RAISE EXCEPTION 'Já existe um usuário cadastrado com este e-mail.';
  END IF;

  v_new_user_id := gen_random_uuid();
  v_encrypted_pw := crypt(p_password, gen_salt('bf'));

  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud
  ) VALUES (
    v_new_user_id,
    '00000000-0000-0000-0000-000000000000',
    lower(trim(p_email)),
    v_encrypted_pw,
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    jsonb_build_object('name', p_name, 'first_name', split_part(p_name, ' ', 1), 'phone', p_phone, 'role', p_role),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
  );

  INSERT INTO public.profiles (
    id, name, email, phone, role, first_login, is_active
  ) VALUES (
    v_new_user_id,
    trim(p_name),
    lower(trim(p_email)),
    trim(p_phone),
    COALESCE(p_role, 'user'),
    true,
    true
  )
  ON CONFLICT (id) DO UPDATE
  SET name = EXCLUDED.name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      role = EXCLUDED.role,
      first_login = true,
      is_active = true;

  INSERT INTO public.wallets (user_id, balance, reserved_balance)
  VALUES (v_new_user_id, 0.00, 0.00)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.activity_logs (user_id, action_type, title, details)
  VALUES (
    v_admin_id,
    'USER_CREATED',
    'Novo usuário cadastrado pelo Admin',
    'Usuário: ' || p_email || ' | Perfil: ' || p_role
  );

  RETURN jsonb_build_object(
    'success', true,
    'user_id', v_new_user_id,
    'email', lower(trim(p_email))
  );
END;
$$;
