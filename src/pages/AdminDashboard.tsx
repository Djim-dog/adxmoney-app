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
  CheckCircle2,
  Megaphone,
  Trash2,
  Check,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    activeCampaigns: 0,
    completedCampaigns: 0,
    pendingWithdrawals: 0,
    pendingWithdrawalAmount: 0,
    pendingCampaignRequests: 0,
  });

  const [usersList, setUsersList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  // Modals
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isUserCreatedSuccessOpen, setIsUserCreatedSuccessOpen] = useState(false);
  const [createdUserData, setCreatedUserData] = useState<any>(null);

  // New User Form
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState("user");
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

      const { data: withData } = await supabase
        .from("withdrawals")
        .select("*, profiles:user_id(name, email)")
        .order("requested_at", { ascending: false });
      setWithdrawalsList(withData || []);

      const { data: logsData } = await supabase
        .from("activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      setActivityLogs(logsData || []);

      const { data: requestsData } = await supabase
        .from("campaign_requests")
        .select("*")
        .eq("status", "pendente");

      const { data: campaignsData } = await supabase.from("campaigns").select("*");

      const activeU = users.filter((u) => u.is_active !== false).length;
      const activeC = (campaignsData || []).filter((c) => c.status === "ACTIVE").length;
      const completedC = (campaignsData || []).filter((c) => c.status === "COMPLETED").length;
      const pendingW = (withData || []).filter((w) => w.status === "PENDING");
      const pendingWAmount = pendingW.reduce((sum, w) => sum + Number(w.amount || 0), 0);

      setStats({
        totalUsers: users.length,
        activeUsers: activeU,
        activeCampaigns: activeC,
        completedCampaigns: completedC,
        pendingWithdrawals: pendingW.length,
        pendingWithdrawalAmount: pendingWAmount,
        pendingCampaignRequests: (requestsData || []).length,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const prefix = (newEmail.split("@")[0] || "Adx").charAt(0).toUpperCase() + (newEmail.split("@")[0] || "Adx").slice(1, 4);
    const pass = `${prefix}@${Math.floor(1000 + Math.random() * 9000)}!`;
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("admin-create-user", {
        body: { email: newEmail.trim(), password: pass, name: newName.trim(), phone: newPhone.trim(), role: newRole, first_login: true },
      });
      if (error) throw error;
      setCreatedUserData({ name: newName, email: newEmail, password: pass });
      toast.success("Usuário criado com sucesso!");
      setIsCreateUserOpen(false);
      setIsUserCreatedSuccessOpen(true);
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao criar usuário.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: "PAID" | "REJECT") => {
    try {
      const { error } = await supabase.rpc("admin_process_withdrawal", { p_withdrawal_id: id, p_action: action, p_rejection_reason: null });
      if (error) throw error;
      toast.success("Operação concluída.");
      await loadAdminData();
    } catch (err: any) {
      toast.error("Erro ao processar saque.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black">ADX</div>
          <div>
            <h1 className="text-sm font-black text-slate-900 tracking-tight uppercase flex items-center gap-2">Painel de Controlo <Badge className="bg-emerald-600 text-[9px] px-1.5 py-0">ADMIN</Badge></h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Gestão de Plataforma</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={loadAdminData} className="text-slate-400 hover:text-emerald-600 font-black text-[10px] uppercase tracking-widest gap-2">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Sincronizar
          </Button>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 hover:bg-red-50 font-black text-[10px] uppercase tracking-widest">Sair</Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-white border-r border-slate-100 p-4 space-y-1">
          {[
            { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard /> },
            { id: "users", label: "Operadores", icon: <Users />, badge: stats.totalUsers },
            { id: "withdrawals", label: "Levantamentos", icon: <ArrowUpRight />, badge: stats.pendingWithdrawals },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl text-[11px] font-black uppercase tracking-widest ${activeSection === item.id ? "bg-emerald-600 text-white shadow-xl shadow-emerald-100" : "text-slate-400 hover:bg-slate-50"}`}>
              <div className="flex items-center gap-3">{React.cloneElement(item.icon, { className: "w-4 h-4" })} {item.label}</div>
              {item.badge ? <span className={`text-[9px] px-2 py-0.5 rounded-full ${activeSection === item.id ? "bg-white text-emerald-600" : "bg-slate-100"}`}>{item.badge}</span> : null}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6 md:p-10 space-y-8 max-w-6xl w-full">
          {activeSection === "dashboard" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
               {[
                 { label: "Operadores", val: stats.totalUsers, icon: <Users /> },
                 { label: "Campanhas", val: stats.activeCampaigns, icon: <Layers /> },
                 { label: "Saques Pendentes", val: stats.pendingWithdrawals, icon: <ArrowUpRight /> },
                 { label: "Solicitações", val: stats.pendingCampaignRequests, icon: <Megaphone /> },
               ].map((s, idx) => (
                 <Card key={idx} className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl p-6">
                    <div className="flex items-center justify-between mb-4 text-emerald-600">
                       {React.cloneElement(s.icon, { className: "w-6 h-6" })}
                       <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{s.label}</span>
                    </div>
                    <div className="text-3xl font-black text-slate-900 font-mono">{s.val}</div>
                 </Card>
               ))}
            </div>
          )}

          {activeSection === "withdrawals" && (
            <div className="space-y-6">
              <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest px-1">Levantamentos Pendentes</h2>
              <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 overflow-hidden divide-y divide-slate-50">
                 {withdrawalsList.filter(w => w.status === 'PENDING').map(w => (
                   <div key={w.id} className="p-6 flex items-center justify-between hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-black text-slate-900">{w.profiles?.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{w.method}: {w.payment_details?.telefone || w.payment_details?.iban}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-lg font-black text-amber-600 font-mono">{Number(w.amount).toLocaleString()} Kz</span>
                        <div className="flex gap-2">
                           <Button size="sm" onClick={() => handleProcessWithdrawal(w.id, "PAID")} className="bg-emerald-600 rounded-xl h-9 text-[10px] font-black uppercase">Pagar</Button>
                        </div>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
