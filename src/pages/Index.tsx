import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FirstAccessModal } from "@/components/FirstAccessModal";
import { WithdrawalModal } from "@/components/WithdrawalModal";
import { toast } from "sonner";
import {
  Wallet,
  ArrowUpRight,
  Sparkles,
  TrendingUp,
  Clock,
  Layers,
  Users,
  Shield,
  History,
  CheckCircle2,
  ExternalLink,
  PlusCircle,
  LogOut,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  UserPlus,
  Play,
  Share2,
  Settings,
  KeyRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CampaignItem {
  id: string;
  title: string;
  description: string;
  platform: string;
  target_url: string;
  instructions: string;
  reward_amount: number;
  status: string;
  assignment_id?: string;
  assignment_status?: string;
  completed_at?: string | null;
}

interface WalletData {
  id: string;
  balance: number;
  reserved_balance: number;
}

interface TransactionItem {
  id: string;
  type: string;
  amount: number;
  description: string;
  created_at: string;
  status: string;
}

interface WithdrawalItem {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  payment_details: Record<string, any>;
  status: string;
  requested_at: string;
  rejection_reason?: string | null;
  profiles?: {
    name: string | null;
    email: string | null;
  } | null;
}

interface UserProfileItem {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  first_login: boolean;
  is_active: boolean;
  created_at: string;
  wallets?: {
    balance: number;
    reserved_balance: number;
  }[] | null;
}

interface AffiliateData {
  id: string;
  affiliate_code: string;
  is_active: boolean;
  total_referrals: number;
  total_earned: number;
}

const Index = () => {
  const { user, profile, isAdmin, signOut, refreshProfile } = useAuth();

  const [activeTab, setActiveTab] = useState<string>("campaigns");
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [affiliate, setAffiliate] = useState<AffiliateData | null>(null);
  const [adminUsers, setAdminUsers] = useState<UserProfileItem[]>([]);
  const [adminWithdrawals, setAdminWithdrawals] = useState<WithdrawalItem[]>([]);
  const [adminCampaigns, setAdminCampaigns] = useState<CampaignItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [executingCampaignId, setExecutingCampaignId] = useState<string | null>(null);

  // Modais de Criação pelo Admin
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isAssignCampaignOpen, setIsAssignCampaignOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [selectedCampaignForAssign, setSelectedCampaignForAssign] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Formulário Novo Usuário
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("user");

  // Formulário Nova Campanha
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPlatform, setNewPlatform] = useState("TikTok");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newReward, setNewReward] = useState("150");

  // Formulário Alterar Senha
  const [updatePassword, setUpdatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [submittingAction, setSubmittingAction] = useState(false);

  // Carregamento dos dados
  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Carregar Carteira
      const { data: wData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wData) setWallet(wData as WalletData);

      // 2. Carregar Transações do Usuário
      const { data: tData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);
      if (tData) setTransactions(tData as TransactionItem[]);

      // 3. Carregar Campanhas Atribuídas ao Usuário
      const { data: cAssignments } = await supabase
        .from("campaign_assignments")
        .select(`
          id,
          campaign_id,
          status,
          completed_at,
          campaigns:campaign_id (
            id,
            title,
            description,
            platform,
            target_url,
            instructions,
            reward_amount,
            status
          )
        `)
        .eq("user_id", user.id);

      if (cAssignments) {
        const mappedCampaigns: CampaignItem[] = (cAssignments as any[])
          .filter((a) => a.campaigns && a.campaigns.status === "ACTIVE")
          .map((a) => ({
            id: a.campaigns.id,
            title: a.campaigns.title,
            description: a.campaigns.description,
            platform: a.campaigns.platform,
            target_url: a.campaigns.target_url,
            instructions: a.campaigns.instructions,
            reward_amount: Number(a.campaigns.reward_amount),
            status: a.campaigns.status,
            assignment_id: a.id,
            assignment_status: a.status,
            completed_at: a.completed_at,
          }));
        setCampaigns(mappedCampaigns);
      }

      // 4. Carregar Perfil de Afiliado do Usuário (se houver)
      const { data: affData } = await supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (affData) setAffiliate(affData as AffiliateData);

      // 5. Se Admin, carregar painel gerencial completo
      if (isAdmin) {
        const { data: uData } = await supabase
          .from("profiles")
          .select(`
            id,
            name,
            email,
            phone,
            role,
            first_login,
            is_active,
            created_at,
            wallets (balance, reserved_balance)
          `)
          .order("created_at", { ascending: false });
        if (uData) setAdminUsers(uData as any);

        const { data: wDraws } = await supabase
          .from("withdrawals")
          .select(`
            id,
            user_id,
            amount,
            method,
            payment_details,
            status,
            requested_at,
            rejection_reason,
            profiles:user_id (name, email)
          `)
          .order("requested_at", { ascending: false });
        if (wDraws) setAdminWithdrawals(wDraws as any);

        const { data: allCamps } = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });
        if (allCamps) setAdminCampaigns(allCamps as any);
      }
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user, isAdmin]);

  // Executar Campanha
  const handleExecuteCampaign = async (campaign: CampaignItem) => {
    if (!campaign.id) return;
    setExecutingCampaignId(campaign.id);
    try {
      window.open(campaign.target_url, "_blank", "noopener,noreferrer");

      const { data, error } = await supabase.rpc("complete_campaign_execution", {
        p_campaign_id: campaign.id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const res = data as any;
      toast.success(`Parabéns! ${res?.reward_amount?.toLocaleString("pt-AO") || campaign.reward_amount} Kz foram creditados no seu saldo.`);
      await loadData();
    } catch (err) {
      toast.error("Erro ao registrar conclusão da campanha.");
    } finally {
      setExecutingCampaignId(null);
    }
  };

  // Processar Saque pelo Admin
  const handleProcessWithdrawal = async (withdrawalId: string, action: "APPROVE" | "PAID" | "REJECT") => {
    try {
      let rejectionReason: string | null = null;
      if (action === "REJECT") {
        rejectionReason = window.prompt("Informe o motivo da recusa (o valor será estornado ao usuário):");
        if (rejectionReason === null) return;
      }

      const { data, error } = await supabase.rpc("admin_process_withdrawal", {
        p_withdrawal_id: withdrawalId,
        p_action: action,
        p_rejection_reason: rejectionReason,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Saque processado com sucesso (${action})!`);
      await loadData();
    } catch (err) {
      toast.error("Erro ao processar saque.");
    }
  };

  // Criar Usuário pelo Admin
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newPassword || !newName) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    setSubmittingAction(true);
    try {
      const { data, error } = await supabase.rpc("admin_create_user", {
        p_email: newEmail.trim(),
        p_password: newPassword,
        p_name: newName.trim(),
        p_phone: newPhone.trim() || null,
        p_role: newRole,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Usuário ${newEmail} criado com sucesso!`);
      setIsCreateUserOpen(false);
      setNewEmail("");
      setNewPassword("");
      setNewName("");
      setNewPhone("");
      setNewRole("user");
      await loadData();
    } catch (err) {
      toast.error("Falha ao criar usuário.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Criar Campanha pelo Admin
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTargetUrl || !newReward) {
      toast.error("Preencha título, link de destino e recompensa.");
      return;
    }

    setSubmittingAction(true);
    try {
      const { error } = await supabase.from("campaigns").insert({
        title: newTitle.trim(),
        description: newDesc.trim(),
        platform: newPlatform,
        target_url: newTargetUrl.trim(),
        instructions: newInstructions.trim() || "Acesse o link e conclua a ação solicitada.",
        reward_amount: parseFloat(newReward),
        status: "ACTIVE",
        created_by: user?.id,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Campanha cadastrada com sucesso!");
      setIsCreateCampaignOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewTargetUrl("");
      setNewInstructions("");
      setNewReward("150");
      await loadData();
    } catch (err) {
      toast.error("Falha ao cadastrar campanha.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Atribuir Campanha a Usuários
  const handleAssignCampaign = async () => {
    if (!selectedCampaignForAssign || selectedUserIds.length === 0) {
      toast.error("Selecione a campanha e ao menos um usuário.");
      return;
    }

    setSubmittingAction(true);
    try {
      const { data, error } = await supabase.rpc("admin_assign_campaign", {
        p_campaign_id: selectedCampaignForAssign,
        p_user_ids: selectedUserIds,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Campanha atribuída com sucesso aos usuários selecionados!");
      setIsAssignCampaignOpen(false);
      setSelectedUserIds([]);
      setSelectedCampaignForAssign(null);
      await loadData();
    } catch (err) {
      toast.error("Erro ao atribuir campanha.");
    } finally {
      setSubmittingAction(false);
    }
  };

  // Alternar Status de Afiliado de um Usuário
  const handleToggleAffiliate = async (userId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.rpc("admin_toggle_affiliate", {
        p_user_id: userId,
        p_is_active: !currentStatus,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Afiliado ${!currentStatus ? "ativado" : "desativado"} com sucesso!`);
      await loadData();
    } catch (err) {
      toast.error("Erro ao alterar status de afiliado.");
    }
  };

  // Alterar Senha do Admin
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatePassword || updatePassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (updatePassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setSubmittingAction(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: updatePassword,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Senha alterada com sucesso!");
      setIsSettingsOpen(false);
      setUpdatePassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error("Erro ao alterar senha.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-12">
      {/* Modal de Primeiro Acesso Obrigatório */}
      {profile?.first_login && user && (
        <FirstAccessModal
          isOpen={profile.first_login}
          userEmail={user.email || ""}
          initialName={profile.name}
          onSuccess={async () => {
            await refreshProfile();
            await loadData();
          }}
        />
      )}

      {/* Modal de Saque */}
      {wallet && (
        <WithdrawalModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          availableBalance={wallet.balance}
          onSuccess={async () => {
            await loadData();
          }}
        />
      )}

      {/* Header Superior */}
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md px-4 lg:px-8 py-3 flex items-center justify-between shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center font-black text-white text-lg tracking-wider shadow-md shadow-emerald-950">
            ADX
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black tracking-tight text-white text-sm md:text-base">ADXmoney</span>
              {isAdmin && (
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 text-[10px] uppercase font-bold py-0">
                  ADMIN
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Plataforma Operacional de Tarefas</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg p-2 h-8 w-8"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{profile?.name || user?.email}</span>
            <span className="text-[10px] text-slate-400">{user?.email}</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 text-xs gap-1.5 rounded-lg px-2.5 h-8"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-6 space-y-6">
        {/* Banner de Boas-Vindas e Resumo Financeiro */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card Saldo Disponível */}
          <Card className="bg-gradient-to-br from-slate-900 to-slate-900/90 border-slate-800 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-10 -mt-10" />
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Saldo Disponível</span>
                <Wallet className="w-4 h-4 text-emerald-400" />
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-black text-emerald-400 tracking-tight">
                {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-sm font-semibold text-emerald-500/80">Kz</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <Button
                onClick={() => setIsWithdrawModalOpen(true)}
                disabled={(wallet?.balance || 0) <= 0}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 rounded-xl shadow-md shadow-emerald-950 gap-1.5"
              >
                <ArrowUpRight className="w-4 h-4" />
                Solicitar Saque
              </Button>
            </CardContent>
          </Card>

          {/* Card Saldo Reservado (Em Saque) */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Saldo em Processamento</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </CardDescription>
              <CardTitle className="text-2xl md:text-3xl font-black text-amber-400 tracking-tight">
                {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-sm font-semibold text-amber-500/80">Kz</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-[11px] text-slate-400 leading-snug">
                Valores reservados para saques em análise ou aguardando quitação.
              </p>
            </CardContent>
          </Card>

          {/* Card Programa de Afiliados */}
          <Card className="bg-slate-900 border-slate-800 shadow-xl relative overflow-hidden">
            <CardHeader className="pb-2">
              <CardDescription className="text-slate-400 text-xs font-medium flex items-center justify-between">
                <span>Painel de Afiliado</span>
                <Share2 className="w-4 h-4 text-sky-400" />
              </CardDescription>
              <CardTitle className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                {affiliate ? (
                  <>
                    <span className="font-mono text-sky-400">{affiliate.affiliate_code}</span>
                    <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[10px]">
                      Ativo
                    </Badge>
                  </>
                ) : (
                  <span className="text-xs text-slate-400 font-normal">Aguardando ativação pelo Admin</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {affiliate ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-400">
                    {affiliate.total_referrals} indicações ({affiliate.total_earned.toLocaleString("pt-AO")} Kz ganhos)
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(affiliate.affiliate_code, "Código de Afiliado")}
                    className="border-slate-800 bg-slate-950 text-slate-200 text-xs h-7 gap-1 px-2.5 hover:bg-slate-800"
                  >
                    <Copy className="w-3 h-3" />
                    Copiar
                  </Button>
                </div>
              ) : (
                <p className="text-[11px] text-slate-500">
                  Solicite ao administrador a ativação do seu código de parceiro para receber 500 Kz por indicado.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Abas Principais do Painel */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="bg-slate-900 border border-slate-800 p-1 rounded-xl">
            <TabsTrigger
              value="campaigns"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs font-medium px-4"
            >
              <Layers className="w-3.5 h-3.5 mr-1.5" />
              Minhas Campanhas ({campaigns.filter((c) => c.assignment_status !== "COMPLETED").length})
            </TabsTrigger>
            <TabsTrigger
              value="wallet"
              className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white rounded-lg text-xs font-medium px-4"
            >
              <History className="w-3.5 h-3.5 mr-1.5" />
              Extrato &amp; Transações
            </TabsTrigger>
            {isAdmin && (
              <TabsTrigger
                value="admin"
                className="data-[state=active]:bg-amber-600 data-[state=active]:text-white rounded-lg text-xs font-medium px-4 text-amber-400"
              >
                <Shield className="w-3.5 h-3.5 mr-1.5" />
                Painel Administrativo
              </TabsTrigger>
            )}
          </TabsList>

          {/* ABA: CAMPANHAS */}
          <TabsContent value="campaigns" className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Tarefas &amp; Campanhas Disponíveis</h2>
                <p className="text-xs text-slate-400">Execute as instruções e confirme a ação para receber a remuneração imediata.</p>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12 text-slate-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Carregando campanhas...
              </div>
            ) : campaigns.length === 0 ? (
              <Card className="bg-slate-900/50 border-dashed border-slate-800 text-center py-12">
                <CardContent className="space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800/80 mx-auto flex items-center justify-center text-slate-500">
                    <Layers className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-200">Nenhuma campanha atribuída no momento</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Novas campanhas serão atribuídas pelo administrador em breve. Fique atento às notificações da plataforma.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {campaigns.map((camp) => {
                  const isCompleted = camp.assignment_status === "COMPLETED";
                  return (
                    <Card
                      key={camp.id}
                      className={`bg-slate-900 border transition-all ${
                        isCompleted ? "border-slate-800/60 opacity-60" : "border-slate-800 hover:border-emerald-500/50 shadow-lg"
                      }`}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <Badge
                            className={`text-[10px] font-bold uppercase ${
                              camp.platform === "TikTok"
                                ? "bg-pink-500/10 text-pink-400 border-pink-500/30"
                                : camp.platform === "YouTube"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                : "bg-purple-500/10 text-purple-400 border-purple-500/30"
                            }`}
                          >
                            {camp.platform}
                          </Badge>
                          <span className="text-sm font-black text-emerald-400">
                            +{camp.reward_amount.toLocaleString("pt-AO")} Kz
                          </span>
                        </div>
                        <CardTitle className="text-base font-bold text-white tracking-tight mt-2">
                          {camp.title}
                        </CardTitle>
                        <CardDescription className="text-xs text-slate-400 line-clamp-2">
                          {camp.description || "Nenhuma descrição fornecida."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3 pt-0">
                        <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-300 space-y-1">
                          <span className="font-semibold text-slate-400 block text-[10px] uppercase tracking-wider">Instruções:</span>
                          <p className="leading-relaxed">{camp.instructions}</p>
                        </div>

                        {isCompleted ? (
                          <div className="flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-emerald-400 bg-emerald-950/30 border border-emerald-500/30 rounded-xl">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Concluída com Sucesso</span>
                          </div>
                        ) : (
                          <Button
                            onClick={() => handleExecuteCampaign(camp)}
                            disabled={executingCampaignId === camp.id}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-9 rounded-xl gap-2 shadow-md shadow-emerald-950"
                          >
                            {executingCampaignId === camp.id ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Validando Ação...
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Realizar Tarefa e Receber
                              </>
                            )}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* ABA: EXTRATO / HISTÓRICO */}
          <TabsContent value="wallet" className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Extrato Financeiro &amp; Ledger Imutável</h2>
              <p className="text-xs text-slate-400">Histórico completo de entradas de bônus, tarefas e reservas de saque.</p>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardContent className="p-0">
                {transactions.length === 0 ? (
                  <div className="text-center py-12 text-slate-500 text-xs">
                    Nenhuma movimentação financeira registrada na sua carteira.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {transactions.map((tx) => {
                      const isPositive = tx.amount > 0;
                      return (
                        <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                                isPositive
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {isPositive ? <TrendingUp className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-slate-200">{tx.description}</p>
                              <p className="text-[10px] text-slate-500">
                                {new Date(tx.created_at).toLocaleString("pt-AO")} • Tipo: {tx.type}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span
                              className={`text-sm font-bold font-mono ${
                                isPositive ? "text-emerald-400" : "text-amber-400"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {tx.amount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                            </span>
                            <Badge className="block text-[9px] bg-slate-950 text-slate-400 border-slate-800 mt-0.5">
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* ABA: PAINEL ADMINISTRATIVO (RESTRITO) */}
          {isAdmin && (
            <TabsContent value="admin" className="space-y-6">
              {/* Botões de Ação do Admin */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
                <div>
                  <h2 className="text-base font-bold text-white tracking-tight">Centro de Controle da Plataforma</h2>
                  <p className="text-xs text-slate-400">Crie usuários autenticados, publique campanhas e gerencie saques.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => setIsSettingsOpen(true)}
                    variant="outline"
                    className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-9 rounded-xl gap-1.5"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    Configurações Avançadas
                  </Button>
                  <Button
                    onClick={() => setIsCreateUserOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 rounded-xl gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Novo Usuário
                  </Button>
                  <Button
                    onClick={() => setIsCreateCampaignOpen(true)}
                    className="bg-sky-600 hover:bg-sky-500 text-white text-xs h-9 rounded-xl gap-1.5"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Nova Campanha
                  </Button>
                  <Button
                    onClick={() => setIsAssignCampaignOpen(true)}
                    variant="outline"
                    className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-9 rounded-xl gap-1.5"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Atribuir Campanhas
                  </Button>
                </div>
              </div>

              {/* Seção 1: Solicitações de Saque Pendentes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    Fila de Solicitações de Saque ({adminWithdrawals.filter((w) => w.status === "PENDING" || w.status === "APPROVED").length})
                  </h3>
                </div>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-0">
                    {adminWithdrawals.length === 0 ? (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        Nenhum pedido de saque registrado no sistema.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800">
                        {adminWithdrawals.map((w) => (
                          <div key={w.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">
                                  {w.profiles?.name || w.profiles?.email || "Usuário #" + w.user_id.substring(0, 8)}
                                </span>
                                <Badge
                                  className={`text-[10px] ${
                                    w.status === "PENDING"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                      : w.status === "APPROVED"
                                      ? "bg-sky-500/10 text-sky-400 border-sky-500/30"
                                      : w.status === "PAID"
                                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                      : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                  }`}
                                >
                                  {w.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-slate-400">
                                Método: <strong>{w.method}</strong> • Titular: <strong>{w.payment_details?.titular || "N/A"}</strong>
                                {w.payment_details?.telefone && ` • Tel: ${w.payment_details.telefone}`}
                                {w.payment_details?.iban && ` • IBAN: ${w.payment_details.iban}`}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Solicitado em: {new Date(w.requested_at).toLocaleString("pt-AO")}
                                {w.rejection_reason && ` • Motivo Recusa: ${w.rejection_reason}`}
                              </p>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-3">
                              <span className="text-base font-black text-amber-400 font-mono">
                                {w.amount.toLocaleString("pt-AO")} Kz
                              </span>

                              {w.status === "PENDING" && (
                                <div className="flex gap-1.5">
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessWithdrawal(w.id, "PAID")}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7 px-2.5 rounded-lg"
                                  >
                                    Pagar
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleProcessWithdrawal(w.id, "REJECT")}
                                    variant="outline"
                                    className="border-rose-800 text-rose-400 hover:bg-rose-950/40 text-[11px] h-7 px-2.5 rounded-lg"
                                  >
                                    Rejeitar
                                  </Button>
                                </div>
                              )}

                              {w.status === "APPROVED" && (
                                <Button
                                  size="sm"
                                  onClick={() => handleProcessWithdrawal(w.id, "PAID")}
                                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] h-7 px-2.5 rounded-lg"
                                >
                                  Marcar como Pago
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Seção 2: Usuários Cadastrados */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Gestão de Usuários Provisionados ({adminUsers.length})
                </h3>

                <Card className="bg-slate-900 border-slate-800">
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-800">
                      {adminUsers.map((u) => {
                        const userBalance = u.wallets?.[0]?.balance ?? 0;
                        return (
                          <div key={u.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-white">{u.name || "Sem Nome"}</span>
                                <Badge className="text-[10px] bg-slate-950 text-slate-300 border-slate-800">
                                  {u.role}
                                </Badge>
                                {u.first_login && (
                                  <Badge className="text-[9px] bg-amber-500/10 text-amber-400 border-amber-500/30">
                                    1º Acesso Pendente
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 mt-0.5">{u.email} {u.phone && `• ${u.phone}`}</p>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-4">
                              <div className="text-right">
                                <span className="text-xs text-slate-400 block text-[10px]">Saldo Atual</span>
                                <span className="text-sm font-bold text-emerald-400 font-mono">
                                  {Number(userBalance).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleToggleAffiliate(u.id, false)}
                                className="border-slate-800 text-sky-400 hover:bg-slate-800 text-[11px] h-7 px-2.5 rounded-lg"
                              >
                                Ativar / Gerar Afiliado
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Seção 3: Todas as Campanhas Criadas */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-400" />
                  Catálogo Global de Campanhas ({adminCampaigns.length})
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {adminCampaigns.map((c) => (
                    <Card key={c.id} className="bg-slate-900 border-slate-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className="text-[10px] bg-slate-950 text-slate-300 border-slate-800">
                            {c.platform}
                          </Badge>
                          <span className="text-xs font-bold text-emerald-400">
                            {Number(c.reward_amount).toLocaleString("pt-AO")} Kz
                          </span>
                        </div>
                        <CardTitle className="text-sm font-bold text-white mt-1">{c.title}</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-2">
                        <p className="text-xs text-slate-400 line-clamp-2">{c.description}</p>
                        <a
                          href={c.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-sky-400 flex items-center gap-1 hover:underline truncate"
                        >
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          {c.target_url}
                        </a>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </main>

      {/* MODAL: CONFIGURAÇÕES AVANÇADAS (ADMIN) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-2">
              <Settings className="w-6 h-6" />
            </div>
            <DialogTitle className="text-lg font-bold text-white">Configurações Avançadas</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Gerenciamento de segurança e preferências da conta administrativa.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdatePassword} className="space-y-4 mt-2">
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                <KeyRound className="w-3.5 h-3.5" />
                <span>Alterar Senha Administrativa</span>
              </div>
              
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Nova Senha</Label>
                <Input
                  type="password"
                  placeholder="Mínimo 6 caracteres"
                  value={updatePassword}
                  onChange={(e) => setUpdatePassword(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-slate-100 text-xs focus-visible:ring-amber-500"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs text-slate-300">Confirmar Nova Senha</Label>
                <Input
                  type="password"
                  placeholder="Repita a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-slate-100 text-xs focus-visible:ring-amber-500"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsSettingsOpen(false)}
                className="flex-1 border-slate-800 text-slate-400 text-xs h-10"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-medium h-10 shadow-lg shadow-amber-950"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Atualizar Senha"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR USUÁRIO (ADMIN) */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Criar Novo Usuário</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cadastre o login para o operador. O primeiro acesso exigirá a complementação dos dados.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Nome do Usuário *</Label>
              <Input
                placeholder="Ex: João Baptista"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">E-mail *</Label>
              <Input
                type="email"
                placeholder="operador@adxmoney.ao"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Senha Provisória *</Label>
              <Input
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Telefone (opcional)</Label>
              <Input
                placeholder="+244 9..."
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Papel / Nível</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                  <SelectValue placeholder="Selecione o papel" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                  <SelectItem value="user">Usuário Comum (Operador)</SelectItem>
                  <SelectItem value="admin">Administrador Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateUserOpen(false)}
                className="flex-1 border-slate-800 text-slate-400 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar Usuário"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR CAMPANHA (ADMIN) */}
      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Criar Nova Campanha</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cadastre tarefas para distribuição aos usuários da plataforma.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCampaign} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Título da Campanha *</Label>
              <Input
                placeholder="Ex: Seguir perfil no TikTok"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Plataforma</Label>
              <Select value={newPlatform} onValueChange={setNewPlatform}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Link de Destino / Alvo *</Label>
              <Input
                placeholder="https://tiktok.com/@perfil"
                value={newTargetUrl}
                onChange={(e) => setNewTargetUrl(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Recompensa por Conclusão (Kz) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="Ex: 150"
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Descrição Curta</Label>
              <Input
                placeholder="Breve resumo da tarefa"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Instruções de Execução</Label>
              <Textarea
                placeholder="Explique o que o usuário deve fazer..."
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs min-h-[80px]"
                required
              />
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateCampaignOpen(false)}
                className="flex-1 border-slate-800 text-slate-400 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={submittingAction}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar Campanha"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: ATRIBUIR CAMPANHA A USUÁRIOS (ADMIN) */}
      <Dialog open={isAssignCampaignOpen} onOpenChange={setIsAssignCampaignOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">Atribuir Campanha a Usuários</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Selecione a campanha ativa e os usuários que terão acesso à execução.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Selecione a Campanha</Label>
              <Select value={selectedCampaignForAssign || ""} onValueChange={setSelectedCampaignForAssign}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                  <SelectValue placeholder="Escolha a campanha" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-b from-slate-900 to-slate-950 border-slate-800 text-slate-100 text-xs">
                  {adminCampaigns.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} ({c.platform} - {Number(c.reward_amount).toLocaleString("pt-AO")} Kz)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">Selecione os Usuários</Label>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(adminUsers.map((u) => u.id))}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  Selecionar Todos
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-slate-950 rounded-xl border border-slate-800">
                {adminUsers.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <label
                      key={u.id}
                      className="flex items-center gap-2.5 p-1.5 rounded-lg hover:bg-slate-800/50 cursor-pointer text-xs"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedUserIds([...selectedUserIds, u.id]);
                          } else {
                            setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                          }
                        }}
                        className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500 bg-slate-900"
                      />
                      <span className="text-slate-200 font-medium">{u.name || u.email}</span>
                      <span className="text-slate-500 text-[10px] ml-auto">({u.role})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAssignCampaignOpen(false)}
                className="flex-1 border-slate-800 text-slate-400 text-xs"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleAssignCampaign}
                disabled={submittingAction || !selectedCampaignForAssign || selectedUserIds.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {submittingAction ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar Atribuição"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;
