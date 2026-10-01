import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Megaphone,
  Users2,
  Share2,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  ChevronRight,
  Info,
  Layers,
  Sparkles,
  ShieldCheck,
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

export const UserCampaignsHub: React.FC<UserCampaignsHubProps> = ({ userId }) => {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [viewCampaignsType, setViewCampaignsType] = useState<"afiliados" | "monetizacao_coletiva" | null>(null);
  const [userRequests, setUserRequests] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const loadUserRequests = async () => {
    if (!userId) return;
    setLoadingRequests(true);
    try {
      const { data, error } = await supabase
        .from("campaign_requests")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserRequests(data || []);
    } catch (err) {
      console.error("Erro ao carregar solicitações de campanha:", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  useEffect(() => {
    loadUserRequests();
  }, [userId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "aprovada":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] gap-1 py-0.5">
            <CheckCircle2 className="w-3 h-3" /> Aprovada
          </Badge>
        );
      case "rejeitada":
        return (
          <Badge className="bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[10px] gap-1 py-0.5">
            <XCircle className="w-3 h-3" /> Rejeitada
          </Badge>
        );
      case "pendente":
      default:
        return (
          <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] gap-1 py-0.5">
            <Clock className="w-3 h-3" /> Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Cabeçalho da Seção */}
      <div>
        <h2 className="text-xl font-extrabold text-white tracking-tight">Área de Campanhas</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Explore as oportunidades disponíveis e envie novas propostas operacionais.
        </p>
      </div>

      {/* ÁREA 1: CAMPANHAS PARA AFILIADOS */}
      <Card className="bg-slate-900 border-slate-800 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
                <Share2 className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono border-indigo-500/30 text-indigo-300 bg-indigo-950/30">
                Afiliados
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3" />
              <span>Validação Necessária</span>
            </div>
          </div>

          <CardTitle className="text-base font-bold text-white mt-2">
            Campanhas para Afiliados
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 leading-relaxed">
            Campanhas dedicadas para partilha e expansão de marca. Recompensas atribuídas após conclusão e validação operacional.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              As recompensas desta categoria são creditadas após a verificação de conformidade do link e tarefas executadas.
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={() => setViewCampaignsType("afiliados")}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs h-9 rounded-xl shadow-md transition-all gap-1.5"
          >
            <span>Ver campanhas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>
      </Card>

      {/* ÁREA 2: MONETIZAÇÃO COLETIVA */}
      <Card className="bg-slate-900 border-slate-800 relative overflow-hidden transition-all hover:border-slate-700">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl pointer-events-none" />
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                <Users2 className="w-4 h-4" />
              </div>
              <Badge variant="outline" className="text-[10px] uppercase font-mono border-sky-500/30 text-sky-300 bg-sky-950/30">
                Coletiva
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-sky-400 font-medium bg-sky-950/30 px-2 py-0.5 rounded-full border border-sky-500/20">
              <Sparkles className="w-3 h-3" />
              <span>Participação Coletiva</span>
            </div>
          </div>

          <CardTitle className="text-base font-bold text-white mt-2">
            Monetização Coletiva
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 leading-relaxed">
            Iniciativas com metas coletivas e engajamento sincronizado entre os membros da rede operacional.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-0 pb-3">
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 text-[11px] text-slate-300 flex items-start gap-2">
            <Info className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Campanhas de participação coletiva onde o progresso do grupo desbloqueia novas etapas do projeto.
            </span>
          </div>
        </CardContent>

        <CardFooter className="pt-0">
          <Button
            onClick={() => setViewCampaignsType("monetizacao_coletiva")}
            variant="outline"
            className="w-full border-slate-700 bg-slate-800 text-slate-100 hover:bg-slate-700 font-semibold text-xs h-9 rounded-xl shadow-md transition-all gap-1.5"
          >
            <span>Ver campanhas</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </CardFooter>
      </Card>

      {/* ÁREA 3: SOLICITAR CAMPANHA (Bloco Separado) */}
      <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/50 border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 p-4 opacity-10 pointer-events-none">
          <Megaphone className="w-24 h-24 text-indigo-400 rotate-12" />
        </div>
        <CardHeader className="pb-2">
          <div className="w-fit mb-1">
            <Badge className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 text-[10px] uppercase tracking-wider font-mono">
              Proposta de Campanha
            </Badge>
          </div>
          <CardTitle className="text-base font-bold text-white">
            Solicitar Campanha
          </CardTitle>
          <CardDescription className="text-xs text-slate-400 leading-relaxed">
            Tem uma campanha ou projeto que deseja lançar? Envie os detalhes e o nosso time avaliará a sua solicitação.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2">
          <Button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-emerald-950/40 gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Solicitar campanha</span>
          </Button>
        </CardContent>
      </Card>

      {/* Minhas Solicitações de Campanha */}
      {userRequests.length > 0 && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Minhas Solicitações ({userRequests.length})
            </h3>
            <span className="text-[10px] text-slate-500 font-mono">Atualizado</span>
          </div>

          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
            {userRequests.map((req) => (
              <div key={req.id} className="p-4 space-y-2 hover:bg-slate-800/20 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-white">{req.title}</span>
                      <Badge variant="outline" className="text-[9px] uppercase font-mono border-slate-700 text-slate-400">
                        {req.type === "afiliados" ? "Afiliados" : "Monetização Coletiva"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Enviado em {new Date(req.created_at).toLocaleDateString("pt-AO", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>

                <p className="text-xs text-slate-400 line-clamp-2">{req.description}</p>

                <div className="text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800/70 text-slate-300">
                  <span className="font-semibold text-slate-400">Objetivo:</span> {req.objective}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Solicitação de Campanha */}
      <CampaignRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={loadUserRequests}
        userId={userId}
      />

      {/* Modal Informativo: Ver Campanhas */}
      <Dialog
        open={viewCampaignsType !== null}
        onOpenChange={(open) => !open && setViewCampaignsType(null)}
      >
        <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              {viewCampaignsType === "afiliados" ? (
                <>
                  <Share2 className="w-5 h-5 text-indigo-400" />
                  <span>Campanhas para Afiliados</span>
                </>
              ) : (
                <>
                  <Users2 className="w-5 h-5 text-sky-400" />
                  <span>Monetização Coletiva</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              {viewCampaignsType === "afiliados"
                ? "Campanhas com recompensas atribuídas após a conclusão e validação dos critérios definidos."
                : "Campanhas de participação coletiva coordenadas para a comunidade de operadores."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-400 mx-auto">
              <Layers className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Novas campanhas nesta categoria estão a ser preparadas pela equipa de gestão.
            </p>
            <p className="text-[11px] text-slate-500 max-w-xs mx-auto">
              Você pode também submeter a sua própria proposta através do botão &quot;Solicitar Campanha&quot;.
            </p>
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setViewCampaignsType(null)}
              className="w-full border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-9 rounded-xl"
            >
              Fechar
            </Button>
            <Button
              type="button"
              onClick={() => {
                setViewCampaignsType(null);
                setIsRequestModalOpen(true);
              }}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-9 rounded-xl gap-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Solicitar Campanha
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
