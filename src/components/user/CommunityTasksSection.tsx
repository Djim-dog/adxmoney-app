import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Layers,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Instagram,
  Youtube,
  MoreVertical,
  Flag,
  Info,
  Video,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  DialogDescription,
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

export const CommunityTasksSection: React.FC = () => {
  const [tasks, setTasks] = useState<CommunityTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [dailyLimit, setDailyLimit] = useState({ current: 0, max: 20 });
  const [reportingTask, setReportingTask] = useState<CommunityTask | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [isReporting, setIsReporting] = useState(false);

  const loadTasks = async () => {
    setLoading(true);
    try {
      // 1. Fetch or assign tasks
      const { data, error } = await supabase.rpc('fetch_or_assign_community_tasks');
      if (error) throw error;
      setTasks(data || []);

      // 2. Fetch daily progress
      const { data: limitData } = await supabase
        .from('community_settings')
        .select('value')
        .eq('key', 'daily_limits')
        .single();
      
      const max = limitData?.value?.max_tasks_per_day || 20;

      const { count } = await supabase
        .from('task_distribution_queue')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .eq('status', 'completed')
        .gte('completed_at', new Date().toISOString().split('T')[0]);

      setDailyLimit({ current: count || 0, max });
    } catch (err: any) {
      console.error("Erro ao carregar tarefas:", err);
      toast.error("Erro ao carregar tarefas comunitárias.");
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
      
      toast.success("Tarefa marcada como concluída!");
      loadTasks();
    } catch (err: any) {
      toast.error("Erro ao concluir tarefa: " + err.message);
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

      toast.success("Tarefa reportada. Ela será removida da sua lista.");
      setReportingTask(null);
      setReportReason("");
      loadTasks();
    } catch (err: any) {
      toast.error("Erro ao reportar tarefa: " + err.message);
    } finally {
      setIsReporting(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'tiktok': return <Video className="w-4 h-4 text-cyan-400" />;
      case 'instagram': return <Instagram className="w-4 h-4 text-pink-500" />;
      case 'youtube': return <Youtube className="w-4 h-4 text-red-600" />;
      default: return <Layers className="w-4 h-4" />;
    }
  };

  const getTaskTypeText = (type: string) => {
    switch (type) {
      case 'follow': return 'Seguir Perfil';
      case 'like': return 'Curtir Publicação';
      case 'comment': return 'Comentar';
      case 'view': return 'Visualizar';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Sincronizando tarefas operacionais...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header & Progress */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Tarefas Comunitárias</h2>
          <p className="text-xs text-slate-400 mt-1">Execute tarefas rápidas para fortalecer a comunidade.</p>
        </div>

        <Card className="bg-slate-900 border-slate-800 p-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Progresso Diário</span>
            <span className="text-xs font-mono font-bold text-indigo-400">{dailyLimit.current} / {dailyLimit.max}</span>
          </div>
          <Progress value={(dailyLimit.current / dailyLimit.max) * 100} className="h-1.5 bg-slate-800" />
          <p className="text-[9px] text-slate-500 mt-2 flex items-center gap-1">
            <Info className="w-3 h-3" /> Tarefas comunitárias não geram recompensa financeira direta imediata.
          </p>
        </Card>
      </div>

      {tasks.length === 0 ? (
        <Card className="bg-slate-900/40 border-dashed border-slate-800 py-16 text-center">
          <Layers className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
          <p className="text-sm text-slate-500 font-medium">Nenhuma tarefa disponível no momento.</p>
          <p className="text-[10px] text-slate-600 mt-1">Tente novamente mais tarde ou verifique suas redes sociais.</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id} className="bg-slate-900 border-slate-800 hover:border-slate-700 transition-all overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-slate-800 border border-slate-700">
                      {getPlatformIcon(task.platform)}
                    </div>
                    <div>
                      <Badge variant="outline" className="text-[10px] uppercase border-slate-700 text-slate-400 py-0 h-4">
                        {task.platform}
                      </Badge>
                      <CardTitle className="text-sm font-bold text-white mt-1">
                        {getTaskTypeText(task.task_type)}
                      </CardTitle>
                    </div>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-500">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-300">
                      <DropdownMenuItem 
                        className="text-rose-400 focus:text-rose-400 focus:bg-rose-400/10 cursor-pointer gap-2"
                        onClick={() => setReportingTask(task)}
                      >
                        <Flag className="w-3.5 h-3.5" /> Denunciar problema
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="pb-4">
                <p className="text-xs text-slate-400 line-clamp-2">
                  {task.description || `Abra o perfil e realize a ação de ${getTaskTypeText(task.task_type)} para validar a tarefa.`}
                </p>
              </CardContent>

              <CardFooter className="bg-slate-950/40 p-3 border-t border-slate-800 flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1 border-slate-800 bg-slate-900 text-slate-300 hover:bg-slate-800 text-xs h-9 rounded-xl gap-2"
                  asChild
                >
                  <a href={task.profile_url} target="_blank" rel="noreferrer">
                    Abrir Link <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </Button>
                <Button 
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 rounded-xl gap-2 shadow-lg shadow-emerald-950/20"
                  onClick={() => handleComplete(task.task_id)}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Concluir
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de Denúncia */}
      <Dialog open={!!reportingTask} onOpenChange={(open) => !open && setReportingTask(null)}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-white flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-500" />
              Denunciar Tarefa
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400">
              Informe o motivo pelo qual não foi possível realizar esta tarefa (ex: link quebrado, perfil privado, etc).
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Textarea
              placeholder="Descreva o problema aqui..."
              className="bg-slate-950 border-slate-800 text-sm focus:ring-rose-500/20 min-h-[100px]"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
            />
          </div>

          <DialogFooter className="flex gap-2 sm:gap-0">
            <Button 
              variant="outline" 
              onClick={() => setReportingTask(null)}
              className="flex-1 border-slate-800 bg-slate-900 text-slate-400 hover:bg-slate-800 text-xs h-10 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              disabled={isReporting || !reportReason.trim()}
              onClick={handleReport}
              className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs h-10 rounded-xl"
            >
              {isReporting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar Denúncia"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
