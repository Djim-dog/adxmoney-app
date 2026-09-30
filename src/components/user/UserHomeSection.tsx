import React from "react";
import { ArrowUpRight, Copy, Loader2 } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Painel Operacional</h2>
        <p className="text-xs text-slate-400">Resumo da sua conta e tarefas disponíveis.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Saldo Disponível</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400 font-mono">
              {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <Button
              size="sm"
              onClick={onOpenWithdraw}
              disabled={(wallet?.balance || 0) <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg"
            >
              <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
              Solicitar Saque
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Saldo Reservado (Em Saque)</CardDescription>
            <CardTitle className="text-2xl font-bold text-amber-400 font-mono">
              {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-500">
            Valor retido aguardando processamento bancário.
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Programa de Convite</CardDescription>
            <CardTitle className="text-base font-bold text-sky-400 font-mono">
              {affiliate?.affiliate_code || "Inativo"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-[11px] text-slate-400">
            {affiliate ? (
              <div className="flex items-center justify-between">
                <span>{affiliate.total_referrals} indicações</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCopyText(affiliate.affiliate_code, "Código")}
                  className="h-6 text-[10px] px-2 border-slate-800"
                >
                  <Copy className="w-2.5 h-2.5 mr-1" /> Copiar
                </Button>
              </div>
            ) : (
              "Solicite ativação ao administrador."
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Tarefas Pendentes de Execução</h3>
        {pendingCampaigns.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 p-6 text-center text-xs text-slate-500">
            Nenhuma tarefa atribuída no momento. Novas atividades serão liberadas pelo administrador.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingCampaigns.slice(0, 4).map((c) => (
              <Card key={c.id} className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <Badge className="text-[10px] bg-slate-950 text-slate-300 border-slate-800">
                      {c.platform}
                    </Badge>
                    <span className="text-xs font-bold text-emerald-400">
                      +{c.reward_amount.toLocaleString("pt-AO")} Kz
                    </span>
                  </div>
                  <CardTitle className="text-sm font-bold text-white mt-1">{c.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  {confirmingId === c.id ? (
                    <Button
                      size="sm"
                      onClick={() => onConfirmCompletion(c)}
                      disabled={executingId === c.id}
                      className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 rounded-lg animate-pulse"
                    >
                      {executingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar Conclusão"}
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => onExecuteCampaign(c)}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg"
                    >
                      Executar Tarefa
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
