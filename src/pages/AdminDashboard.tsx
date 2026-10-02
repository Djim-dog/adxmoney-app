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
  RefreshCw,
  Loader2,
  CheckCircle2,
  Megaphone,
  Trash2,
  Check,
  Copy,
  UserPlus,
  PlayCircle,
  Clock,
  Eye,
  Send,
  PlusCircle,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const AdminDashboardPage: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<
    "dashboard" | "users" | "campaigns" | "campaignRequests" | "participations" | "affiliates" | "withdrawals" | "history" | "settings"
  >("dashboard");

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
    pendingCampaignRequests: 0,
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);
  const [campaignRequestsList, setCampaignRequestsList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [assignmentsList, setAssignmentsList] = useState<any[]>([]);
  const [affiliatesList, setAffiliatesList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Modais & Edições
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedEditUser, setSelectedEditUser] = useState<any | null>(null);

  // Edit User States
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPrimaryLink, setEditPrimaryLink] = useState("");
  const [editTiktok, setEditTiktok] = useState("");
  const [editInstagram, setEditInstagram] = useState("");
  const [editYoutube, setEditYoutube] = useState("");
  const [editRole, setEditRole] = useState("user");
  const [editIsActive, setEditIsActive] = useState(true);

  const [isCreateCampaignOpen, setIsCreateCampaignOpen] = useState(false);
  const [isAssignCampaignOpen, setIsAssignCampaignOpen] = useState(false);
  const [isUserCreatedSuccessOpen, setIsUserCreatedSuccessOpen] = useState(false);
  const [createdUserData, setCreatedUserData] = useState<any>(null);

  // New User Form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPrimaryLink, setNewPrimaryLink] = useState("");
  const [newTiktok, setNewTiktok] = useState("");
  const [newInstagram, setNewInstagram] = useState("");
  const [newYoutube, setNewYoutube] = useState("");
  const [newRole, setNewRole] = useState("user");

  // New Campaign Form
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"affiliate" | "collective">("affiliate");
  const [newPlatform, setNewPlatform] = useState("TikTok");
  const [newTargetUrl, setNewTargetUrl] = useState("");
  const [newTargetAccount, setNewTargetAccount] = useState("");
  const [newRequesterPhone, setNewRequesterPhone] = useState("");
  const [newInstructions, setNewInstructions] = useState("");
  const [newReward, setNewReward] = useState("150");
  const [newMaxParticipants, setNewMaxParticipants] = useState("100");
  const [newObjective, setNewObjective] = useState("");
  const [newStatus, setNewStatus] = useState("draft");

  // Operational Lists
  const [isOperationalListOpen, setIsOperationalListOpen] = useState(false);
  const [selectedOperationalCampaign, setSelectedOperationalCampaign] = useState<any | null>(null);
  const [operationalParticipants, setOperationalParticipants] = useState<any[]>([]);

  // Request Details Modal
  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Affiliate Modal
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const [selectedAffiliateUser, setSelectedAffiliateUser] = useState<any | null>(null);
  const [customAffiliateCode, setCustomAffiliateCode] = useState("");

  const [submitting, setSubmitting] = useState(false);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const { data: usersData } = await supabase
        .from("profiles")
        .select("*, wallets(balance, reserved_balance)")
        .order("created_at", { ascending: false });
      const users = usersData || [];
      setUsersList(users);

      const { data: campsData } = await supabase
        .from("campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      const campaigns = campsData || [];
      setCampaignsList(campaigns);

      const { data: assignsData } = await supabase
        .from("campaign_assignments")
        .select("*, campaigns(title, platform, reward_amount), profiles:user_id(name, email)")
        .order("created_at", { ascending: false });
      setAssignmentsList(assignsData || []);

      const { data: withData } = await supabase
        .from("withdrawals")
        .select("*, profiles:user_id(name, email)")
        .order("requested_at", { ascending: false });
      const withdrawals = withData || [];
      setWithdrawalsList(withdrawals);

      const { data: affData } = await supabase
        .from("affiliate_profiles")
        .select("*, profiles:user_id(name, email)")
        .order("created_at", { ascending: false });
      setAffiliatesList(affData || []);

      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setActivityLogs(logsData || []);

      const { data: requestsData } = await supabase
        .from("campaign_requests")
        .select("*, profiles:user_id(name, email, phone, tiktok, instagram, youtube)")
        .order("created_at", { ascending: false });
      setCampaignRequestsList(requestsData || []);

      // Stats calculation
      const totalU = users.length;
      const activeU = users.filter((u) => u.is_active !== false).length;
      const inactiveU = totalU - activeU;
      const activeC = campaigns.filter((c) => c.status === "ACTIVE").length;
      const pausedC = campaigns.filter((c) => c.status === "PAUSED").length;
      const completedC = campaigns.filter((c) => c.status === "COMPLETED").length;
      const pendingP = (assignsData || []).filter((a: any) => a.status === "ASSIGNED" || a.status === "IN_PROGRESS").length;
      const completedP = (assignsData || []).filter((a: any) => a.status === "COMPLETED").length;
      const pendingW = withdrawals.filter((w) => w.status === "PENDING");
      const pendingWAmount = pendingW.reduce((sum, w) => sum + Number(w.amount || 0), 0);
      const pendingCR = (requestsData || []).filter((r: any) => r.status === "pendente").length;

      setStats({
        totalUsers: totalU,
        activeUsers: activeU,
        inactiveUsers: inactiveU,
        activeCampaigns: activeC,
        pausedCampaigns: pausedC,
        completedCampaigns: completedC,
        pendingParticipations: pendingP,
        completedParticipations: completedP,
        pendingWithdrawals: pendingW.length,
        pendingWithdrawalAmount: pendingWAmount,
        pendingCampaignRequests: pendingCR,
      });
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (!window.confirm(`Tem certeza que deseja eliminar o utilizador ${userEmail}?`)) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-delete-user", { body: { userId } });
      if (error) throw error;
      toast.success("Utilizador eliminado com sucesso.");
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao eliminar utilizador.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEditUser) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("profiles").update({
        name: editName.trim(),
        phone: editPhone.trim() || null,
        primary_link: editPrimaryLink.trim() || null,
        tiktok: editTiktok.trim() || null,
        instagram: editInstagram.trim() || null,
        youtube: editYoutube.trim() || null,
        role: editRole,
        is_active: editIsActive,
      }).eq("id", selectedEditUser.id);
      if (error) throw error;
      toast.success("Operador atualizado.");
      setIsEditUserOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao atualizar perfil.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = (newEmail.split("@")[0] || "Adx").charAt(0).toUpperCase() + (newEmail.split("@")[0] || "Adx").slice(1, 4);
    const pass = `${prefix}@${Math.floor(1000 + Math.random() * 9000)}!`;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-create-user", {
        body: {
          email: newEmail.trim(),
          password: pass,
          name: newName.trim(),
          phone: newPhone.trim(),
          role: newRole,
          first_login: true,
          primary_link: newPrimaryLink.trim(),
          tiktok: newTiktok.trim(),
          instagram: newInstagram.trim(),
          youtube: newYoutube.trim(),
        },
      });
      if (error) throw error;
      setCreatedUserData({ name: newName, email: newEmail, password: pass, phone: newPhone });
      toast.success("Operador criado com sucesso.");
      setIsCreateUserOpen(false);
      setIsUserCreatedSuccessOpen(true);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao criar operador.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaigns").insert({
        title: newTitle.trim(),
        description: newDesc.trim(),
        type: newType,
        platform: newPlatform,
        target_url: newTargetUrl.trim(),
        target_account: newTargetAccount.trim() || null,
        requester_phone: newRequesterPhone.trim() || null,
        instructions: newInstructions.trim() || "Cumpra os requisitos da tarefa e confirme.",
        reward_amount: parseFloat(newReward),
        max_participants: parseInt(newMaxParticipants),
        objective: newObjective.trim() || null,
        status: newStatus,
      });
      if (error) throw error;
      toast.success("Campanha lançada com sucesso.");
      setIsCreateCampaignOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao lançar campanha.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateCampaignRequestStatus = async (id: string, status: "aprovada" | "rejeitada") => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_requests").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success(`Solicitação ${status}.`);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao atualizar solicitação.");
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateCampaignWithData = (req: any) => {
    setNewTitle(req.title || "");
    setNewDesc(req.description || "");
    setNewType(req.type === "afiliados" ? "affiliate" : "collective");
    setNewObjective(req.objective || "");
    setNewInstructions("");
    setNewTargetUrl("");
    setNewTargetAccount("");
    setNewRequesterPhone(req.profiles?.phone || "");
    setNewStatus("draft");
    setIsCreateCampaignOpen(true);
  };

  const handleAssignCampaign = async () => {
    if (!selectedCampaignId || selectedUserIds.length === 0) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("admin_assign_campaign", {
        p_campaign_id: selectedCampaignId,
        p_user_ids: selectedUserIds,
      });
      if (error) throw error;
      toast.success("Campanha atribuída com sucesso.");
      setIsAssignCampaignOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao atribuir campanha.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: "APPROVE" | "PAID" | "REJECT") => {
    let reason = action === "REJECT" ? window.prompt("Motivo do cancelamento/rejeição:") : null;
    try {
      const { error } = await supabase.rpc("admin_process_withdrawal", {
        p_withdrawal_id: id,
        p_action: action,
        p_rejection_reason: reason,
      });
      if (error) throw error;
      toast.success("Saque processado.");
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro no processamento financeiro.");
    }
  };

  const handleToggleAffiliate = async (userId: string, isActive: boolean, code?: string) => {
    setSubmitting(true);
    try {
      const { error } = await supabase.rpc("admin_toggle_affiliate", {
        p_user_id: userId,
        p_is_active: isActive,
        p_custom_code: code || null,
      });
      if (error) throw error;
      toast.success("Estatuto de afiliado atualizado.");
      setIsAffiliateModalOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao gerir afiliado.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenOperationalList = async (campaign: any) => {
    setSelectedOperationalCampaign(campaign);
    setIsOperationalListOpen(true);
    const { data } = await supabase.from("campaign_assignments").select("*, profiles:user_id(*)").eq("campaign_id", campaign.id);
    setOperationalParticipants(data || []);
  };

  const handlePrepareWhatsAppAffiliate = (campaign: any, participants: any[]) => {
    const phone = campaign.requester_phone || "+244900000000";
    const completedCount = participants.filter(p => p.status === "COMPLETED").length;
    const totalCount = participants.length;

    const message = `Olá! Segue o relatório operacional da campanha *${campaign.title}*:\n\n` +
      `- Plataforma: ${campaign.platform}\n` +
      `- Alvo: ${campaign.target_account || campaign.target_url}\n` +
      `- Participantes Atribuídos: ${totalCount}\n` +
      `- Concluídos: ${completedCount}\n\n` +
      `Lista de Participantes:\n` +
      participants.map((p, idx) => `${idx + 1}. ${p.profiles?.name || 'Utilizador'} (${p.status === 'COMPLETED' ? '✅ Concluído' : '⏳ Pendente'})`).join('\n') +
      `\n\nGerado via ADXmoney Control.`;

    const encoded = encodeURIComponent(message);
    const cleanPhone = phone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encoded}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black shadow-md shadow-slate-200">
            ADX
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              Painel de Controlo <Badge className="bg-emerald-600 text-[9px] px-1.5 py-0 border-none font-black uppercase">ADMIN</Badge>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestão Global ADXmoney</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={loadAdminData} className="text-slate-400 hover:text-emerald-600 h-9 px-3 gap-2 rounded-xl transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline font-black text-[10px] uppercase tracking-widest">Sincronizar</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-rose-500 hover:bg-rose-50 h-9 px-3 gap-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-100 p-4 space-y-1 shrink-0">
          {[
            { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "users", label: "Operadores", icon: <Users className="w-4 h-4" />, badge: stats.totalUsers },
            { id: "campaigns", label: "Campanhas", icon: <Layers className="w-4 h-4" />, badge: stats.activeCampaigns },
            { id: "campaignRequests", label: "Solicitações", icon: <Megaphone className="w-4 h-4" />, badge: stats.pendingCampaignRequests },
            { id: "withdrawals", label: "Levantamentos", icon: <ArrowUpRight className="w-4 h-4" />, badge: stats.pendingWithdrawals },
            { id: "participations", label: "Execuções", icon: <CheckCircle2 className="w-4 h-4" /> },
            { id: "affiliates", label: "Afiliados", icon: <Share2 className="w-4 h-4" /> },
            { id: "history", label: "Auditoria", icon: <History className="w-4 h-4" /> },
            { id: "settings", label: "Parâmetros", icon: <Settings className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeSection === item.id
                  ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100"
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${activeSection === item.id ? "bg-white text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-6 md:p-10 space-y-8 max-w-6xl w-full mx-auto">
          {/* DASHBOARD */}
          {activeSection === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Performance Global</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Sincronização em tempo real</p>
                </div>
                <Button onClick={() => setIsCreateUserOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-xl shadow-emerald-100">
                  <UserPlus className="w-4 h-4 mr-2" /> Novo Operador
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Operadores Ativos", val: stats.activeUsers, total: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: "emerald" },
                  { label: "Campanhas Ativas", val: stats.activeCampaigns, info: `${stats.completedCampaigns} Concluídas`, icon: <Layers className="w-5 h-5" />, color: "sky" },
                  { label: "Saques Pendentes", val: stats.pendingWithdrawals, amount: stats.pendingWithdrawalAmount, icon: <ArrowUpRight className="w-5 h-5" />, color: "amber" },
                  { label: "Solicitações Novas", val: stats.pendingCampaignRequests, info: "Aguardando Revisão", icon: <Megaphone className="w-5 h-5" />, color: "indigo" },
                ].map((s, idx) => (
                  <Card key={idx} className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</span>
                      <div className="p-2 rounded-2xl bg-emerald-50 text-emerald-600">
                        {s.icon}
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-black text-slate-900 font-mono tracking-tighter">{s.val}</span>
                      {s.total && <span className="text-xs text-slate-400 font-bold">/ {s.total}</span>}
                    </div>
                    <p className="text-[10px] text-slate-400 font-black uppercase mt-2 tracking-widest">
                      {s.amount ? `${s.amount.toLocaleString("pt-AO")} Kz` : s.info}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Log de Auditoria Recente */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Atividades Recentes do Sistema</h3>
                <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-50">
                  {activityLogs.slice(0, 5).map((log) => (
                    <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <div>
                          <p className="text-xs font-black text-slate-900">{log.title}</p>
                          <p className="text-[10px] text-slate-400 font-medium">{log.details}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black text-slate-400 uppercase font-mono">{new Date(log.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))}
                </Card>
              </div>
            </div>
          )}

          {/* OPERADORES */}
          {activeSection === "users" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Gestão de Operadores</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Utilizadores e permissões de acesso</p>
                </div>
                <Button onClick={() => setIsCreateUserOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-10 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100">
                  <UserPlus className="w-3.5 h-3.5 mr-2" /> Novo Operador
                </Button>
              </div>

              <div className="grid gap-4">
                {usersList.map((u) => (
                  <Card key={u.id} className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{u.name || "Sem Nome"}</span>
                          <Badge className={`text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {u.role}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase mt-1">{u.email} • {u.phone || 'Sem Telefone'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 justify-between md:justify-end">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Saldo</p>
                        <p className="text-sm font-black text-emerald-600 font-mono">
                          {Number(u.wallets?.[0]?.balance ?? 0).toLocaleString("pt-AO")} Kz
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setSelectedEditUser(u);
                          setEditName(u.name || "");
                          setEditPhone(u.phone || "");
                          setEditPrimaryLink(u.primary_link || "");
                          setEditTiktok(u.tiktok || "");
                          setEditInstagram(u.instagram || "");
                          setEditYoutube(u.youtube || "");
                          setEditRole(u.role || "user");
                          setEditIsActive(u.is_active !== false);
                          setIsEditUserOpen(true);
                        }} className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id, u.email)} className="h-9 w-9 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* CAMPANHAS */}
          {activeSection === "campaigns" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-1">
                <div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">Catálogo de Campanhas</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Lançamento e controlo operacional de anúncios</p>
                </div>
                <Button onClick={() => setIsCreateCampaignOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-10 px-4 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100">
                  <PlusCircle className="w-3.5 h-3.5 mr-2" /> Criar Campanha
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {campaignsList.map((c) => (
                  <Card key={c.id} className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl p-6 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Badge className="bg-slate-100 text-slate-600 border-none text-[9px] font-black uppercase tracking-widest">{c.platform}</Badge>
                        <span className="text-sm font-black text-emerald-600 font-mono">+{Number(c.reward_amount).toLocaleString()} Kz</span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">{c.title}</h3>
                      <p className="text-xs text-slate-400 font-medium mt-1 line-clamp-2">{c.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <Badge className={`text-[8px] font-black uppercase tracking-widest border-none ${c.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {c.status}
                      </Badge>
                      <Button size="sm" onClick={() => handleOpenOperationalList(c)} className="bg-slate-900 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-9 px-4">
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> Execução
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* SOLICITAÇÕES DE CAMPANHAS */}
          {activeSection === "campaignRequests" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="px-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Propostas de Anúncios</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Solicitações de tráfego enviadas pelos utilizadores</p>
              </div>

              <div className="grid gap-4">
                {campaignRequestsList.map((req) => (
                  <Card key={req.id} className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge className={`text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 ${req.status === 'pendente' ? 'bg-amber-100 text-amber-700' : req.status === 'aprovada' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                          {req.status}
                        </Badge>
                        <span className="text-xs text-slate-400 font-bold uppercase">{req.profiles?.name || 'Cliente'}</span>
                      </div>
                      <h3 className="text-base font-black text-slate-900 tracking-tight">{req.title}</h3>
                      <p className="text-xs text-slate-500 font-medium">{req.description}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {req.status === 'pendente' && (
                        <>
                          <Button size="sm" onClick={() => {
                            handleUpdateCampaignRequestStatus(req.id, "aprovada");
                            openCreateCampaignWithData(req);
                          }} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-4">
                            Aprovar & Lançar
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleUpdateCampaignRequestStatus(req.id, "rejeitada")} className="border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-4">
                            Rejeitar
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* LEVANTAMENTOS */}
          {activeSection === "withdrawals" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="px-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Fila de Liquidação Financeira</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Processamento de saques solicitados pelos operadores</p>
              </div>

              <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-50">
                {withdrawalsList.length === 0 ? (
                  <div className="p-16 text-center text-xs text-slate-400 font-black uppercase tracking-widest">Nenhuma solicitação encontrada</div>
                ) : (
                  withdrawalsList.map((w) => (
                    <div key={w.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-all">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400">
                            <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="text-sm font-black text-slate-900">{w.profiles?.name || w.profiles?.email}</p>
                            <Badge className={`text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 mt-1 ${w.status === 'PENDING' ? 'bg-amber-100 text-amber-700' : w.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                              {w.status}
                            </Badge>
                          </div>
                        </div>
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] text-slate-500 font-bold uppercase flex flex-wrap gap-4">
                          <span>Método: <strong className="text-slate-900">{w.method}</strong></span>
                          {w.payment_details?.telefone && <span>Telefone: <strong className="text-slate-900 font-mono">{w.payment_details.telefone}</strong></span>}
                          {w.payment_details?.iban && <span>IBAN: <strong className="text-slate-900 font-mono">{w.payment_details.iban}</strong></span>}
                        </div>
                      </div>

                      <div className="flex items-center justify-between md:justify-end gap-6">
                        <div className="text-right">
                          <p className="text-2xl font-black text-emerald-600 font-mono tracking-tighter">{Number(w.amount).toLocaleString("pt-AO")} Kz</p>
                          <p className="text-[9px] text-slate-400 font-black uppercase mt-0.5">{new Date(w.requested_at).toLocaleDateString()}</p>
                        </div>

                        {w.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button size="sm" onClick={() => handleProcessWithdrawal(w.id, "PAID")} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-5 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100">
                              Pagar
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => handleProcessWithdrawal(w.id, "REJECT")} className="border-slate-200 text-slate-400 hover:text-rose-600 rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest">
                              Recusar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </Card>
            </div>
          )}

          {/* AUDITORIA DE LOGS */}
          {activeSection === "history" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="px-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Histórico & Auditoria Geral</h2>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Registos imutáveis de ações administrativas e operacionais</p>
              </div>

              <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden divide-y divide-slate-50">
                {activityLogs.map((log) => (
                  <div key={log.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg mr-2">{log.action_type}</span>
                      <span className="text-xs font-black text-slate-900">{log.title}</span>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{log.details}</p>
                    </div>
                    <span className="text-[9px] font-black text-slate-400 uppercase font-mono">{new Date(log.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* MODAIS COMPONENTIZADOS */}
      {/* Modal Criar Operador */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-md bg-white border-none sm:rounded-3xl p-8 shadow-2xl">
          <DialogHeader className="border-b border-slate-50 pb-6 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
              <UserPlus className="w-6 h-6" />
            </div>
            <DialogTitle className="text-xl font-black text-slate-900">Novo Operador</DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-medium">Cadastre e atribua credenciais de acesso.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nome Completo</Label>
              <Input placeholder="Nome do Operador" value={newName} onChange={(e) => setNewName(e.target.value)} className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-11 rounded-2xl text-xs font-bold" required />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">E-mail</Label>
              <Input type="email" placeholder="operador@adxmoney.ao" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-11 rounded-2xl text-xs font-bold" required />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">WhatsApp</Label>
              <Input placeholder="+244 9..." value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-11 rounded-2xl text-xs font-bold font-mono" required />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Papel de Acesso</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="bg-slate-50 border-transparent focus:border-emerald-500 h-11 rounded-2xl text-xs font-bold">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent className="bg-white border-slate-100 rounded-2xl">
                  <SelectItem value="user" className="text-xs font-bold">Operador (USER)</SelectItem>
                  <SelectItem value="admin" className="text-xs font-bold">Administrador (ADMIN)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-2xl uppercase tracking-widest text-xs shadow-xl shadow-emerald-100 mt-4">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Cadastrar Operador"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Operacional (Execução e Participantes) */}
      <Dialog open={isOperationalListOpen} onOpenChange={setIsOperationalListOpen}>
        <DialogContent className="max-w-xl bg-white border-none sm:rounded-3xl p-8 shadow-2xl">
          <DialogHeader className="border-b border-slate-50 pb-4 mb-4">
            <DialogTitle className="text-xl font-black text-slate-900">
              Participantes: {selectedOperationalCampaign?.title}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 font-bold uppercase tracking-widest">
              Lista de execuções atribuídas a esta campanha
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
            {operationalParticipants.map((p) => (
              <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-black text-slate-900">{p.profiles?.name || p.profiles?.email}</p>
                  <span className={`text-[8px] font-black uppercase tracking-widest ${p.status === 'COMPLETED' ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {p.status}
                  </span>
                </div>
                <span className="text-[10px] font-black font-mono text-slate-400">{new Date(p.created_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>

          <DialogFooter className="pt-4 border-t border-slate-50">
            <Button onClick={() => handlePrepareWhatsAppAffiliate(selectedOperationalCampaign, operationalParticipants)} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl h-11 px-6 font-black text-xs uppercase tracking-widest w-full">
              <Send className="w-4 h-4 mr-2" /> Enviar Relatório WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboardPage;
