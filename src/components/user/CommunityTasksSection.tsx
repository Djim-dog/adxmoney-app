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
    { id: 'tiktok', label: 'TikTok', icon: <Video className="w-4 h-4" /> },
    { id: 'instagram', label: 'Instagram', icon: <Instagram className="w-4 h-4" /> },
    { id: 'youtube', label: 'YouTube', icon: <Youtube className="w-4 h-4" /> }
  ];

  const loadTasks = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('fetch_or_assign_community_tasks');
      if (error) throw error;
      setTasks(data || []);

      const { data: limitData } = await supabase
        .from('community_settings')
        .select('value')
        .eq('key', 'daily_limits')
        .single();
      
      const configuredLimits = limitData?.value || { tiktok: 100, instagram: 100, youtube: 100 };

      const { data: queueData } = await supabase
        .from('task_distribution_queue')
        .select(`
          task_id,
          community_tasks(platform)
        `)
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .gte('assigned_at', new Date().toISOString().split('T')[0]);

      const newLimits = { ...limits };
      platforms.forEach(p => {
        const count = queueData?.filter(q => q.community_tasks?.platform === p.id).length || 0;
        newLimits[p.id] = { current: count, max: configuredLimits[p.id] || 100 };
      });
      setLimits(newLimits);

    } catch (err: any) {
      console.error("Erro ao carregar tarefas:", err);
      toast.error("Erro ao sincronizar tarefas.");
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

  const filteredTasks = tasks.filter(t => t.platform === activePlatform);

  if (loading) return <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 text-indigo-500 animate-spin" /></div>;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Abas de Plataforma */}
      <div className="flex bg-slate-900 rounded-xl p-1 border border-slate-800">
        {platforms.map(p => (
          <button
            key={p.id}
            onClick={() => setActivePlatform(p.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              activePlatform === p.id ? "bg-indigo-600 text-white shadow-lg" : "text-slate-500"
            }`}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      {/* Contador e Progresso */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-slate-500 uppercase">Limite Diário {platforms.find(p => p.id === activePlatform)?.label}</span>
          <span className="text-xs font-mono font-bold text-indigo-400">{limits[activePlatform].current} / {limits[activePlatform].max}</span>
        </div>
        <Progress value={(limits[activePlatform].current / limits[activePlatform].max) * 100} className="h-1.5" />
      </div>

      {limits[activePlatform].current >= limits[activePlatform].max ? (
        <div className="text-center py-10 text-slate-500 text-xs italic">Limite de {activePlatform} atingido para hoje.</div>
      ) : filteredTasks.length === 0 ? (
        <div className="text-center py-10 text-slate-500 text-xs italic">Nenhuma tarefa disponível nesta plataforma.</div>
      ) : (
        <div className="grid gap-3">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="bg-slate-900 border-slate-800">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-sm font-bold text-white capitalize">{task.task_type}</CardTitle>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-900 border-slate-800">
                      <DropdownMenuItem className="text-rose-400" onClick={() => setReportingTask(task)}><Flag className="w-3 h-3 mr-2" /> Denunciar</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 text-xs text-slate-400">{task.description}</CardContent>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button variant="outline" className="flex-1 h-9 rounded-lg" asChild><a href={task.profile_url} target="_blank" rel="noreferrer">Abrir <ExternalLink className="w-3 h-3 ml-1" /></a></Button>
                <Button className="flex-1 h-9 rounded-lg bg-emerald-600" onClick={() => handleComplete(task.task_id)}>Concluir</Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Report Dialog */}
      <Dialog open={!!reportingTask} onOpenChange={(open) => !open && setReportingTask(null)}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader><DialogTitle>Denunciar Tarefa</DialogTitle></DialogHeader>
          <Textarea className="bg-slate-950 border-slate-800" value={reportReason} onChange={(e) => setReportReason(e.target.value)} placeholder="Motivo..." />
          <DialogFooter><Button onClick={handleReport} disabled={isReporting}>Enviar</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
