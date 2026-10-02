import React from "react";
import { CheckCircle2, Clock, Calendar, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

interface UserHistorySectionProps {
  campaigns: any[];
}

export const UserHistorySection: React.FC<UserHistorySectionProps> = ({ campaigns }) => {
  const completedCampaigns = campaigns.filter((c) => c.assignment_status === "COMPLETED");

  return (
    <div className="space-y-8">
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Registro de Ganhos</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Sua trajetória de monetização na plataforma</p>
      </div>

      {completedCampaigns.length === 0 ? (
        <Card className="bg-white border-dashed border-2 border-slate-200 p-16 text-center rounded-3xl shadow-sm">
           <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckSquare className="w-8 h-8 text-slate-300" />
           </div>
          <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
            Nenhuma tarefa concluída até o momento.<br/>Comece a operar para ver seu histórico crescer.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {completedCampaigns.map((c) => (
            <Card
              key={c.id}
              className="bg-white border-none shadow-md hover:shadow-lg rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all overflow-hidden relative group"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 group-hover:w-2 transition-all" />
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-sm">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 tracking-tight leading-tight">{c.title}</h4>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5">
                    <Badge className="text-[9px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 border-none group-hover:bg-emerald-100 group-hover:text-emerald-700 transition-colors">
                      {c.platform}
                    </Badge>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-black uppercase tracking-tighter">
                      <Calendar className="w-3 h-3" />
                      Finalizado
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-6 sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-50">
                <div className="sm:hidden text-[9px] font-black text-slate-400 uppercase">Recompensa</div>
                <div>
                  <div className="text-lg font-black text-emerald-600 font-mono tracking-tighter">
                    +{Number(c.reward_amount).toLocaleString("pt-AO")} <span className="text-xs font-bold">Kz</span>
                  </div>
                  <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-0.5">Saldo Liquidado</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
