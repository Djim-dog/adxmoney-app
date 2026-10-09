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
          <Badge className="bg-emerald-50 text-emerald-600 border-none text-[10px] gap-1 py-1 font-black uppercase tracking-widest">
            <CheckCircle2 className="w-3 h-3" /> Aprovada
          </Badge>
        );
      case "rejeitada":
        return (
          <Badge className="bg-red-50 text-red-500 border-none text-[10px] gap-1 py-1 font-black uppercase tracking-widest">
            <XCircle className="w-3 h-3" /> Rejeitada
          </Badge>
        );
      case "pendente":
      default:
        return (
          <Badge className="bg-amber-50 text-amber-600 border-none text-[10px] gap-1 py-1 font-black uppercase tracking-widest">
            <Clock className="w-3 h-3" /> Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8">
      
      <div className="grid gap-6 sm:grid-cols-2">
        {/* ÁREA 1: CAMPANHAS PARA AFILIADOS */}
        <Card className="bg-white border-slate-100 relative overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50 rounded-3xl border-none shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 border border-emerald-100">
                <Share2 className="w-5 h-5" />
              </div>
              <Badge className="text-[10px] font-black uppercase tracking-widest border-none text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                AFILIADOS
              </Badge>
            </div>

            <CardTitle className="text-base font-black text-slate-900 mt-4">
              Campanhas Externas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 leading-relaxed font-medium">
              Ações dedicadas para partilha e expansão de marca. Ganhe bônus por cada conversão validada.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 pb-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] text-slate-500 flex items-start gap-2 font-bold uppercase tracking-tight">
              <Info className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Recompensas creditadas após verificação manual.
              </span>
            </div>
          </CardContent>

          <CardFooter className="pt-0 pb-6">
            <Button
              onClick={() => setViewCampaignsType("afiliados")}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs h-12 rounded-2xl shadow-lg shadow-emerald-100 transition-all gap-2"
            >
              EXPLORAR CAMPANHAS
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>

        {/* ÁREA 2: MONETIZAÇÃO COLETIVA */}
        <Card className="bg-white border-slate-100 relative overflow-hidden transition-all hover:shadow-xl hover:shadow-slate-200/50 rounded-3xl border-none shadow-md">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between gap-2">
              <div className="w-10 h-10 rounded-2xl bg-lime-50 flex items-center justify-center text-lime-700 border border-lime-100">
                <Users2 className="w-5 h-5" />
              </div>
              <Badge className="text-[10px] font-black uppercase tracking-widest border-none text-lime-800 bg-lime-200 px-3 py-1 rounded-full">
                COLETIVA
              </Badge>
            </div>

            <CardTitle className="text-base font-black text-slate-900 mt-4">
              Campanhas Coletivas
            </CardTitle>
            <CardDescription className="text-xs text-slate-500 leading-relaxed font-medium">
              Ações coletivas sincronizadas entre todos os membros da rede.
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-0 pb-4">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[10px] text-slate-500 flex items-start gap-2 font-bold uppercase tracking-tight">
              <Sparkles className="w-4 h-4 text-lime-600 shrink-0" />
              <span>
                Campanhas e metas sincronizadas em rede.
              </span>
            </div>
          </CardContent>

          <CardFooter className="pt-0 pb-6">
            <Button
              onClick={() => setViewCampaignsType("monetizacao_coletiva")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs h-12 rounded-2xl shadow-lg shadow-slate-200 transition-all gap-2"
            >
              VER OPORTUNIDADES
              <ChevronRight className="w-4 h-4" />
            </Button>
          </CardFooter>
        </Card>
      </div>

      {/* ÁREA 3: SOLICITAR CAMPANHA */}
      <Card className="bg-emerald-700 rounded-3xl border-none shadow-xl shadow-emerald-100 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 p-6 opacity-10 pointer-events-none">
          <Megaphone className="w-48 h-48 text-white rotate-12" />
        </div>
        <CardHeader className="pb-4">
          <div className="w-fit mb-2">
            <Badge className="bg-emerald-600/50 text-white border-none text-[10px] font-black uppercase tracking-widest py-1 px-3">
              NOVA PROPOSTA
            </Badge>
          </div>
          <CardTitle className="text-xl font-black text-white">
            Seja um Parceiro ADX
          </CardTitle>
          <CardDescription className="text-sm text-emerald-100 leading-relaxed font-medium">
            Tem um projeto ou campanha? Envie os detalhes e nossa gestão avaliará a viabilidade operacional.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-2 pb-8">
          <Button
            onClick={() => setIsRequestModalOpen(true)}
            className="w-full bg-white hover:bg-slate-50 text-emerald-700 font-black text-xs h-14 rounded-2xl shadow-xl shadow-emerald-800/20 gap-3"
          >
            <PlusCircle className="w-5 h-5" />
            SOLICITAR MINHA CAMPANHA
          </Button>
        </CardContent>
      </Card>

      {/* Minhas Solicitações */}
      {userRequests.length > 0 && (
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
              Acompanhamento de Propostas ({userRequests.length})
            </h3>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden divide-y divide-slate-50 shadow-sm">
            {userRequests.map((req) => (
              <div key={req.id} className="p-6 space-y-3 hover:bg-slate-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-black text-slate-900">{req.title}</span>
                      <Badge className="text-[9px] font-black uppercase tracking-widest border-none bg-slate-100 text-slate-400">
                        {req.type === "afiliados" ? "Afiliados" : "Coletiva"}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                      Enviado em {new Date(req.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>{getStatusBadge(req.status)}</div>
                </div>

                <p className="text-xs text-slate-500 font-medium leading-relaxed">{req.description}</p>

                <div className="text-[11px] bg-slate-50 p-4 rounded-2xl border border-slate-100 text-slate-600 font-medium">
                  <span className="font-black text-slate-400 uppercase tracking-tighter mr-2">Objetivo:</span> {req.objective}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal de Solicitação */}
      <CampaignRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => setIsRequestModalOpen(false)}
        onSuccess={loadUserRequests}
        userId={userId}
      />

      {/* Modal Informativo */}
      <Dialog
        open={viewCampaignsType !== null}
        onOpenChange={(open) => !open && setViewCampaignsType(null)}
      >
        <DialogContent className="max-w-md bg-white border-none sm:rounded-3xl p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-3">
              {viewCampaignsType === "afiliados" ? (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <span>Campanhas de Afiliados</span>
                </>
              ) : (
                <>
                  <div className="w-10 h-10 rounded-2xl bg-lime-50 flex items-center justify-center text-lime-600">
                    <Users2 className="w-5 h-5" />
                  </div>
                  <span>Monetização Coletiva</span>
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 font-medium pt-2">
              {viewCampaignsType === "afiliados"
                ? "Ganhe bônus por cada nova conversão validada pelo sistema operacional ADXmoney."
                : "Participe de ações coordenadas com a comunidade para desbloquear novos patamares de ganhos."}
            </DialogDescription>
          </DialogHeader>

          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-300 mx-auto">
              <Layers className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm text-slate-900 font-black uppercase tracking-tight">
                Em Preparação
              </p>
              <p className="text-xs text-slate-400 mt-2 font-medium max-w-xs mx-auto">
                Novas oportunidades estão sendo estruturadas pela nossa equipe e estarão disponíveis em breve.
              </p>
            </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => {
                setViewCampaignsType(null);
                setIsRequestModalOpen(true);
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-2xl shadow-lg shadow-emerald-100 gap-2 uppercase text-xs tracking-widest"
            >
              <PlusCircle className="w-4 h-4" />
              SOLICITAR CAMPANHA
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setViewCampaignsType(null)}
              className="w-full text-slate-400 hover:text-slate-600 hover:bg-slate-50 font-black h-12 rounded-2xl uppercase text-xs tracking-widest"
            >
              FECHAR
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
