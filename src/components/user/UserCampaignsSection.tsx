import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Users2,
  ChevronRight,
  Sparkles,
  Layers,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  PlayCircle,
  History,
  TrendingUp,
  Award
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CampaignRequestModal } from "./CampaignRequestModal";

interface UserCampaignsHubProps {
  userId: string;
}

export const UserCampaignsSection: React.FC<UserCampaignsHubProps> = ({ userId }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"online" | "historico">("online");
  const [onlineCampaigns, setOnlineCampaigns] = useState<any[]>([]);
  const [completedCampaigns, setCompletedCampaigns] = useState<any[]>([]);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      // Carregar campanhas ativas/online
      const { data: activeData } = await supabase
        .from("campaigns")
        .select("*")
        .eq("status", "ACTIVE")
        .order("created_at", { ascending: false });

      setOnlineCampaigns(activeData || []);

      // Simular histórico ou buscar campanhas finalizadas
      const { data: compData } = await supabase
        .from("campaigns")
        .select("*")
        .in("status", ["COMPLETED", "ended"])
        .order("created_at", { ascending: false });

      setCompletedCampaigns(compData || []);

      // Minhas solicitações
      const { data: reqData } = await supabase
        .from("campaign_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      setUserRequests(reqData || []);
    } catch (err) {
      console.error("Erro ao carregar dados de campanhas:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [userId]);

  return (
    <div className="space-y-5 pb-12">
      {/* HEADER NATIVO APP */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-slate-900 tracking-tight">Campanhas Coletivas</h1>
          <p className="text-[11px] text-slate-500 font-medium">Engajamento sincronizado em rede</p>
        </div>
        <Button
          onClick={() => setIsRequestModalOpen(true)}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-10 px-4 rounded-2xl shadow-md shadow-emerald-100 gap-1.5"
        >
          <PlusCircle className="w-4 h-4" />
          Nova Campanha (10$)
        </Button>
      </div>

      {/* TABS NATIVAS APP (ONLINE vs HISTÓRICO) */}
      <div className="bg-slate-100 p-1 rounded-2xl flex gap-1">
        <button
          onClick={() => setActiveTab("online")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === "online"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <PlayCircle className="w-4 h-4 text-emerald-600" />
          Campanhas Online ({onlineCampaigns.length})
        </button>
        <button
          onClick={() => setActiveTab("historico")}
          className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
            activeTab === "historico"
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          <History className="w-4 h-4 text-slate-400" />
          Histórico / Concluídas ({completedCampaigns.length})
        </button>
      </div>

      {/* CONTEÚDO DA ABA ATIVA */}
      {activeTab === "online" ? (
        <div className="space-y-3">
          {onlineCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                <Sparkles className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Nenhuma campanha online neste momento</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                As campanhas ativas aparecerão aqui para interações e recompensas coletivas.
              </p>
              <Button
                onClick={() => setIsRequestModalOpen(true)}
                variant="outline"
                className="h-10 px-4 rounded-xl text-xs font-bold border-slate-200 mt-2"
              >
                Criar a primeira campanha
              </Button>
            </div>
          ) : (
            onlineCampaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <Badge className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-black uppercase tracking-widest mb-1.5">
                      {camp.platform || "Plataforma"}
                    </Badge>
                    <h3 className="text-xs font-black text-slate-900">{camp.title}</h3>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                    +{camp.reward_amount} Kz
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-2 font-medium">{camp.description}</p>
                <div className="pt-2 border-t border-slate-50 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Ativa na rede</span>
                  <Button
                    size="sm"
                    className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] h-8 rounded-xl px-4"
                    onClick={() => window.open(camp.target_url, "_blank")}
                  >
                    Participar
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {completedCampaigns.length === 0 ? (
            <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                <History className="w-6 h-6" />
              </div>
              <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Sem histórico de campanhas concluídas</p>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                As campanhas que já atingiram as metas e encerraram serão listadas aqui como arquivo.
              </p>
            </div>
          ) : (
            completedCampaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm opacity-75 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-700">{camp.title}</span>
                  <Badge className="bg-slate-100 text-slate-500 border-none text-[9px] font-black uppercase">
                    Concluída
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-400">{camp.description}</p>
              </div>
            ))
          )}
        </div>
      )}

      {/* MINHAS SOLICITAÇÕES PENDENTES OU APROVADAS */}
      {userRequests.length > 0 && (
        <div className="space-y-3 pt-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Minhas Propostas Submetidas</h3>
          <div className="space-y-2">
            {userRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-xs font-black text-slate-900 block">{req.title}</span>
                  <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>
                <Badge className={
                  req.status === "aprovada" ? "bg-emerald-50 text-emerald-600 border-none text-[9px] font-black" :
                  req.status === "rejeitada" ? "bg-rose-50 text-rose-500 border-none text-[9px] font-black" :
                  "bg-amber-50 text-amber-600 border-none text-[9px] font-black"
                }>
                  {req.status.toUpperCase()}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Solicitação */}
      <CampaignRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={loadData}
        userId={userId}
      />
    </div>
  );
};
