import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  Send, 
  Loader2, 
  DollarSign, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Users,
  Target,
  Clock,
  Layers,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { toast } from "sonner";

interface CampaignRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

export const CampaignRequestModal: React.FC<CampaignRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState("Instagram");
  const [targetUrl, setTargetUrl] = useState("");
  const [actionType, setActionType] = useState("follow");
  const [objective, setObjective] = useState("");
  const [description, setDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("Geral");
  const [requesterPhone, setRequesterPhone] = useState("");

  // Moeda para pagamento dos 10 USD
  const [currency, setCurrency] = useState<"USD" | "AOA" | "EUR" | "BRL">("USD");

  const exchangeRates = {
    USD: 1,
    AOA: 920,
    EUR: 0.92,
    BRL: 5.60,
  };

  const currencySymbols = {
    USD: "$",
    AOA: "Kz",
    EUR: "€",
    BRL: "R$",
  };

  const costUSD = 10;
  const costInSelectedCurrency = costUSD * exchangeRates[currency];

  const resetForm = () => {
    setTitle("");
    setPlatform("Instagram");
    setTargetUrl("");
    setActionType("follow");
    setObjective("");
    setDescription("");
    setTargetAudience("Geral");
    setRequesterPhone("");
    setStep(1);
  };

  const handleNext = () => {
    if (step === 1) {
      if (!title.trim() || !targetUrl.trim() || !objective.trim()) {
        toast.error("Por favor, preencha todos os campos obrigatórios da Etapa 1.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!description.trim()) {
        toast.error("Descreva as orientações para a comunidade.");
        return;
      }
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      toast.error("Erro de identificação do utilizador.");
      return;
    }

    setSubmitting(true);
    try {
      const fullDescription = `[Campanha Coletiva - Custo: ${costUSD} USD (${costInSelectedCurrency.toLocaleString()} ${currencySymbols[currency]}) | Plataforma: ${platform} | Ação: ${actionType} | Público: ${targetAudience}] ${description}`;

      const { error } = await supabase.from("campaign_requests").insert({
        user_id: userId,
        title: title.trim(),
        type: "monetizacao_coletiva", // Estritamente coletiva
        objective: objective.trim(),
        description: fullDescription,
        additional_information: JSON.stringify({
          platform,
          target_url: targetUrl.trim(),
          action_type: actionType,
          target_audience: targetAudience,
          requester_phone: requesterPhone.trim(),
          cost_usd: costUSD,
          paid_currency: currency,
          cost_formatted: `${costInSelectedCurrency.toLocaleString()} ${currencySymbols[currency]}`,
          estimated_reach: "1.000 a 5.000 membros ativos",
          estimated_completion: "24h a 48h após aprovação"
        }),
        status: "pendente",
      });

      if (error) throw error;

      toast.success("Solicitação de Campanha enviada com sucesso! O administrador avaliará em breve.");
      resetForm();
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao enviar solicitação de campanha:", err);
      toast.error(err.message || "Erro ao processar solicitação.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) resetForm(); onClose(); }}>
      <DialogContent className="max-w-xl bg-white border-none sm:rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-100 pb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              Campanha Coletiva
            </Badge>
            <div className="flex items-center gap-1.5 text-xs font-black text-slate-400">
              <span className={step >= 1 ? "text-emerald-600 font-black" : ""}>1. Dados</span>
              <span>•</span>
              <span className={step >= 2 ? "text-emerald-600 font-black" : ""}>2. Detalhes</span>
              <span>•</span>
              <span className={step === 3 ? "text-emerald-600 font-black" : ""}>3. Revisão & Taxa</span>
            </div>
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            Solicitar Campanha Coletiva
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            Envie sua proposta de ação para a comunidade. O projeto custa uma taxa fixa de 10 USD e passa por análise do administrador antes de ser ativado.
          </DialogDescription>
        </DialogHeader>

        {/* ETAPA 1: DADOS BÁSICOS */}
        {step === 1 && (
          <div className="space-y-4 py-4 animate-in fade-in duration-200">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Título da Campanha *</Label>
              <Input
                placeholder="Ex: Impulsionamento de Seguidores para Loja de Roupas"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-11 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Plataforma Social *</Label>
                <Select value={platform} onValueChange={setPlatform}>
                  <SelectTrigger className="h-11 rounded-xl text-xs font-semibold">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Instagram">Instagram</SelectItem>
                    <SelectItem value="TikTok">TikTok</SelectItem>
                    <SelectItem value="YouTube">YouTube</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Tipo de Ação *</Label>
                <Select value={actionType} onValueChange={setActionType}>
                  <SelectTrigger className="h-11 rounded-xl text-xs font-semibold">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="follow">Seguir Perfil</SelectItem>
                    <SelectItem value="like">Curtir / Interagir</SelectItem>
                    <SelectItem value="subscribe">Inscrever-se no Canal</SelectItem>
                    <SelectItem value="share">Compartilhar Publicação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Link de Destino / Perfil *</Label>
              <Input
                placeholder="https://instagram.com/seu_perfil ou https://tiktok.com/@canal"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="h-11 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Objetivo Principal *</Label>
              <Input
                placeholder="Ex: Alcançar 2.000 seguidores e aumentar autoridade de marca"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                className="h-11 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="button"
                onClick={handleNext}
                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider gap-2 shadow-md shadow-emerald-100"
              >
                Avançar para Detalhes
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 2: DETALHES & ORIENTAÇÕES */}
        {step === 2 && (
          <div className="space-y-4 py-4 animate-in fade-in duration-200">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Público-Alvo</Label>
                <Select value={targetAudience} onValueChange={setTargetAudience}>
                  <SelectTrigger className="h-11 rounded-xl text-xs font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geral">Geral (Todos os membros)</SelectItem>
                    <SelectItem value="Angola">Angola</SelectItem>
                    <SelectItem value="Brasil">Brasil</SelectItem>
                    <SelectItem value="Portugal">Portugal</SelectItem>
                    <SelectItem value="Moçambique">Moçambique</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">WhatsApp / Telefone para Contato</Label>
                <Input
                  placeholder="+244 9..."
                  value={requesterPhone}
                  onChange={(e) => setRequesterPhone(e.target.value)}
                  className="h-11 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Instruções para os Membros da Comunidade *</Label>
              <Textarea
                placeholder="Ex: Os membros devem acessar o link, seguir o perfil, curtir as últimas 3 publicações e não deixar de seguir nos primeiros 30 dias."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="rounded-xl text-xs font-medium resize-none"
              />
            </div>

            {/* Estimativa Profissional */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-black text-slate-800">
                <Target className="w-4 h-4 text-emerald-600" />
                <span>Estimativas do Sistema</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-1">
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Alcance Estimado:</span>
                  <span className="font-black text-slate-800">1.000 a 5.000 membros</span>
                </div>
                <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] font-bold uppercase">Prazo de Execução:</span>
                  <span className="font-black text-slate-800">24h a 48h pós-aprovação</span>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="h-11 px-4 rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleNext}
                className="h-11 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider gap-2 shadow-md shadow-emerald-100"
              >
                Avançar para Revisão
                <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* ETAPA 3: REVISÃO, TAXA DE 10 USD E SUBMISSÃO */}
        {step === 3 && (
          <div className="space-y-4 py-4 animate-in fade-in duration-200">
            {/* Moeda de Pagamento */}
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-800 uppercase tracking-tight">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Taxa de Solicitação e Moderação</span>
                </div>
                <Select value={currency} onValueChange={(val: any) => setCurrency(val)}>
                  <SelectTrigger className="w-28 h-8 rounded-lg bg-white border-emerald-200 text-xs font-black text-emerald-800">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="AOA">AOA (Kz)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                    <SelectItem value="BRL">BRL (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <span className="text-xs font-medium text-emerald-700">Valor Fixo da Campanha:</span>
                <span className="text-2xl font-black text-emerald-950">
                  {costInSelectedCurrency.toLocaleString()} {currencySymbols[currency]}
                  <span className="text-xs font-bold text-emerald-600 ml-1">({costUSD} USD)</span>
                </span>
              </div>
              <p className="text-[10px] text-emerald-600 font-medium mt-1">
                * A campanha será avaliada pela moderação ADXmoney. Se for aprovada, entrará diretamente na rotação de tarefas coletivas.
              </p>
            </div>

            {/* Resumo da Campanha */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Título:</span>
                <span className="font-bold text-slate-800 text-right max-w-xs truncate">{title}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Plataforma / Ação:</span>
                <span className="font-bold text-slate-800">{platform} • {actionType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Destino:</span>
                <span className="font-bold text-emerald-600 max-w-xs truncate">{targetUrl}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400 font-bold uppercase text-[10px]">Status Inicial:</span>
                <Badge className="bg-amber-100 text-amber-800 border-none text-[9px] font-black uppercase">
                  Pendente de Análise Admin
                </Badge>
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center">
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => setStep(2)}
                className="h-11 px-4 rounded-xl text-xs font-bold"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="h-12 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-wider gap-2 shadow-lg shadow-emerald-200"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Enviando Solicitação...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Confirmar e Submeter (10 USD)
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CampaignRequestModal;