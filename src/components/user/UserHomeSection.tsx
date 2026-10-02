import React from "react";
import { ArrowUpRight, Copy, Loader2, Wallet, Users, Target, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserHomeSectionProps {
  wallet: { balance: number; reserved_balance: number } | null;
  affiliate: { affiliate_code: string; total_referrals: number } | null;
  campaigns: any[];
  confirmingId: string | null;
  executingId: string | null;
  onOpenWithdraw: () => void;
  onExecuteCampaign: (campaign: any) => void;
  onConfirmCompletion: (campaign: any) => void;
  onCopyText: (text: string, label: string) => void;
}

export const UserHomeSection: React.FC<UserHomeSectionProps> = ({
  wallet,
  affiliate,
  campaigns,
  confirmingId,
  executingId,
  onOpenWithdraw,
  onExecuteCampaign,
  onConfirmCompletion,
  onCopyText,
}) => {
  const pendingCampaigns = campaigns.filter((c) => c.assignment_status !== "COMPLETED");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Painel Operacional</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Visão geral do seu desempenho financeiro</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden group">
          <CardHeader className="pb-4 pt-6 px-6">
            <div className="flex items-center justify-between mb-4">
               <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Wallet className="w-5 h-5" />
               </div>
               <Badge className="bg-emerald-100 text-emerald-700 border-none font-black text-[9px] uppercase tracking-widest px-2">Disponível</Badge>
            </div>
            <CardTitle className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
              {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 0 })} <span className="text-sm font-bold text-slate-400">Kz</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            <Button
              size="sm"
              onClick={onOpenWithdraw}
              disabled={(wallet?.balance || 0) <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest h-11 rounded-2xl shadow-lg shadow-emerald-100 transition-all active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 mr-2" />
              Solicitar Levantamento
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
             <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                   <Target className="w-5 h-5" />
                </div>
                <Badge className="bg-amber-100 text-amber-700 border-none font-black text-[9px] uppercase tracking-widest px-2">Retido</Badge>
             </div>
             <CardTitle className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
               {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 0 })} <span className="text-sm font-bold text-slate-400">Kz</span>
             </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6 text-[10px] text-slate-400 font-bold uppercase tracking-tight leading-relaxed">
            Valor em processamento bancário ou auditoria de tarefas.
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden">
          <CardHeader className="pb-4 pt-6 px-6">
             <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                   <Users className="w-5 h-5" />
                </div>
                <Badge className="bg-sky-100 text-sky-700 border-none font-black text-[9px] uppercase tracking-widest px-2">Afiliado</Badge>
             </div>
             <CardTitle className="text-xl font-black text-slate-900 font-mono tracking-widest uppercase">
               {affiliate?.affiliate_code || "INATIVO"}
             </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 px-6 pb-6">
            {affiliate ? (
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{affiliate.total_referrals} Indicados</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onCopyText(affiliate.affiliate_code, "Código")}
                  className="h-9 text-[10px] font-black uppercase tracking-widest px-3 border border-slate-100 hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 rounded-xl transition-all"
                >
                  <Copy className="w-3.5 h-3.5 mr-2" /> Copiar
                </Button>
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">Solicite ativação ao administrador.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Atividades Prioritárias</h3>
          <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase px-2 py-0.5">{pendingCampaigns.length} pendentes</Badge>
        </div>

        {pendingCampaigns.length === 0 ? (
          <Card className="bg-slate-50 border-dashed border-2 border-slate-200 p-12 text-center rounded-3xl">
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
              Nenhuma tarefa atribuída no momento.<br/>Aguarde as próximas liberações.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingCampaigns.slice(0, 4).map((c) => (
              <Card key={c.id} className="bg-white border-none shadow-md hover:shadow-xl hover:shadow-slate-200/50 rounded-3xl transition-all group overflow-hidden">
                <CardHeader className="pb-4 pt-6 px-6">
                  <div className="flex justify-between items-center mb-2">
                    <Badge className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                      {c.platform}
                    </Badge>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      +{c.reward_amount.toLocaleString("pt-AO")} Kz
                    </span>
                  </div>
                  <CardTitle className="text-sm font-black text-slate-900 tracking-tight leading-tight">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 px-6 pb-6">
                  {confirmingId === c.id ? (
                    <Button
                      size="sm"
                      onClick={() => onConfirmCompletion(c)}
                      disabled={executingId === c.id}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black uppercase tracking-widest h-10 rounded-2xl shadow-lg shadow-amber-100 animate-pulse gap-2"
                    >
                      {executingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmar Conclusão
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onExecuteCampaign(c)}
                      className="w-full bg-slate-900 hover:bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest h-10 rounded-2xl shadow-lg shadow-slate-200 transition-all active:scale-95"
                    >
                      Executar Agora
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
