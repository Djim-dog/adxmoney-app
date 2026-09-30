import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FirstAccessModal } from "@/components/FirstAccessModal";
import { UserHomeSection } from "@/components/user/UserHomeSection";
import { UserCampaignsSection } from "@/components/user/UserCampaignsSection";
import { UserWalletSection } from "@/components/user/UserWalletSection";
import { UserHistorySection } from "@/components/user/UserHistorySection";
import { UserProfileSection } from "@/components/user/UserProfileSection";
import { WithdrawModal } from "@/components/user/WithdrawModal";
import {
  LayoutDashboard,
  Layers,
  Wallet,
  History,
  User,
  LogOut,
  Bell,
  RefreshCw,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function UserAppPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<"home" | "campaigns" | "wallet" | "history" | "profile">("home");

  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ id: string; balance: number; reserved_balance: number } | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [affiliate, setAffiliate] = useState<any | null>(null);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || "");
      setProfilePhone(profile.phone || "");
    }
  }, [profile]);

  // Carregar todos os dados operacionais do usuário
  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Carteira
      const { data: wData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wData) {
        setWallet(wData);
      } else {
        // Garantir criação automática da carteira caso não exista
        const { data: createdW } = await supabase
          .from("wallets")
          .upsert({ user_id: user.id, balance: 0.0, reserved_balance: 0.0 })
          .select()
          .maybeSingle();
        if (createdW) setWallet(createdW);
      }

      // 2. Campanhas atribuídas ao usuário
      const { data: assignments } = await supabase
        .from("campaign_assignments")
        .select(`
          id,
          status,
          campaign_id,
          campaigns (*)
        `)
        .eq("user_id", user.id);

      if (assignments) {
        const mapped = assignments
          .filter((a) => a.campaigns)
          .map((a) => ({
            ...a.campaigns,
            assignment_id: a.id,
            assignment_status: a.status,
          }));
        setCampaigns(mapped);
      }

      // 3. Extrato / Transações
      const { data: txData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (txData) setTransactions(txData);

      // 4. Afiliado
      const { data: affData } = await supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (affData) setAffiliate(affData);
    } catch (err: any) {
      console.error("Erro ao carregar dados do usuário:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  // Execução de Campanha
  const handleExecuteCampaign = (campaign: any) => {
    if (campaign.target_url) {
      window.open(campaign.target_url, "_blank", "noopener,noreferrer");
    }
    setConfirmingId(campaign.id);
    toast.info("Acesse o link da campanha e clique em 'Confirmar Conclusão' para receber.");
  };

  // Confirmação de conclusão de campanha
  const handleConfirmCompletion = async (campaign: any) => {
    setExecutingId(campaign.id);
    try {
      const { data, error } = await supabase.rpc("complete_campaign_execution", {
        p_campaign_id: campaign.id,
      });

      if (error) {
        toast.error("Erro ao creditar recompensa: " + error.message);
      } else {
        toast.success(`Parabéns! Recompensa de ${(data?.reward_amount || campaign.reward_amount).toLocaleString("pt-AO")} Kz creditada com sucesso!`);
        setConfirmingId(null);
        await loadUserData();
      }
    } catch (err: any) {
      toast.error("Erro na validação da campanha: " + err.message);
    } finally {
      setExecutingId(null);
    }
  };

  // Atualização de Perfil e Senha
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);

    try {
      const { error: profError } = await supabase
        .from("profiles")
        .update({
          name: profileName.trim(),
          phone: profilePhone.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (profError) throw profError;

      if (newPassword.trim()) {
        if (newPassword.length < 6) {
          toast.error("A nova senha deve ter no mínimo 6 caracteres.");
          setUpdatingProfile(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("As senhas digitadas não coincidem.");
          setUpdatingProfile(false);
          return;
        }

        const { error: passError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (passError) throw passError;
        toast.success("Senha alterada com sucesso!");
        setNewPassword("");
        setConfirmPassword("");
      }

      toast.success("Perfil atualizado com sucesso!");
      await refreshProfile();
    } catch (err: any) {
      toast.error("Erro ao salvar alterações: " + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Modal obrigatório de primeiro acesso para novos usuários */}
      <FirstAccessModal
        open={Boolean(profile?.first_login)}
        onCompleted={async () => {
          await refreshProfile();
          await loadUserData();
        }}
      />

      {/* Modal de Saque */}
      <WithdrawModal
        open={isWithdrawModalOpen}
        onOpenChange={setIsWithdrawModalOpen}
        availableBalance={wallet?.balance || 0}
        onSuccess={loadUserData}
      />

      {/* Topbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-4 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 text-slate-950 font-black text-sm flex items-center justify-center tracking-wider">
            ADX
          </div>
          <div>
            <div className="text-xs font-bold text-white flex items-center gap-1.5">
              ADX Money <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Membro</span>
            </div>
            <div className="text-[10px] text-slate-400">
              {profile?.name || user?.email}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={loadUserData}
            disabled={loading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg h-8 w-8"
            title="Atualizar Dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin text-emerald-400" : ""}`} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => signOut()}
            className="text-slate-400 hover:text-red-400 hover:bg-slate-800/80 text-xs h-8 px-2.5 rounded-lg flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Main Container com Navegação em Abas */}
      <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/80 scrollbar-none">
          <Button
            variant={activeSection === "home" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("home")}
            className={`text-xs h-8 rounded-lg px-3 flex items-center gap-1.5 ${
              activeSection === "home"
                ? "bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Início
          </Button>

          <Button
            variant={activeSection === "campaigns" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("campaigns")}
            className={`text-xs h-8 rounded-lg px-3 flex items-center gap-1.5 ${
              activeSection === "campaigns"
                ? "bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Tarefas ({campaigns.filter((c) => c.assignment_status !== "COMPLETED").length})
          </Button>

          <Button
            variant={activeSection === "wallet" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("wallet")}
            className={`text-xs h-8 rounded-lg px-3 flex items-center gap-1.5 ${
              activeSection === "wallet"
                ? "bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Carteira
          </Button>

          <Button
            variant={activeSection === "history" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("history")}
            className={`text-xs h-8 rounded-lg px-3 flex items-center gap-1.5 ${
              activeSection === "history"
                ? "bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Histórico
          </Button>

          <Button
            variant={activeSection === "profile" ? "secondary" : "ghost"}
            size="sm"
            onClick={() => setActiveSection("profile")}
            className={`text-xs h-8 rounded-lg px-3 flex items-center gap-1.5 ${
              activeSection === "profile"
                ? "bg-emerald-500 text-slate-950 font-semibold hover:bg-emerald-400"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Meu Perfil
          </Button>
        </div>

        {/* Dynamic Content Views */}
        {activeSection === "home" && (
          <UserHomeSection
            wallet={wallet}
            affiliate={affiliate}
            campaigns={campaigns}
            confirmingId={confirmingId}
            executingId={executingId}
            onOpenWithdraw={() => setIsWithdrawModalOpen(true)}
            onExecuteCampaign={handleExecuteCampaign}
            onConfirmCompletion={handleConfirmCompletion}
            onCopyText={copyToClipboard}
          />
        )}

        {activeSection === "campaigns" && (
          <UserCampaignsSection
            campaigns={campaigns}
            confirmingId={confirmingId}
            executingId={executingId}
            onExecuteCampaign={handleExecuteCampaign}
            onConfirmCompletion={handleConfirmCompletion}
          />
        )}

        {activeSection === "wallet" && (
          <UserWalletSection
            wallet={wallet}
            transactions={transactions}
            onOpenWithdraw={() => setIsWithdrawModalOpen(true)}
          />
        )}

        {activeSection === "history" && (
          <UserHistorySection campaigns={campaigns} />
        )}

        {activeSection === "profile" && (
          <UserProfileSection
            user={user}
            profile={profile}
            profileName={profileName}
            profilePhone={profilePhone}
            newPassword={newPassword}
            confirmPassword={confirmPassword}
            updatingProfile={updatingProfile}
            onNameChange={setProfileName}
            onPhoneChange={setProfilePhone}
            onNewPasswordChange={setNewPassword}
            onConfirmPasswordChange={setConfirmPassword}
            onUpdateProfile={handleUpdateProfile}
          />
        )}
      </main>
    </div>
  );
}
