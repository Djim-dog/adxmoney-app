import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
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
import { Loader2, SendHorizontal, Megaphone } from "lucide-react";

interface CampaignRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  userId: string;
}

export const CampaignRequestModal: React.FC<CampaignRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  userId,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"afiliados" | "monetizacao_coletiva">("afiliados");
  const [description, setDescription] = useState("");
  const [objective, setObjective] = useState("");
  const [additionalInformation, setAdditionalInformation] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setTitle("");
    setType("afiliados");
    setDescription("");
    setObjective("");
    setAdditionalInformation("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim() || !description.trim() || !objective.trim()) {
      toast.error("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!userId) {
      toast.error("Usuário não identificado.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("campaign_requests").insert({
        user_id: userId,
        title: title.trim(),
        type: type,
        description: description.trim(),
        objective: objective.trim(),
        additional_information: additionalInformation.trim() || null,
        status: "pendente",
      });

      if (error) throw error;

      toast.success("Solicitação de campanha enviada com sucesso! Aguarde a revisão da equipa.");
      resetForm();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Erro ao submeter solicitação de campanha:", err);
      toast.error(err.message || "Erro ao registrar solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="space-y-1.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-1">
            <Megaphone className="w-5 h-5" />
          </div>
          <DialogTitle className="text-base font-bold text-white tracking-tight">
            Solicitar Campanha
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400 leading-relaxed">
            Preencha os detalhes da campanha desejada. A administração avaliará a proposta e entrará em contacto.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 mt-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">
              Nome / Título da Campanha <span className="text-rose-400">*</span>
            </Label>
            <Input
              placeholder="Ex: Divulgação do Lançamento de Produto X"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-10 rounded-xl focus-visible:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">
              Tipo de Campanha <span className="text-rose-400">*</span>
            </Label>
            <Select
              value={type}
              onValueChange={(val: "afiliados" | "monetizacao_coletiva") => setType(val)}
            >
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-10 rounded-xl">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100 text-xs">
                <SelectItem value="afiliados" className="text-xs">
                  Afiliados
                </SelectItem>
                <SelectItem value="monetizacao_coletiva" className="text-xs">
                  Monetização Coletiva
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">
              Descrição da Campanha <span className="text-rose-400">*</span>
            </Label>
            <Textarea
              placeholder="Descreva o conteúdo, as orientações principais e o que envolve a campanha..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs min-h-[75px] rounded-xl focus-visible:ring-indigo-500 resize-none"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">
              Objetivo <span className="text-rose-400">*</span>
            </Label>
            <Input
              placeholder="Ex: Obter 500 novos leads qualificados / visualizações"
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs h-10 rounded-xl focus-visible:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-300">
              Informações Adicionais <span className="text-slate-500 text-[11px]">(opcional)</span>
            </Label>
            <Textarea
              placeholder="Links de referência, prazos desejados, público-alvo ou observações especiais..."
              value={additionalInformation}
              onChange={(e) => setAdditionalInformation(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 text-xs min-h-[60px] rounded-xl focus-visible:ring-indigo-500 resize-none"
            />
          </div>

          <div className="pt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-10 rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !title.trim() || !description.trim() || !objective.trim()}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold h-10 rounded-xl shadow-lg shadow-indigo-950/50 gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Enviando...</span>
                </>
              ) : (
                <>
                  <SendHorizontal className="w-3.5 h-3.5" />
                  <span>Enviar Solicitação</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
