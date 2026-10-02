import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  ExternalLink,
  Loader2,
  Instagram,
  Youtube,
  MoreVertical,
  Flag,
  Video,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface CommunityTask {
  id: string;
  task_id: string;
  platform: 'tiktok' | 'instagram' | 'youtube' | 'other';
  task_type: 'follow' | 'like' | 'comment' | 'view';
  profile_url: string;
  description: string;
  status: string;
}

interface Platform {
  id: 'tiktok' | 'instagram' | 'youtube';
  label: string;
  icon: React.ReactNode;
}

export const CommunityTasksSection: React.FC = () => {
  const [tasks, setTasks] = useState<CommunityTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePlatform, setActivePlatform] = useState<'tiktok' | 'instagram' | 'youtube'>('tiktok');
  
  // Daily limits state mapped by platform
  const [limits, setLimits] = useState<Record<string, { current: number, max: number }>>({
    tiktok: { current: 0, max: 100 },
    instagram: { current: 0, max: 100 },
    youtube: { current: 0, max: 100 }
  });

  const [reportingTask, setReportingTask] = useState<CommunityTask | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const platforms: Platform[] = [
    { id: 'tiktok', label: 'TikTok', icon: <img src="/icons/tiktok.jpg" alt="TikTok" className="w-6 h-6 rounded-lg object-cover shadow-sm" /> },
    { id: 'instagram', label: 'Instagram', icon: <img src="/icons/instagram.jpg" alt="Instagram" className="w-6 h-6 rounded-lg object-cover shadow-sm" /> },
    { id: 'youtube', label: 'YouTube', icon: <img src="/icons/youtube.jpg" alt="YouTube" className="w-6 h-6 rounded-lg object-cover shadow-sm" /> }
  ];

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('fetch_or_assign_community_tasks');
      if (error) throw error;
      
      const loadedTasks = data || [];
      setTasks(loadedTasks);

      // Obter limites configurados de forma totalmente segura e tolerante a falhas
      let configuredLimits = { tiktok: 100, instagram: 100, youtube: 100 };
      try {
        const { data: limitData } = await supabase
          .from('community_settings')
          .select('value')
          .eq('key', 'daily_limits')
          .maybeSingle();
        if (limitData && limitData.value) {
          configuredLimits = { ...configuredLimits, ...(limitData.value as any) };
        }
      } catch (e) {
        console.warn("Usando limites padrão por indisponibilidade de settings:", e);
      }

      // Calcular contagem de tarefas atuais diretamente a partir da RPC ou dados locais
      const counts: Record<string, number> = { tiktok: 0, instagram: 0, youtube: 0 };
      
      // Contar com base nas tarefas retornadas ou numa contagem simples na queue do usuário
      const userId = (await supabase.auth.getUser()).data.user?.id;
      if (userId) {
        const todayStr = new Date().toLocaleDateString('en-CA');
        const { data: queueCountData, error: qError } = await supabase
          .from('task_distribution_queue')
          .select('id, assigned_at, task_id')
          .eq('user_id', userId)
          .gte('assigned_at', todayStr + 'T00:00:00');

        if (!qError && queueCountData && queueCountData.length > 0) {
          // Vamos buscar a plataforma de cada task_id na tabela community_tasks em lote
          const tIds = queueCountData.map((q: any) => q.task_id).filter(Boolean);
          if (tIds.length > 0) {
            const { data: tData } = await supabase
              .from('community_tasks')
              .select('id, platform')
              .in('id', tIds);

            if (tData) {
              const platformMap = new Map(tData.map((t: any) => [t.id, t.platform?.toLowerCase()]));
              queueCountData.forEach((q: any) => {
                const plat = platformMap.get(q.task_id);
                if (plat && counts[plat] !== undefined) {
                  counts[plat]++;
                }
              });
            }
          }
        }
      }

      setLimits({
        tiktok: { current: counts.tiktok, max: configuredLimits.tiktok },
        instagram: { current: counts.instagram, max: configuredLimits.instagram },
        youtube: { current: counts.youtube, max: configuredLimits.youtube }
      });

    } catch (err: any) {
      console.error("Erro ao carregar tarefas:", err);
      // Não bloqueia a UI com toast de erro agressivo se for falha de rede/sincronismo menor
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const handleComplete = async (taskId: string) => {
    try {
      const { error } = await supabase.rpc('complete_community_task', { p_task_id: taskId });
      if (error) throw error;
      toast.success("Tarefa concluída!");
      loadTasks();
    } catch (err: any) {
      toast.error("Erro ao concluir: " + err.message);
    }
  };

  const handleReport = async () => {
    if (!reportingTask || !reportReason.trim()) return;
    setIsReporting(true);
    try {
      const { error } = await supabase.rpc('report_community_task', { 
        p_task_id: reportingTask.task_id, 
        p_reason: reportReason 
      });
      if (error) throw error;
      toast.success("Denúncia enviada.");
      setReportingTask(null);
      setReportReason("");
      loadTasks();
    } catch (err: any) {
      toast.error("Erro ao denunciar: " + err.message);
    } finally {
      setIsReporting(false);
    }
  };

  const filteredTasks = tasks.filter(t => t.platform?.toLowerCase() === activePlatform.toLowerCase());

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-emerald-600 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Abas de Plataforma */}
      <div className="flex bg-white rounded-2xl p-1 border border-slate-200 shadow-sm">
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${
              activePlatform === p.id ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "text-slate-400 hover:text-slate-600"
            }`}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Contador e Progresso */}
      <div className="bg-white border border-slate-100 rounded-3xl p-5 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Limite Diário {platforms.find(p => p.id === activePlatform)?.label}</span>
          <span className="text-xs font-mono font-black text-emerald-600">{limits[activePlatform].current} / {limits[activePlatform].max}</span>
        </div>
        <Progress value={(limits[activePlatform].current / limits[activePlatform].max) * 100} className="h-2 bg-slate-100 rounded-full" />
      </div>

      {limits[activePlatform].current >= limits[activePlatform].max ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm italic text-slate-400 text-xs font-medium uppercase tracking-tight">Limite de {activePlatform} atingido por hoje.</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-100 rounded-3xl shadow-sm italic text-slate-400 text-xs font-medium uppercase tracking-tight">Nenhuma tarefa disponível nesta plataforma.</div>
      ) : (
        <div className="grid gap-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="bg-white border-none shadow-md rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-slate-200/50 transition-all">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-sm">
                      {task.platform === 'tiktok' && <img src="/icons/tiktok.jpg" alt="TikTok" className="w-full h-full object-cover rounded-lg" />}
                      {task.platform === 'instagram' && <img src="/icons/instagram.jpg" alt="Instagram" className="w-full h-full object-cover rounded-lg" />}
                      {task.platform === 'youtube' && <img src="/icons/youtube.jpg" alt="YouTube" className="w-full h-full object-cover rounded-lg" />}
                    </div>
                    <Badge className="bg-emerald-50 text-emerald-600 border-none px-3 py-1 font-black text-[9px] uppercase tracking-widest">
                       {task.task_type}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                       <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-50">
                          <MoreVertical className="w-4 h-4" />
                       </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-white border-slate-100 rounded-2xl shadow-xl">
                      <DropdownMenuItem className="text-red-500 font-bold text-xs" onClick={() => setReportingTask(task)}>
                         <Flag className="w-3 h-3 mr-2" /> Denunciar Problema
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-0 text-sm text-slate-500 font-medium leading-relaxed">
                 {task.description}
              </CardContent>
              <CardFooter className="p-5 pt-0 flex gap-3">
                <Button variant="outline" className="flex-1 h-11 rounded-2xl border-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest hover:bg-slate-50" asChild>
                   <a href={task.profile_url} target="_blank" rel="noreferrer">
                      ABRIR PERFIL <ExternalLink className="w-3 h-3 ml-2" />
                   </a>
                </Button>
                <Button className="flex-1 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-100" onClick={() => handleComplete(task.task_id)}>
                   CONFIRMAR
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={!!reportingTask} onOpenChange={(open) => !open && setReportingTask(null)}>
        <DialogContent className="bg-white border-none sm:rounded-3xl p-8 shadow-2xl">
          <DialogHeader>
             <DialogTitle className="text-lg font-black text-slate-900">Denunciar Tarefa</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <Textarea 
               className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 rounded-2xl min-h-[120px] font-medium text-slate-600" 
               value={reportReason} 
               onChange={(e) => setReportReason(e.target.value)} 
               placeholder="Descreva o motivo da denúncia..." 
             />
          </div>
          <DialogFooter className="flex gap-3">
            <Button variant="ghost" onClick={() => setReportingTask(null)} className="flex-1 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400">
               CANCELAR
            </Button>
            <Button onClick={handleReport} disabled={isReporting} className="flex-1 h-12 rounded-2xl bg-red-500 hover:bg-red-600 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100">
               {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "ENVIAR DENÚNCIA"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
