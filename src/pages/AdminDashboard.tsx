import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Users,
  Layers,
  Share2,
  ArrowUpRight,
  History,
  Settings,
  LogOut,
  PlusCircle,
  UserPlus,
  RefreshCw,
  Loader2,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  KeyRound,
  Check,
  Copy,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AdminDashboardPage: React.FC = () => {
  const { profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "users" | "campaigns" | "participations" | "affiliates" | "withdrawals" | "history" | "settings"
  >("dashboard");

  // Dados reais
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    activeCampaigns: 0,
    pausedCampaigns: 0,
    completedCampaigns: 0,
    pendingParticipations: 0,
    completedParticipations: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalAmount: 0,
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [affiliatesList, setAffiliatesList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Modais de Criação
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isAssignCampaignOpen, setIsAssignCampaignOpen] = useState(false);
  const [isUserCreatedSuccessOpen, setIsUserCreatedSuccessOpen] = useState(false);
  const [createdUserData, setCreatedUserData] = useState<{
    name: string;
    email: string;
    password: string;
    phone: string;
    primaryLink?: string;
    tiktok?: string;
    instagram?: string;
    youtube?: string;
    country?: string;
  } | null>(null);

  // Forms
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPrimaryLink, setNewPrimaryLink] = useState("");
  const [newTiktok, setNewTiktok] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newYoutube, setNewYoutube] = useState("");
  const [newCountry, setNewCountry] = useState("Angola");
  const [newRole, setNewRole] = useState("user");

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPlatform, setNewPlatform] = useState("TikTok");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newReward, setNewReward] = useState("150");

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Modal Afiliado
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const [selectedAffiliateUser, setSelectedAffiliateUser] = useState<any | null>(null);
  const [customAffiliateCode, setCustomAffiliateCode] = useState("");

  const [updatePassword, setUpdatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      // 1. Usuários
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*, wallets(balance, reserved_balance)")
        .order("created_at", { ascending: false });
      const users = usersData || [];
      setUsersList(users);

      // 2. Campanhas
      const { data: campsData } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      const campaigns = campsData || [];
      setCampaignsList(campaigns);

      // 3. Participações
      const { data: assignsData } = await supabase
        .from("campaign_assignments")
        .select("*, campaigns(title, platform, reward_amount), profiles:user_id(name, email)")
        .order("created_at", { ascending: false });
      const assignments = assignsData || [];
      setAssignmentsList(assignments);

      // 4. Saques
      const { data: withData } = await supabase
        .from("withdrawals")
        .select("*, profiles:user_id(name, email)")
        .order("requested_at", { ascending: false });
      const withdrawals = withData || [];
      setWithdrawalsList(withdrawals);

      // 5. Afiliados
      const { data: affData } = await supabase
        .from("affiliate_profiles")
        .select("*, profiles:user_id(name, email)")
        .order("created_at", { ascending: false });
      setAffiliatesList(affData || []);

      // 6. Histórico / Logs
      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setActivityLogs(logsData || []);

      // Calcular Indicadores
      const totalU = users.length;
      const activeU = users.filter((u) => u.is_active !== false).length;
      const inactiveU = totalU - activeU;

      const activeC = campaigns.filter((c) => c.status === "ACTIVE").length;
      const pausedC = campaigns.filter((c) => c.status === "PAUSED").length;
      const completedC = campaigns.filter((c) => c.status === "COMPLETED").length;

      const pendingP = assignments.filter((a) => a.status === "ASSIGNED" || a.status === "IN_PROGRESS").length;
      const completedP = assignments.filter((a) => a.status === "COMPLETED").length;

      const pendingW = withdrawals.filter((w) => w.status === "PENDING");
      const pendingWCount = pendingW.length;
      const pendingWAmount = pendingW.reduce((sum, w) => sum + Number(w.amount || 0), 0);

      setStats({
        totalUsers: totalU,
        activeUsers: activeU,
        inactiveUsers: inactiveU,
        activeCampaigns: activeC,
        pausedCampaigns: pausedC,
        completedCampaigns: completedC,
        pendingParticipations: pendingP,
        completedParticipations: completedP,
        pendingWithdrawals: pendingWCount,
        pendingWithdrawalAmount: pendingWAmount,
      });
    } catch (err) {
      console.error("[AdminDashboard] Erro ao carregar dados:", err);
      toast.error("Erro ao carregar dados do painel administrativo.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // Criar Usuário (RPC Segura - Com senha pré-definida vinculada ao e-mail)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail || !newName || !newPhone || !newPrimaryLink) {
      toast.error("Preencha os campos obrigatórios: Nome, E-mail, Telefone e Link Principal.");
      return;
    }

    // Gerar senha pré-definida vinculada ao e-mail do usuário (ex: User@4921!)
    const cleanEmailPrefix = (newEmail.split("@")[0] || "Adx").replace(/[^a-zA-Z0-9]/g, "");
    const prefixFormatted = cleanEmailPrefix.charAt(0).toUpperCase() + cleanEmailPrefix.slice(1, 5);
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    const predefinedPassword = `${prefixFormatted}@${randomDigits}!`;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.rpc("admin_create_user", {
        p_email: newEmail.trim(),
        p_password: predefinedPassword,
        p_name: newName.trim(),
        p_phone: newPhone.trim() || null,
        p_role: newRole,
        p_primary_link: newPrimaryLink.trim() || null,
        p_tiktok: newTiktok.trim() || null,
        p_instagram: newInstagram.trim() || null,
        p_youtube: newYoutube.trim() || null,
        p_country: newCountry.trim() || "Angola",
      });

      if (error) throw error;

      // Armazenar dados para o modal de comprovativo de criação
      setCreatedUserData({
        name: newName.trim(),
        email: newEmail.trim(),
        password: predefinedPassword,
        phone: newPhone.trim(),
        primaryLink: newPrimaryLink.trim(),
        tiktok: newTiktok.trim(),
        instagram: newInstagram.trim(),
        youtube: newYoutube.trim(),
        country: newCountry.trim() || "Angola",
      });

      toast.success("Usuário criado com sucesso com senha pré-definida!");
      setIsCreateUserOpen(false);
      setIsUserCreatedSuccessOpen(true);

      // Limpar formulário
      setNewEmail("");
      setNewName("");
      setNewPhone("");
      setNewPrimaryLink("");
      setNewTiktok("");
      setNewInstagram("");
      setNewYoutube("");
      setNewCountry("Angola");
      setNewRole("user");

      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Falha ao criar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  // Enviar Dados de Adesão via WhatsApp
  const handleSendAdesaoWhatsApp = () => {
    if (!createdUserData) return;

    let cleanPhone = (createdUserData.phone || "").replace(/\D/g, "");
    if (!cleanPhone) {
      toast.error("O número de telefone/WhatsApp é inválido.");
      return;
    }

    // Se tiver 9 dígitos e começar com 9 (Angola), adiciona DDI 244
    if (cleanPhone.length === 9 && cleanPhone.startsWith("9")) {
      cleanPhone = "244" + cleanPhone;
    }

    const loginUrl = `${window.location.origin}/login`;

    let msg = `🎉 *DADOS DE ADESÃO - ADX MONEY* 🎉\n\n`;
    msg += `Olá *${createdUserData.name}*, sua conta de operador foi criada e ativada com sucesso!\n\n`;
    msg += `📋 *INFORMAÇÕES DE CADASTRO E ACESSO:*\n`;
    msg += `👤 *Nome:* ${createdUserData.name}\n`;
    msg += `📧 *E-mail:* ${createdUserData.email}\n`;
    msg += `🔑 *Senha Pré-definida:* \`${createdUserData.password}\`\n`;
    msg += `📱 *Telefone/WhatsApp:* ${createdUserData.phone}\n`;
    msg += `🌍 *País:* ${createdUserData.country || "Angola"}\n`;
    msg += `🔗 *Link Principal:* ${createdUserData.primaryLink || "Não informado"}\n`;

    if (createdUserData.tiktok) {
      msg += `🎵 *TikTok:* ${createdUserData.tiktok}\n`;
    }
    if (createdUserData.instagram) {
      msg += `📸 *Instagram:* ${createdUserData.instagram}\n`;
    }
    if (createdUserData.youtube) {
      msg += `▶️ *YouTube:* ${createdUserData.youtube}\n`;
    }

    msg += `\n🌐 *Acesse o painel por aqui:* ${loginUrl}\n\n`;
    msg += `💡 *Instrução:* Ao acessar pela primeira vez, você pode atualizar sua senha nas configurações do seu perfil para maior segurança.\n\n`;
    msg += `Seja bem-vindo(a) à nossa equipa! 🚀`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${cleanPhone}?text=${encoded}`, "_blank");
  };

  // Criar Campanha
  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newTargetUrl || !newReward) {
      toast.error("Preencha o título, link e recompensa da campanha.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaigns").insert({
        title: newTitle.trim(),
        description: newDesc.trim(),
        platform: newPlatform,
        target_url: newTargetUrl.trim(),
        instructions: newInstructions.trim() || "Acesse o link e conclua a tarefa.",
        reward_amount: parseFloat(newReward),
        status: "ACTIVE",
      });

      if (error) throw error;

      toast.success("Campanha criada com sucesso.");
      setIsCreateCampaignOpen(false);
      setNewTitle("");
      setNewDesc("");
      setNewTargetUrl("");
      setNewInstructions("");
      setNewReward("150");
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar campanha.");
    } finally {
      setSubmitting(false);
    }
  };

  // Atribuir Campanha
  const handleAssignCampaign = async () => {
    if (!selectedCampaignId || selectedUserIds.length === 0) {
      toast.error("Selecione a campanha e ao menos um usuário.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("admin_assign_campaign", {
        p_campaign_id: selectedCampaignId,
        p_user_ids: selectedUserIds,
      });
      if (error) throw error;

      toast.success("Campanha atribuída com sucesso aos participantes.");
      setIsAssignCampaignOpen(false);
      setSelectedUserIds([]);
      setSelectedCampaignId(null);
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Falha ao atribuir campanha.");
    } finally {
      setSubmitting(false);
    }
  };

  // Processar Saque
  const handleProcessWithdrawal = async (id: string, action: "APPROVE" | "PAID" | "REJECT") => {
    let rejectionReason: string | null = null;
    if (action === "REJECT") {
      rejectionReason = window.prompt("Informe o motivo da rejeição do saque:");
      if (rejectionReason === null) return;
    }
    try {
      const { error } = await supabase.rpc("admin_process_withdrawal", {
        p_withdrawal_id: id,
        p_action: action,
        p_rejection_reason: rejectionReason,
      });
      if (error) throw error;

      toast.success(`Saque processado com sucesso (${action}).`);
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar saque.");
    }
  };

  // Gerenciar Afiliado
  const handleToggleAffiliate = async (userId: string, isActive: boolean, customCode?: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("admin_toggle_affiliate", {
        p_user_id: userId,
        p_is_active: isActive,
        p_custom_code: customCode || null,
      });

      if (error) throw error;

      toast.success(`Status de afiliado alterado para ${isActive ? "ATIVO" : "INATIVO"}.`);
      setIsAffiliateModalOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao gerenciar afiliado.");
    } finally {
      setSubmitting(false);
    }
  };

  // Atualizar Senha Admin
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (updatePassword.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (updatePassword !== confirmPassword) {
      toast.error("As senhas não conferem.");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: updatePassword });
      if (error) throw error;
      toast.success("Senha administrativa atualizada com sucesso.");
      setUpdatePassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar senha.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Topo do Painel */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain rounded-lg bg-slate-800/50 p-1" />
          <span className="font-mono font-bold text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded uppercase tracking-wider">
            Admin
          </span>
          <span className="text-sm font-semibold text-white tracking-tight">ADXmoney Control</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadAdminData}
            disabled={loading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2.5 text-xs gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </Button>

          <span className="text-xs text-slate-400 hidden md:inline">{profile?.email}</span>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 h-8 px-2.5 text-xs gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Barra Lateral de Navegação Real */}
        <aside className="w-full md:w-60 border-r border-slate-800 bg-slate-900/50 p-3 space-y-1 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection("dashboard")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "dashboard"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveSection("users")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "users"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuários ({stats.totalUsers})</span>
            </button>

            <button
              onClick={() => setActiveSection("campaigns")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "campaigns"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Campanhas ({campaignsList.length})</span>
            </button>

            <button
              onClick={() => setActiveSection("participations")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "participations"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Participações ({assignmentsList.length})</span>
            </button>

            <button
              onClick={() => setActiveSection("affiliates")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "affiliates"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>Afiliados ({affiliatesList.length})</span>
            </button>

            <button
              onClick={() => setActiveSection("withdrawals")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "withdrawals"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Saques ({stats.pendingWithdrawals})</span>
            </button>

            <button
              onClick={() => setActiveSection("history")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "history"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Histórico Operacional</span>
            </button>

            <button
              onClick={() => setActiveSection("settings")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "settings"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </nav>
        </aside>

        {/* Área de Trabalho do Admin */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* SEÇÃO: DASHBOARD */}
          {activeSection === "dashboard" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Centro de Controle Operacional</h2>
                <p className="text-xs text-slate-400">Indicadores reais extraídos da base de dados do sistema.</p>
              </div>

              {/* Grid de Indicadores Reais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400">Usuários Ativos / Total</CardDescription>
                    <CardTitle className="text-2xl font-bold text-white font-mono">
                      {stats.activeUsers} <span className="text-sm font-normal text-slate-500">/ {stats.totalUsers}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-slate-500">
                    {stats.inactiveUsers} inativo(s)
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400">Campanhas Ativas</CardDescription>
                    <CardTitle className="text-2xl font-bold text-emerald-400 font-mono">
                      {stats.activeCampaigns}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-slate-500">
                    {stats.completedCampaigns} concluída(s)
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400">Participações Pendentes</CardDescription>
                    <CardTitle className="text-2xl font-bold text-sky-400 font-mono">
                      {stats.pendingParticipations}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-slate-500">
                    {stats.completedParticipations} concluída(s) no total
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400">Saques Pendentes</CardDescription>
                    <CardTitle className="text-2xl font-bold text-amber-400 font-mono">
                      {stats.pendingWithdrawals}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-slate-400 font-mono">
                    {stats.pendingWithdrawalAmount.toLocaleString("pt-AO")} Kz aguardando
                  </CardContent>
                </Card>
              </div>

              {/* Ações Rápidas */}
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 rounded-xl gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Cadastrar Usuário
                </Button>
                <Button
                  onClick={() => setIsCreateCampaignOpen(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs h-9 rounded-xl gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Cadastrar Campanha
                </Button>
                <Button
                  onClick={() => setIsAssignCampaignOpen(true)}
                  variant="outline"
                  className="border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700 text-xs h-9 rounded-xl gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Distribuir Tarefas
                </Button>
              </div>
            </div>
          )}

          {/* SEÇÃO: USUÁRIOS */}
          {activeSection === "users" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Usuários Autorizados</h2>
                  <p className="text-xs text-slate-400">Contas provisionadas para operação do sistema.</p>
                </div>
                <Button
                  onClick={() => setIsCreateUserOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg gap-1.5"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Novo Usuário
                </Button>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                  {usersList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">Nenhum usuário cadastrado.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {usersList.map((u) => {
                        const bal = u.wallets?.[0]?.balance ?? 0;
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

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <span className="text-[10px] text-slate-500 block">Saldo</span>
                                <span className="text-xs font-bold font-mono text-emerald-400">
                                  {Number(bal).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                                </span>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedAffiliateUser(u);
                                  const existingAff = affiliatesList.find((a) => a.user_id === u.id);
                                  setCustomAffiliateCode(existingAff?.affiliate_code || "");
                                  setIsAffiliateModalOpen(true);
                                }}
                                className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                              >
                                <Share2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SEÇÃO: AFILIADOS */}
          {activeSection === "affiliates" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Rede de Afiliados</h2>
                <p className="text-xs text-slate-400">Gerenciamento de convites e bônus.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                  {affiliatesList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">Nenhum afiliado registrado.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {affiliatesList.map((a) => (
                        <div key={a.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">{a.profiles?.name || a.profiles?.email}</span>
                              <Badge className={`text-[10px] ${a.is_active ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-800 text-slate-400"}`}>
                                {a.affiliate_code}
                              </Badge>
                              {!a.is_active && <Badge className="text-[9px] bg-rose-500/10 text-rose-400">INATIVO</Badge>}
                            </div>
                            <p className="text-[11px] text-slate-400 mt-0.5">
                              {a.total_referrals} indicações • Total ganho: {Number(a.total_earned).toLocaleString("pt-AO")} Kz
                            </p>
                          </div>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedAffiliateUser({ id: a.user_id, name: a.profiles?.name });
                              setCustomAffiliateCode(a.affiliate_code);
                              setIsAffiliateModalOpen(true);
                            }}
                            className="border-slate-800 text-slate-400 hover:text-white text-[11px] h-7"
                          >
                            Editar Status
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SEÇÃO: CAMPANHAS */}
          {activeSection === "campaigns" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white">Catálogo de Campanhas</h2>
                  <p className="text-xs text-slate-400">Trabalhos criados para atribuição.</p>
                </div>
                <Button
                  onClick={() => setIsCreateCampaignOpen(true)}
                  className="bg-sky-600 hover:bg-sky-500 text-white text-xs h-8 rounded-lg gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Nova Campanha
                </Button>
              </div>

              {campaignsList.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-500">
                  Nenhuma campanha cadastrada no momento.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {campaignsList.map((c) => (
                    <Card key={c.id} className="bg-slate-900 border-slate-800">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <Badge className="text-[10px] bg-slate-950 text-slate-300 border-slate-800">
                            {c.platform}
                          </Badge>
                          <span className="text-xs font-bold text-emerald-400">
                            +{Number(c.reward_amount).toLocaleString("pt-AO")} Kz
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
              )}
            </div>
          )}

          {/* SEÇÃO: PARTICIPAÇÕES */}
          {activeSection === "participations" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Relação de Participações</h2>
                <p className="text-xs text-slate-400">Status de execução das campanhas pelos usuários.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                  {assignmentsList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">Nenhuma participação registrada.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {assignmentsList.map((a) => (
                        <div key={a.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30">
                          <div>
                            <span className="font-semibold text-white">{a.campaigns?.title || "Campanha"}</span>
                            <p className="text-[11px] text-slate-400">
                              Usuário: {a.profiles?.name || a.profiles?.email || a.user_id}
                            </p>
                          </div>
                          <Badge
                            className={`text-[10px] ${
                              a.status === "COMPLETED"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                            }`}
                          >
                            {a.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SEÇÃO: SAQUES */}
          {activeSection === "withdrawals" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Solicitações de Saque</h2>
                <p className="text-xs text-slate-400">Validação e processamento financeiro.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                  {withdrawalsList.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">Nenhuma solicitação de saque.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {withdrawalsList.map((w) => (
                        <div key={w.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/30">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white">
                                {w.profiles?.name || w.profiles?.email || w.user_id}
                              </span>
                              <Badge
                                className={`text-[10px] ${
                                  w.status === "PENDING"
                                    ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                    : w.status === "PAID"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                                }`}
                              >
                                {w.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              Método: <strong>{w.method}</strong> • Titular: <strong>{w.payment_details?.titular || "N/A"}</strong>
                              {w.payment_details?.telefone && ` • Tel: ${w.payment_details.telefone}`}
                              {w.payment_details?.iban && ` • IBAN: ${w.payment_details.iban}`}
                            </p>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold font-mono text-amber-400">
                              {Number(w.amount).toLocaleString("pt-AO")} Kz
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
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SEÇÃO: HISTÓRICO */}
          {activeSection === "history" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Histórico e Auditoria</h2>
                <p className="text-xs text-slate-400">Registro imutável de eventos operacionais.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                  {activityLogs.length === 0 ? (
                    <div className="text-center py-10 text-xs text-slate-500">Nenhum evento registrado.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {activityLogs.map((log) => (
                        <div key={log.id} className="p-3.5 text-xs hover:bg-slate-800/30 space-y-0.5">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-slate-200">{log.title}</span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              {new Date(log.created_at).toLocaleString("pt-AO")}
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{log.details}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* SEÇÃO: CONFIGURAÇÕES */}
          {activeSection === "settings" && (
            <div className="space-y-4 max-w-md">
              <div>
                <h2 className="text-base font-bold text-white">Configurações Administrativas</h2>
                <p className="text-xs text-slate-400">Segurança da conta de administrador.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-emerald-400" />
                    Alterar Senha de Acesso
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdatePassword} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Nova Senha</Label>
                      <Input
                        type="password"
                        placeholder="Mínimo 6 caracteres"
                        value={updatePassword}
                        onChange={(e) => setUpdatePassword(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Confirmar Senha</Label>
                      <Input
                        type="password"
                        placeholder="Repita a nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={submitting}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium mt-2"
                    >
                      {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar Nova Senha"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* MODAIS DO ADMIN */}
      {/* Modal Criar Usuário */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Criar Novo Usuário</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Crie as credenciais de acesso para um operador da plataforma com senha gerada automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateUser} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Nome Completo *</Label>
              <Input
                placeholder="Ex: João Silva"
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
                placeholder="Ex: joao@gmail.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Telefone / WhatsApp *</Label>
              <Input
                placeholder="Ex: 923456789 ou +244..."
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Link Principal *</Label>
              <Input
                type="url"
                placeholder="Ex: https://perfilprincipal.com"
                value={newPrimaryLink}
                onChange={(e) => setNewPrimaryLink(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">TikTok (opcional)</Label>
                <Input
                  placeholder="@usuario"
                  value={newTiktok}
                  onChange={(e) => setNewTiktok(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">Instagram (opcional)</Label>
                <Input
                  placeholder="@usuario"
                  value={newInstagram}
                  onChange={(e) => setNewInstagram(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">YouTube (opcional)</Label>
                <Input
                  placeholder="Canal ou @usuario"
                  value={newYoutube}
                  onChange={(e) => setNewYoutube(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-300">País *</Label>
                <Input
                  placeholder="Ex: Angola"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  required
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Nível / Role</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                  <SelectItem value="user">Usuário Operador (USER)</SelectItem>
                  <SelectItem value="admin">Administrador (ADMIN)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="pt-2 flex gap-2">
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
                disabled={submitting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Criar Usuário"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Criar Campanha */}
      <Dialog open={isCreateCampaignOpen} onOpenChange={setIsCreateCampaignOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Criar Nova Campanha</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Cadastre tarefas para distribuição operacional.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCampaign} className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Título *</Label>
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
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                  <SelectItem value="TikTok">TikTok</SelectItem>
                  <SelectItem value="Instagram">Instagram</SelectItem>
                  <SelectItem value="YouTube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Link Alvo *</Label>
              <Input
                placeholder="https://tiktok.com/@..."
                value={newTargetUrl}
                onChange={(e) => setNewTargetUrl(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Recompensa (Kz) *</Label>
              <Input
                type="number"
                min="1"
                placeholder="150"
                value={newReward}
                onChange={(e) => setNewReward(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                required
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Descrição</Label>
              <Input
                placeholder="Resumo da tarefa"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Instruções</Label>
              <Textarea
                placeholder="O que o usuário deve fazer..."
                value={newInstructions}
                onChange={(e) => setNewInstructions(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs min-h-[70px]"
              />
            </div>
            <div className="pt-2 flex gap-2">
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
                disabled={submitting}
                className="flex-1 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar Campanha"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Distribuir Campanha */}
      <Dialog open={isAssignCampaignOpen} onOpenChange={setIsAssignCampaignOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Distribuir Campanha</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Selecione a tarefa e os operadores participantes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Campanha</Label>
              <Select value={selectedCampaignId || ""} onValueChange={setSelectedCampaignId}>
                <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs">
                  <SelectValue placeholder="Selecione a campanha" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                  {campaignsList.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title} ({c.platform} - {Number(c.reward_amount).toLocaleString("pt-AO")} Kz)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-300">Usuários</Label>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(usersList.map((u) => u.id))}
                  className="text-[11px] text-sky-400 hover:underline"
                >
                  Selecionar Todos
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-1 p-2 bg-slate-950 rounded-xl border border-slate-800">
                {usersList.map((u) => {
                  const isChecked = selectedUserIds.includes(u.id);
                  return (
                    <label key={u.id} className="flex items-center gap-2 p-1 text-xs hover:bg-slate-800/40 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedUserIds([...selectedUserIds, u.id]);
                          else setSelectedUserIds(selectedUserIds.filter((id) => id !== u.id));
                        }}
                        className="rounded border-slate-700 bg-slate-900 text-emerald-600"
                      />
                      <span className="text-slate-200">{u.name || u.email}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 flex gap-2">
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
                disabled={submitting || !selectedCampaignId || selectedUserIds.length === 0}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar Distribuição"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

            {/* Modal Gerenciar Afiliado */}
      <Dialog open={isAffiliateModalOpen} onOpenChange={setIsAffiliateModalOpen}>
        <DialogContent className="max-w-sm bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white">Status de Afiliado</DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Gerencie a capacidade deste usuário de indicar novos membros.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
              <p className="text-[11px] text-slate-500">Usuário:</p>
              <p className="text-xs font-bold text-white">{selectedAffiliateUser?.name || selectedAffiliateUser?.email}</p>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-slate-300">Código de Afiliado (opcional)</Label>
              <Input
                placeholder="Ex: CONVITE10"
                value={customAffiliateCode}
                onChange={(e) => setCustomAffiliateCode(e.target.value.toUpperCase())}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
              />
              <p className="text-[10px] text-slate-500">Deixe em branco para gerar automaticamente.</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={() => handleToggleAffiliate(selectedAffiliateUser.id, true, customAffiliateCode)}
                disabled={submitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ativar"}
              </Button>
              <Button
                onClick={() => handleToggleAffiliate(selectedAffiliateUser.id, false)}
                disabled={submitting}
                variant="outline"
                className="border-slate-800 text-rose-400 hover:bg-rose-950/20 text-xs h-9"
              >
                {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Desativar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Comprovativo de Criação do Usuário & Envio de Dados via WhatsApp */}
      <Dialog open={isUserCreatedSuccessOpen} onOpenChange={setIsUserCreatedSuccessOpen}>
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-1 text-emerald-400 mx-auto">
              <Check className="w-5 h-5" />
            </div>
            <DialogTitle className="text-center text-base font-bold text-white">Usuário Criado com Sucesso!</DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400">
              A senha pré-definida foi gerada e vinculada ao e-mail cadastrado.
            </DialogDescription>
          </DialogHeader>

          {createdUserData && (
            <div className="space-y-3 mt-2">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Nome:</span>
                  <span className="font-medium text-white">{createdUserData.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">E-mail:</span>
                  <span className="font-medium text-emerald-400">{createdUserData.email}</span>
                </div>
                <div className="flex justify-between items-center bg-emerald-950/30 p-2 rounded-lg border border-emerald-800/30">
                  <span className="text-emerald-300 font-medium">Senha Pré-definida:</span>
                  <div className="flex items-center gap-2">
                    <code className="bg-slate-900 px-2 py-0.5 rounded text-emerald-400 font-mono text-xs font-bold">
                      {createdUserData.password}
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 text-slate-300 hover:text-white hover:bg-slate-800"
                      onClick={() => {
                        navigator.clipboard.writeText(createdUserData.password);
                        toast.success("Senha copiada para a área de transferência!");
                      }}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">WhatsApp:</span>
                  <span className="font-medium text-white">{createdUserData.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">País:</span>
                  <span className="font-medium text-white">{createdUserData.country || "Angola"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Link Principal:</span>
                  <span className="font-medium text-sky-400 truncate max-w-[200px]" title={createdUserData.primaryLink}>
                    {createdUserData.primaryLink || "N/A"}
                  </span>
                </div>
                {createdUserData.tiktok && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">TikTok:</span>
                    <span className="font-medium text-white">{createdUserData.tiktok}</span>
                  </div>
                )}
                {createdUserData.instagram && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Instagram:</span>
                    <span className="font-medium text-white">{createdUserData.instagram}</span>
                  </div>
                )}
                {createdUserData.youtube && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">YouTube:</span>
                    <span className="font-medium text-white">{createdUserData.youtube}</span>
                  </div>
                )}
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Button
                  onClick={handleSendAdesaoWhatsApp}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-10 flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20"
                >
                  <MessageSquare className="w-4 h-4" />
                  Enviar Dados de Adesão (WhatsApp)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsUserCreatedSuccessOpen(false)}
                  className="w-full border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-9"
                >
                  Fechar Comprovativo
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
