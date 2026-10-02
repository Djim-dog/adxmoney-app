import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard, Users, Layers, ArrowUpRight, Megaphone, 
  RefreshCw, Loader2, CheckCircle2, History, AlertTriangle, UserPlus, Trash2, Send, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const AdminDashboardPage: React.FC = () => {
  const { signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<"dashboard" | "users" | "campaigns" | "campaignRequests" | "withdrawals" | "logs" | "community">("dashboard");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ users: [], withdrawals: [], requests: [], campaigns: [], logs: [], tasks: [] });

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const [u, w, r, c, l, t] = await Promise.all([
        supabase.from("profiles").select("*, wallets(balance, reserved_balance)"),
        supabase.from("withdrawals").select("*, profiles:user_id(name, email)"),
        supabase.from("campaign_requests").select("*, profiles:user_id(name)"),
        supabase.from("campaigns").select("*"),
        supabase.from("activity_logs").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("community_tasks").select("*")
      ]);
      setData({ users: u.data || [], withdrawals: w.data || [], requests: r.data || [], campaigns: c.data || [], logs: l.data || [], tasks: t.data || [] });
    } catch { toast.error("Erro ao carregar dados."); } finally { setLoading(false); }
  };

  useEffect(() => { loadAdminData(); }, []);

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Tem certeza que deseja apagar este utilizador?")) return;
    try {
      const { error } = await supabase.functions.invoke("admin-delete-user", { body: { userId } });
      if (error) throw error;
      toast.success("Utilizador removido.");
      loadAdminData();
    } catch { toast.error("Erro ao remover utilizador."); }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-sans">
      <aside className="w-64 bg-white border-r border-slate-100 p-4 space-y-2">
        <div className="px-4 py-6 font-black text-emerald-600 text-xl">ADX Admin</div>
        {[ { id: "dashboard", label: "Visão Geral", icon: <LayoutDashboard /> }, { id: "users", label: "Operadores", icon: <Users /> }, { id: "campaigns", label: "Campanhas", icon: <Layers /> }, { id: "campaignRequests", label: "Solicitações", icon: <Megaphone /> }, { id: "withdrawals", label: "Levantamentos", icon: <ArrowUpRight /> }, { id: "logs", label: "Logs/Histórico", icon: <History /> } ].map(item => (
          <button key={item.id} onClick={() => setActiveSection(item.id as any)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-black uppercase ${activeSection === item.id ? "bg-emerald-600 text-white" : "text-slate-400 hover:bg-slate-50"}`}>
            {item.icon} {item.label}
          </button>
        ))}
        <Button variant="ghost" className="w-full text-rose-500 font-black text-[10px] mt-auto" onClick={signOut}>Sair</Button>
      </aside>

      <main className="flex-1 p-10 overflow-y-auto">
        {activeSection === "dashboard" && (
          <div className="grid grid-cols-4 gap-6">
             {[ { l: "Operadores", v: data.users.length }, { l: "Campanhas", v: data.campaigns.length }, { l: "Saques", v: data.withdrawals.filter(w => w.status === 'PENDING').length }, { l: "Logs", v: data.logs.length } ].map((s, i) => (
               <Card key={i} className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-100 border-none">
                  <p className="text-[10px] font-black uppercase text-slate-400">{s.l}</p>
                  <p className="text-3xl font-black mt-2">{s.v}</p>
               </Card>
             ))}
          </div>
        )}

        {activeSection === "users" && (
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100">
                <h2 className="text-xl font-black mb-6">Gestão de Operadores</h2>
                {data.users.map((u: any) => (
                    <div key={u.id} className="flex justify-between items-center py-4 border-b border-slate-50">
                        <div><p className="font-black">{u.name || "Sem Nome"}</p><p className="text-xs text-slate-400">{u.email}</p></div>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.id)} className="rounded-xl"><Trash2 className="w-4 h-4"/></Button>
                    </div>
                ))}
            </div>
        )}

        {activeSection === "logs" && (
            <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-100">
                <h2 className="text-xl font-black mb-6">Registo de Auditoria</h2>
                {data.logs.map((l: any) => (
                    <div key={l.id} className="py-2 border-b border-slate-50 text-xs">
                        <span className="font-black text-emerald-600 mr-2">{l.action_type}</span>
                        <span className="text-slate-600">{l.title}</span>
                    </div>
                ))}
            </div>
        )}
      </main>
    </div>
  );
};
export default AdminDashboardPage;
