import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Sparkles, CheckCircle2, UserCheck, Gift } from "lucide-react";

interface FirstAccessModalProps {
  isOpen: boolean;
  userEmail: string;
  initialName?: string | null;
  onSuccess: () => Promise<void>;
}

export const FirstAccessModal: React.FC<FirstAccessModalProps> = ({
  isOpen,
  userEmail,
  initialName,
  onSuccess,
}) => {
  const [name, setName] = useState(initialName || "");
  const [phone, setPhone] = useState("");
  const [affiliateCode, setAffiliateCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Por favor, preencha o seu nome completo.");
      return;
    }

    setIsSubmitting(true);
    try {
      const codeToSend = affiliateCode.trim() ? affiliateCode.trim().toUpperCase() : null;

      const { data, error } = await supabase.rpc("complete_first_access", {
        p_name: name.trim(),
        p_phone: phone.trim() || null,
        p_affiliate_code: codeToSend,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      const res = data as { success: boolean; bonus_applied: boolean; bonus_amount: number };
      if (res?.bonus_applied) {
        toast.success(`Primeiro acesso concluído! Bônus de convite de ${res.bonus_amount.toLocaleString("pt-AO")} Kz creditado na sua carteira!`);
      } else {
        toast.success("Primeiro acesso concluído com sucesso!");
      }

      await onSuccess();
    } catch (err: unknown) {
      toast.error("Erro inesperado ao salvar seus dados de primeiro acesso.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6 shadow-2xl">
        <DialogHeader className="text-left space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
            <UserCheck className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            Configuração do Primeiro Acesso
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs leading-relaxed">
            Bem-vindo ao ADXmoney. Complete os dados obrigatórios da sua conta para liberar o painel operacional.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="fa-name" className="text-xs text-slate-300">
              Nome Completo <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="fa-name"
              placeholder="Ex: Manuel António"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
              disabled={isSubmitting}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="fa-phone" className="text-xs text-slate-300">
              Telefone / WhatsApp <span className="text-slate-500">(opcional)</span>
            </Label>
            <Input
              id="fa-phone"
              placeholder="+244 9..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
              disabled={isSubmitting}
            />
          </div>

          {/* Campo de Afiliado exclusivo do Primeiro Acesso */}
          <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Gift className="w-4 h-4" />
              <span>Possui Código de Convite ou Link de Afiliado?</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Se você foi convidado por um parceiro ADXmoney, insira o código abaixo para receber <strong>250 Kz</strong> de bônus imediato. Esta opção só pode ser preenchida neste primeiro acesso.
            </p>
            <Input
              placeholder="Ex: ADXABC123"
              value={affiliateCode}
              onChange={(e) => setAffiliateCode(e.target.value.toUpperCase())}
              className="bg-slate-950 border-emerald-500/40 text-emerald-300 font-mono text-sm placeholder:text-slate-600 focus-visible:ring-emerald-500"
              disabled={isSubmitting}
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2.5 rounded-xl shadow-lg shadow-emerald-950"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando dados...
                </>
              ) : (
                "Concluir e Liberar Aplicativo"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
