import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Megaphone,
  X,
  Target,
  FileText,
  HelpCircle,
  Loader2,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"afiliados" | "monetizacao_coletiva">("afiliados");
  const [objective, setObjective] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !objective) {
      toast.error("Por favor, preencha os campos obrigatórios.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("campaign_requests").insert({
        user_id: userId,
        title: title.trim(),
        description: description.trim(),
        type,
        objective: objective.trim(),
        additional_information: additionalInfo.trim() || null,
        status: "pendente",
      });

      if (error) throw error;

      toast.success("Solicitação enviada com sucesso! Nossa equipe analisará a proposta.");
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error("Erro ao enviar solicitação: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setType("afiliados");
    setObjective("");
    setAdditionalInfo("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-md bg-white border-none sm:rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-50 pb-6 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-3 shadow-sm">
            <Megaphone className="w-7 h-7" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
            Solicitar Campanha
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-medium leading-relaxed pt-1">
            Proponha uma nova campanha para ser operada na plataforma. Nossa gestão avaliará o projeto em até 48 horas.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Tipo de Campanha *</Label>
            <Select value={type} onValueChange={(val: any) => setType(val)}>
              <SelectTrigger className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 rounded-2xl">
                <SelectItem value="afiliados" className="rounded-xl focus:bg-emerald-50 font-medium">Campanha de Afiliados</SelectItem>
                <SelectItem value="monetizacao_coletiva" className="rounded-xl focus:bg-emerald-50 font-medium">Monetização Coletiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-emerald-600" /> Nome Sugerido *
            </Label>
            <Input
              placeholder="Ex: Alavancagem de Perfil TikTok"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
              <Target className="w-3 h-3 text-emerald-600" /> Objetivo da Campanha *
            </Label>
            <Input
              placeholder="Ex: Atingir 1k seguidores para LIVE"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-3 h-3 text-emerald-600" /> Descrição do Projeto *
            </Label>
            <Textarea
              placeholder="Explique como a campanha funcionará..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 rounded-2xl text-sm font-medium transition-all min-h-[100px] py-4"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
              <HelpCircle className="w-3 h-3 text-emerald-600" /> Informações Adicionais
            </Label>
            <Textarea
              placeholder="Links, referências ou detalhes técnicos..."
              value={additionalInfo}
              onChange={(e) => setAdditionalInfo(e.target.value)}
              className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 rounded-2xl text-sm font-medium transition-all min-h-[80px] py-4"
            />
          </div>

          <div className="pt-4 flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  ENVIANDO...
                </>
              ) : (
                <>
                  ENVIAR SOLICITAÇÃO
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              className="w-full text-slate-400 hover:text-slate-900 hover:bg-slate-50 font-black h-12 rounded-2xl uppercase tracking-widest text-[10px]"
            >
              CANCELAR
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
