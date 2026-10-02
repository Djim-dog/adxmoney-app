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
  Megaphone,
  Eye,
  Bell,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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

  // Modais
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
  const [newInstructions, setNewInstructions] = useState("");
  const [newReward, setNewReward] = useState("150");
  const [newMaxParticipants, setNewMaxParticipants] = useState("100");
  const [newObjective, setNewObjective] = useState("");
  const [newStatus, setNewStatus] = useState("draft");

  // Operational Lists
  const [isOperationalListOpen, setIsOperationalListOpen] = useState(false);
  const [selectedOperationalCampaign, setSelectedOperationalCampaign] = useState<any | null>(null);
  const [operationalParticipants, setOperationalParticipants] = useState<any[]>([]);

  // Request Details
  const [isRequestDetailsOpen, setIsRequestDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Affiliate Modal
  const [isAffiliateModalOpen, setIsAffiliateModalOpen] = useState(false);
  const [selectedAffiliateUser, setSelectedAffiliateUser] = useState<any | null>(null);
  const [customAffiliateCode, setCustomAffiliateCode] = useState("");

  const [updatePassword, setUpdatePassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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

      // Stats
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
    if (!window.confirm(`Tem certeza que deseja eliminar o usuário ${userEmail}?`)) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-delete-user", { body: { userId } });
      if (error) throw error;
      toast.success("Usuário eliminado.");
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao eliminar.");
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
      toast.success("Usuário atualizado.");
      setIsEditUserOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao atualizar.");
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
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
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
      toast.success("Usuário criado.");
      setIsCreateUserOpen(false);
      setIsUserCreatedSuccessOpen(true);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao criar.");
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
        instructions: newInstructions.trim(),
        reward_amount: parseFloat(newReward),
        max_participants: parseInt(newMaxParticipants),
        objective: newObjective.trim() || null,
        status: newStatus,
      });
      if (error) throw error;
      toast.success("Campanha criada.");
      setIsCreateCampaignOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao criar campanha.");
    } finally {
      setSubmitting(false);
    }
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
      toast.success("Campanhas atribuídas.");
      setIsAssignCampaignOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao atribuir.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: "APPROVE" | "PAID" | "REJECT") => {
    let reason = action === "REJECT" ? window.prompt("Motivo da rejeição:") : null;
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
      toast.error("Erro no processamento.");
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
      toast.success("Afiliado atualizado.");
      setIsAffiliateModalOpen(false);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao gerenciar.");
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg">
             <img src="/logo.png" alt="ADX" className="h-6 w-auto brightness-0 invert" />
          </div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">
              Controle Administrativo <Badge className="bg-emerald-600 text-[9px] px-1.5 py-0">V2.0</Badge>
            </h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestão Global da Plataforma</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={loadAdminData} className="text-slate-400 hover:text-emerald-600 h-9 px-3 gap-2 rounded-xl border border-transparent hover:border-emerald-50 active:scale-95 transition-all">
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span className="hidden sm:inline font-bold text-[10px] uppercase">Sincronizar</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-red-400 hover:text-red-600 h-9 px-3 gap-2 rounded-xl hover:bg-red-50 active:scale-95 transition-all">
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline font-bold text-[10px] uppercase">Sair</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Sidebar */}
        <aside className="w-full md:w-64 bg-white border-r border-slate-100 p-4 space-y-1 shrink-0 overflow-y-auto">
          {[
            { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard className="w-4 h-4" /> },
            { id: "users", label: "Utilizadores", icon: <Users className="w-4 h-4" />, badge: stats.totalUsers },
            { id: "campaigns", label: "Campanhas", icon: <Layers className="w-4 h-4" />, badge: stats.activeCampaigns },
            { id: "campaignRequests", label: "Solicitações", icon: <Megaphone className="w-4 h-4" />, badge: stats.pendingCampaignRequests },
            { id: "withdrawals", label: "Levantamentos", icon: <ArrowUpRight className="w-4 h-4" />, badge: stats.pendingWithdrawals },
            { id: "participations", label: "Execuções", icon: <CheckCircle2 className="w-4 h-4" /> },
            { id: "affiliates", label: "Afiliados", icon: <Share2 className="w-4 h-4" /> },
            { id: "history", label: "Auditoria", icon: <History className="w-4 h-4" /> },
            { id: "settings", label: "Segurança", icon: <Settings className="w-4 h-4" /> },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id as any)}
              className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                activeSection === item.id
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                  : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${activeSection === item.id ? "bg-white text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 md:p-10 space-y-8 overflow-y-auto max-w-6xl mx-auto w-full">
          {/* DASHBOARD */}
          {activeSection === "dashboard" && (
            <div className="space-y-8 animate-in fade-in duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">Performance Operacional</h2>
                  <p className="text-sm text-slate-500 font-medium">Indicadores sincronizados em tempo real com a base de dados.</p>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => setIsCreateUserOpen(true)} className="bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-lg shadow-slate-200">
                    <UserPlus className="w-4 h-4 mr-2" /> Novo Operador
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: "Operadores Ativos", val: stats.activeUsers, total: stats.totalUsers, icon: <Users className="w-5 h-5" />, color: "emerald" },
                  { label: "Campanhas Ativas", val: stats.activeCampaigns, info: `${stats.completedCampaigns} Concluídas`, icon: <Layers className="w-5 h-5" />, color: "sky" },
                  { label: "Saques Pendentes", val: stats.pendingWithdrawals, amount: stats.pendingWithdrawalAmount, icon: <ArrowUpRight className="w-5 h-5" />, color: "amber" },
                  { label: "Propostas Novas", val: stats.pendingCampaignRequests, info: "Aguardando Revisão", icon: <Megaphone className="w-5 h-5" />, color: "indigo" },
                ].map((s, idx) => (
                  <Card key={idx} className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden group hover:scale-[1.02] transition-all">
                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                      <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{s.label}</p>
                      <div className={`p-2 rounded-xl bg-${s.color}-50 text-${s.color}-600 group-hover:rotate-12 transition-transform`}>
                        {s.icon}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-black text-slate-900 font-mono">{s.val}</span>
                        {s.total && <span className="text-xs text-slate-400 font-bold">/ {s.total}</span>}
                      </div>
                      <p className="text-[10px] text-slate-500 font-black uppercase mt-2 tracking-tight">
                        {s.amount ? `${s.amount.toLocaleString()} Kz` : s.info}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Atividades Recentes */}
              <div className="space-y-4">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Log de Auditoria Recente</h3>
                <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {activityLogs.slice(0, 6).map((log) => (
                      <div key={log.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
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
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* UTILIZADORES */}
          {activeSection === "users" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Gestão de Operadores</h2>
                <Button onClick={() => setIsCreateUserOpen(true)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest">
                  <UserPlus className="w-3.5 h-3.5 mr-2" /> Adicionar
                </Button>
              </div>

              <div className="grid gap-4">
                {usersList.map((u) => (
                  <Card key={u.id} className="bg-white border-none shadow-md rounded-3xl hover:shadow-xl hover:shadow-slate-200/50 transition-all p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                        <Users className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-900">{u.name || "Sem Nome"}</span>
                          <Badge className={`text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {u.role}
                          </Badge>
                          {u.suspended_until && new Date(u.suspended_until) > new Date() && (
                             <Badge className="text-[8px] font-black uppercase tracking-widest bg-red-100 text-red-600 border-none">Suspenso</Badge>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 font-bold uppercase mt-0.5">{u.email} &bull; {u.phone || 'Sem Telefone'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Saldo Carteira</p>
                        <p className="text-sm font-black text-emerald-600 font-mono">
                          {Number(u.wallets?.[0]?.balance ?? 0).toLocaleString()} <span className="text-[10px] font-medium">Kz</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
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
                        }} className="h-9 w-9 rounded-xl text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all">
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id, u.email)} className="h-9 w-9 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
                  <p className="text-sm text-slate-500 font-medium">Analise as solicitações de saque e processe os pagamentos.</p>
               </div>

               <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
                  <div className="divide-y divide-slate-50">
                    {withdrawalsList.length === 0 ? (
                      <div className="p-20 text-center text-xs text-slate-400 font-black uppercase tracking-widest">Nenhuma solicitação pendente</div>
                    ) : (
                      withdrawalsList.map((w) => (
                        <div key={w.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 hover:bg-slate-50 transition-all">
                           <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">
                                    <ArrowUpRight className="w-5 h-5" />
                                 </div>
                                 <div>
                                    <p className="text-sm font-black text-slate-900">{w.profiles?.name || w.profiles?.email}</p>
                                    <Badge className={`text-[8px] font-black uppercase tracking-widest border-none px-2 py-0.5 mt-1 ${w.status === 'PENDING' ? 'bg-amber-100 text-amber-600' : w.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                       {w.status}
                                    </Badge>
                                 </div>
                              </div>
                              <div className="bg-white p-3 rounded-2xl border border-slate-100 text-[10px] text-slate-500 font-bold uppercase tracking-tight flex flex-wrap gap-x-4 gap-y-2">
                                 <span>&bull; Método: <strong className="text-slate-700">{w.method}</strong></span>
                                 {w.payment_details?.telefone &amp;&amp; &lt;span&gt;&bull; Telefone: &lt;strong className="text-slate-700"&gt;{w.payment_details.telefone}&lt;/strong&gt;&lt;/span&gt;}
                                 {w.payment_details?.iban &amp;&amp; &lt;span&gt;&bull; IBAN: &lt;strong className="text-slate-700 font-mono"&gt;{w.payment_details.iban}&lt;/strong&gt;&lt;/span&gt;}
                              </div>
                           </div>

                           <div className="flex items-center justify-between md:justify-end gap-6">
                              <div className="text-right">
                                 <p className="text-2xl font-black text-amber-600 font-mono">{Number(w.amount).toLocaleString()} &lt;span className="text-xs font-bold"&gt;Kz&lt;/span&gt;</p>
                                 <p className="text-[9px] text-slate-400 font-black uppercase tracking-tighter">{new Date(w.requested_at).toLocaleString()}</p>
                              </div>

                              {w.status === "PENDING" &amp;&amp; (
                                 &lt;div className="flex gap-2"&gt;
                                    &lt;Button size="sm" onClick={() =&gt; handleProcessWithdrawal(w.id, "PAID")} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl h-10 px-6 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100"&gt;
                                       Pagar
                                    &lt;/Button&gt;
                                    &lt;Button size="sm" variant="outline" onClick={() =&gt; handleProcessWithdrawal(w.id, "REJECT")} className="border-slate-200 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl h-10 px-4 font-black text-[10px] uppercase tracking-widest"&gt;
                                       Recusar
                                    &lt;/Button&gt;
                                 &lt;/div&gt;
                              )}
                           </div>
                        </div>
                      ))
                    )}
                  </div>
               &lt;/Card&gt;
            &lt;/div&gt;
          )}

          {/* OUTRAS SEÇÕES (Simplificadas para o novo tema) */}
          {/* Adicionaria as outras conforme necessário, mantendo o padrão Rounded-2xl/3xl, Font-Black, Emerald/Slate */}

        &lt;/main&gt;
      &lt;/div&gt;

      {/* Modais de Administração */}
      &lt;Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}&gt;
        &lt;DialogContent className="max-w-md bg-white border-none sm:rounded-3xl p-8 shadow-2xl"&gt;
          &lt;DialogHeader className="border-b border-slate-50 pb-6 mb-6"&gt;
            &lt;div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-sm"&gt;
              &lt;UserPlus className="w-7 h-7" /&gt;
            &lt;/div&gt;
            &lt;DialogTitle className="text-2xl font-black text-slate-900 tracking-tight"&gt;
              Cadastrar Operador
            &lt;/DialogTitle&gt;
            &lt;DialogDescription className="text-slate-500 text-sm font-medium pt-1"&gt;
              Crie as credenciais de acesso para um novo colaborador do sistema.
            &lt;/DialogDescription&gt;
          &lt;/DialogHeader&gt;
          
          &lt;form onSubmit={handleCreateUser} className="space-y-5"&gt;
            &lt;div className="space-y-2"&gt;
              &lt;Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest"&gt;Nome Completo *&lt;/Label&gt;
              &lt;Input placeholder="Ex: João Baptista" value={newName} onChange={(e) =&gt; setNewName(e.target.value)} className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all" required /&gt;
            &lt;/div&gt;
            &lt;div className="space-y-2"&gt;
              &lt;Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest"&gt;E-mail Corporativo *&lt;/Label&gt;
              &lt;Input type="email" placeholder="operador@adxmoney.ao" value={newEmail} onChange={(e) =&gt; setNewEmail(e.target.value)} className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all" required /&gt;
            &lt;/div&gt;
            &lt;div className="space-y-2"&gt;
              &lt;Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest"&gt;WhatsApp / Telefone *&lt;/Label&gt;
              &lt;Input placeholder="+244 9..." value={newPhone} onChange={(e) =&gt; setNewPhone(e.target.value)} className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all font-mono" required /&gt;
            &lt;/div&gt;
            &lt;div className="space-y-2"&gt;
              &lt;Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest"&gt;Nível de Acesso&lt;/Label&gt;
              &lt;Select value={newRole} onValueChange={setNewRole}&gt;
                &lt;SelectTrigger className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"&gt;
                  &lt;SelectValue placeholder="Selecione o papel" /&gt;
                &lt;/SelectTrigger&gt;
                &lt;SelectContent className="bg-white border-slate-200 rounded-2xl"&gt;
                  &lt;SelectItem value="user" className="rounded-xl"&gt;Operador Comum (USER)&lt;/SelectItem&gt;
                  &lt;SelectItem value="admin" className="rounded-xl"&gt;Administrador Geral (ADMIN)&lt;/SelectItem&gt;
                &lt;/SelectContent&gt;
              &lt;/Select&gt;
            &lt;/div&gt;

            &lt;div className="pt-6 flex flex-col gap-3"&gt;
              &lt;Button type="submit" disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs"&gt;
                {submitting ? &lt;Loader2 className="w-5 h-5 animate-spin" /&gt; : "CADASTRAR E ATIVAR"}
              &lt;/Button&gt;
              &lt;Button type="button" variant="ghost" onClick={() =&gt; setIsCreateUserOpen(false)} className="w-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black h-12 rounded-2xl uppercase tracking-widest text-[10px]"&gt;
                FECHAR
              &lt;/Button&gt;
            &lt;/div&gt;
          &lt;/form&gt;
        &lt;/DialogContent&gt;
      &lt;/Dialog&gt;

      {/* Modal Sucesso Criação */}
      &lt;Dialog open={isUserCreatedSuccessOpen} onOpenChange={setIsUserCreatedSuccessOpen}&gt;
         &lt;DialogContent className="max-w-md bg-white border-none sm:rounded-3xl p-8 shadow-2xl text-center"&gt;
            &lt;div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-6"&gt;
               &lt;Check className="w-10 h-10" /&gt;
            &lt;/div&gt;
            &lt;DialogTitle className="text-2xl font-black text-slate-900 tracking-tight"&gt;Usuário Criado!&lt;/DialogTitle&gt;
            &lt;DialogDescription className="text-slate-500 text-sm font-medium mt-2"&gt;
               As credenciais de acesso foram geradas. Envie estes dados ao operador para o primeiro acesso.
            &lt;/DialogDescription&gt;

            {createdUserData &amp;&amp; (
               &lt;div className="mt-8 p-6 bg-slate-50 rounded-3xl border border-slate-100 text-left space-y-4"&gt;
                  &lt;div&gt;
                     &lt;p className="text-[9px] font-black text-slate-400 uppercase tracking-widest"&gt;E-mail de Login&lt;/p&gt;
                     &lt;p className="text-sm font-black text-slate-900"&gt;{createdUserData.email}&lt;/p&gt;
                  &lt;/div&gt;
                  &lt;div&gt;
                     &lt;p className="text-[9px] font-black text-slate-400 uppercase tracking-widest"&gt;Senha Temporária&lt;/p&gt;
                     &lt;div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 mt-1"&gt;
                        &lt;code className="font-mono font-black text-emerald-600 text-lg tracking-widest"&gt;{createdUserData.password}&lt;/code&gt;
                        &lt;Button variant="ghost" size="icon" onClick={() =&gt; {
                           navigator.clipboard.writeText(createdUserData.password);
                           toast.success("Senha copiada!");
                        }} className="text-slate-400 hover:text-emerald-600"&gt;
                           &lt;Copy className="w-4 h-4" /&gt;
                        &lt;/Button&gt;
                     &lt;/div&gt;
                  &lt;/div&gt;
               &lt;/div&gt;
            )}

            &lt;Button onClick={() =&gt; setIsUserCreatedSuccessOpen(false)} className="w-full bg-slate-900 hover:bg-emerald-600 text-white font-black h-14 rounded-2xl shadow-xl shadow-slate-200 mt-8 uppercase tracking-widest text-xs"&gt;
               CONCLUÍDO
            &lt;/Button&gt;
         &lt;/DialogContent&gt;
      &lt;/Dialog&gt;

    &lt;/div&gt;
  );
};

export default AdminDashboardPage;
