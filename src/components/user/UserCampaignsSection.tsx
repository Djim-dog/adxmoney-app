import React from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
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
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">Todas as Minhas Tarefas</h2>
        <p className="text-xs text-slate-400">Conclua o fluxo indicado para receber a bonificação real.</p>
      </div>

      {campaigns.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-500">
          Nenhuma campanha atribuída.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {campaigns.map((c) => {
            const isDone = c.assignment_status === "COMPLETED";
            const isConfirming = confirmingId === c.id;

            return (
              <Card key={c.id} className={`bg-slate-900 border ${isDone ? "border-slate-800 opacity-60" : "border-slate-700"}`}>
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
                  <CardDescription className="text-xs text-slate-400">{c.description}</CardDescription>
                </CardHeader>
                <CardContent className="pt-0 space-y-2">
                  <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                    {c.instructions}
                  </p>
                  {isDone ? (
                    <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 py-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Concluída
                    </div>
                  ) : isConfirming ? (
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
                      Iniciar e Concluir
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
