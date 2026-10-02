import React from "react";
import { CheckCircle2, Loader2, PlayCircle, Target, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserCampaignsSectionProps {
  campaigns: any[];
  confirmingId: string | null;
  executingId: string | null;
  onExecuteCampaign: (campaign: any) => void;
  onConfirmCompletion: (campaign: any) => void;
}

export const UserCampaignsSection: React.FC<UserCampaignsSectionProps> = ({
  campaigns,
  confirmingId,
  executingId,
  onExecuteCampaign,
  onConfirmCompletion,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Hub de Operações</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Gerencie e execute suas tarefas em tempo real</p>
      </div>

      {campaigns.length === 0 ? (
        <Card className="bg-white border-dashed border-2 border-slate-200 p-16 text-center rounded-3xl shadow-sm">
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
            Sem tarefas disponíveis na sua fila.<br/>Aguarde as próximas instruções da gestão.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {campaigns.map((c) => {
            const isDone = c.assignment_status === "COMPLETED";
            const isConfirming = confirmingId === c.id;

            return (
              <Card key={c.id} className={`bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden group transition-all ${isDone ? "opacity-70 grayscale-[0.5]" : "hover:shadow-2xl hover:shadow-slate-200/50"}`}>
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex justify-between items-center mb-2">
                    <Badge className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {c.platform}
                    </Badge>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      +{c.reward_amount.toLocaleString("pt-AO")} Kz
                    </span>
                  </div>
                  <CardTitle className="text-base font-black text-slate-900 tracking-tight leading-tight">{c.title}</CardTitle>
                  <CardDescription className="text-[11px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{c.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 px-6 pb-6 space-y-4">
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-3">
                    <div className="mt-0.5">
                       <Info className="w-4 h-4 text-emerald-500" />
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                      {c.instructions}
                    </p>
                  </div>
                  
                  {isDone ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-emerald-600 bg-emerald-50 py-3 rounded-2xl font-black uppercase tracking-widest">
                      <CheckCircle2 className="w-4 h-4" /> RECOMPENSA CREDITADA
                    </div>
                  ) : isConfirming ? (
                    <Button
                      size="sm"
                      onClick={() => onConfirmCompletion(c)}
                      disabled={executingId === c.id}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest h-11 rounded-2xl shadow-lg shadow-amber-100 animate-pulse gap-2"
                    >
                      {executingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <Target className="w-4 h-4" />
                          Confirmar Operação
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onExecuteCampaign(c)}
                      className="w-full bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest h-11 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95 gap-2"
                    >
                      <PlayCircle className="w-4 h-4" />
                      Iniciar Fluxo
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
