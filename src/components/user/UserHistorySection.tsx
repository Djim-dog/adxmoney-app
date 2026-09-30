import React from "react";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface UserHistorySectionProps {
  campaigns: any[];
}

export const UserHistorySection: React.FC<UserHistorySectionProps> = ({ campaigns }) => {
  const completedCampaigns = campaigns.filter((c) => c.assignment_status === "COMPLETED");

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-white">Histórico de Conclusões</h2>
        <p className="text-xs text-slate-400">Tarefas e campanhas validadas com recompensas pagas.</p>
      </div>

      {completedCampaigns.length === 0 ? (
        <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-500">
          Você ainda não concluiu nenhuma tarefa. Execute campanhas disponíveis para ganhar saldo.
        </Card>
      ) : (
        <div className="space-y-2">
          {completedCampaigns.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-950 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-white">{c.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge className="text-[9px] bg-slate-950 text-slate-400 border-slate-800 py-0">
                      {c.platform}
                    </Badge>
                    <span className="text-[10px] text-slate-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Concluído
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-emerald-400 font-mono">
                  +{Number(c.reward_amount).toLocaleString("pt-AO")} Kz
                </div>
                <div className="text-[10px] text-slate-500">Creditado na Carteira</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
