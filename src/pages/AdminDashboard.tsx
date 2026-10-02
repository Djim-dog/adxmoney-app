import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Layers, ArrowUpRight, Megaphone, 
  RefreshCw, Loader2, CheckCircle2, XCircle, Trash2, ShieldCheck,
  Settings, UserPlus, PlayCircle, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export const AdminDashboardPage: React.FC = () => {
  const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<"dashboard" | "users" | "campaigns" | "campaignRequests" | "withdrawals">("dashboard");
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalUsers: 0, activeCampaigns: 0, pendingWithdrawals: 0, pendingCampaignRequests: 0 });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [withdrawalsList, setWithdrawalsList] = useState<any[]>([]);
  const [campaignRequests, setCampaignRequests] = useState<any[]>([]);
  const [campaignsList, setCampaignsList] = useState<any[]>([]);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const { data: users } = await supabase.from("profiles").select("*");
      const { data: withData } = await supabase.from("withdrawals").select("*, profiles:user_id(name, email)");
      const { data: reqs } = await supabase.from("campaign_requests").select("*, profiles:user_id(name)");
      const { data: camps } = await supabase.from("campaigns").select("*");

      setUsersList(users || []);
      setWithdrawalsList(withData || []);
      setCampaignRequests(reqs || []);
      setCampaignsList(camps || []);
      
      setStats({
        totalUsers: users?.length || 0,
        activeCampaigns: (camps || []).filter(c => c.status === "ACTIVE").length,
        pendingWithdrawals: (withData || []).filter(w => w.status === "PENDING").length,
        pendingCampaignRequests: (reqs || []).filter(r => r.status === "pendente").length,
      });
    } catch (err) {
      toast.error("Erro ao carregar dados administrativos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAdminData(); }, []);

  const handleProcessWithdrawal = async (id: string, action: "PAID" | "REJECT") => {
    try {
      const { error } = await supabase.rpc("admin_process_withdrawal", { p_withdrawal_id: id, p_action: action, p_rejection_reason: null });
      if (error) throw error;
      toast.success("Operação concluída.");
      loadAdminData();
    } catch { toast.error("Erro ao processar."); }
  };

  const handleUpdateCampaignRequestStatus = async (id: string, status: "aprovada" | "rejeitada") => {
    try {
      const { error } = await supabase.from("campaign_requests").update({ status }).eq("id", id);
      if (error) throw error;
      toast.success("Status atualizado.");
      loadAdminData();
    } catch { toast.error("Erro ao atualizar status."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <header className="bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-black">ADX</div>
          <div>
            <h1 className="text-sm font-black text-slate-900 uppercase">Painel Admin</h1>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestão ADXmoney</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut} className="text-red-500 font-black text-[10px] uppercase">Sair</Button>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-white border-r border-slate-100 p-4 space-y-1">
          {[
            { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard /> },
            { id: "users", label: "Operadores", icon: <Users /> },
            { id: "campaigns", label: "Campanhas", icon: <Layers /> },
            { id: "campaignRequests", label: "Solicitações", icon: <Megaphone /> },
            { id: "withdrawals", label: "Levantamentos", icon: <ArrowUpRight /> },
          ].map((item) => (
            <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase ${activeSection === item.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "text-slate-400 hover:bg-slate-50"}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6 md:p-10 space-y-8 max-w-6xl w-full">
          {activeSection === "dashboard" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               {[ { l: "Operadores", v: stats.totalUsers }, { l: "Campanhas", v: stats.activeCampaigns }, { l: "Saques", v: stats.pendingWithdrawals }, { l: "Solicitações", v: stats.pendingCampaignRequests } ].map((s, i) => (
                 <Card key={i} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-100 border-none">
                    <p className="text-[10px] font-black uppercase text-slate-400 mb-2">{s.l}</p>
                    <p className="text-3xl font-black">{s.v}</p>
                 </Card>
               ))}
            </div>
          )}

          {activeSection === "campaigns" && (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-6">
              <h2 className="text-xl font-black mb-6">Campanhas Ativas</h2>
              {campaignsList.map(c => (
                <div key={c.id} className="flex justify-between items-center py-4 border-b border-slate-50">
                    <div><p className="font-black">{c.title}</p><p className="text-xs text-slate-400">{c.platform}</p></div>
                    <Badge className="bg-emerald-100 text-emerald-700">{c.status}</Badge>
                </div>
              ))}
            </div>
          )}

          {activeSection === "campaignRequests" && (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-6">
              <h2 className="text-xl font-black mb-6">Solicitações de Campanhas</h2>
              {campaignRequests.map(r => (
                <div key={r.id} className="flex justify-between items-center py-4 border-b border-slate-50">
                    <div><p className="font-black">{r.title}</p><p className="text-xs text-slate-400">Requerente: {r.profiles?.name}</p></div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateCampaignRequestStatus(r.id, "aprovada")} className="bg-emerald-600 rounded-xl text-[10px]">Aprovar</Button>
                        <Button size="sm" onClick={() => handleUpdateCampaignRequestStatus(r.id, "rejeitada")} className="bg-rose-600 rounded-xl text-[10px]">Rejeitar</Button>
                    </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "withdrawals" && (
            <div className="bg-white rounded-3xl shadow-xl shadow-slate-100 p-6">
              <h2 className="text-xl font-black mb-6">Levantamentos Pendentes</h2>
              {withdrawalsList.filter(w => w.status === 'PENDING').map(w => (
                <div key={w.id} className="flex justify-between items-center py-4 border-b border-slate-50">
                  <div><p className="font-black">{w.profiles?.name}</p><p className="text-xs text-slate-400">Método: {w.method}</p></div>
                  <div className="flex items-center gap-4">
                    <p className="font-mono font-black text-lg">{Number(w.amount).toLocaleString()} Kz</p>
                    <Button size="sm" onClick={() => handleProcessWithdrawal(w.id, "PAID")} className="bg-emerald-600 rounded-xl text-[10px]">Pagar</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
export default AdminDashboardPage;
