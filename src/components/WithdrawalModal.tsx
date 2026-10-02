import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, ArrowUpRight, AlertCircle, ShieldCheck } from "lucide-react";

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableBalance: number;
  onSuccess: () => Promise<void>;
}

export const WithdrawalModal: React.FC<WithdrawalModalProps> = ({
  isOpen,
  onClose,
  availableBalance,
  onSuccess,
}) => {
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<string>("Multicaixa Express");
  const [recipientName, setRecipientName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const numAmount = parseFloat(amount) || 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (numAmount <= 0) {
      toast.error("O valor do saque deve ser maior que zero.");
      return;
    }

    if (numAmount > availableBalance) {
      toast.error("Saldo disponível insuficiente para este saque.");
      return;
    }

    if (!recipientName.trim()) {
      toast.error("Informe o nome do titular da conta.");
      return;
    }

    if (method === "Multicaixa Express" && !phoneNumber.trim()) {
      toast.error("Informe o número de telefone associado ao Multicaixa Express.");
      return;
    }

    if (method === "Unitel Money" && !phoneNumber.trim()) {
      toast.error("Informe o número de telefone associado ao Unitel Money.");
      return;
    }

    if (method === "Transferência Bancária (IBAN)" && !accountNumber.trim()) {
      toast.error("Informe o IBAN para a transferência bancária.");
      return;
    }
    
    if (method === "Pix" && !accountNumber.trim()) {
      toast.error("Informe a chave Pix.");
      return;
    }

    setIsSubmitting(true);
    try {
      const paymentDetails: Record<string, string> = {
        titular: recipientName.trim(),
        metodo: method,
      };

      if (phoneNumber.trim()) {
        paymentDetails.telefone = phoneNumber.trim();
      }
      if (accountNumber.trim()) {
        paymentDetails.iban = accountNumber.trim();
      }

      const { data, error } = await supabase.rpc("request_withdrawal", {
        p_amount: numAmount,
        p_method: method,
        p_payment_details: paymentDetails,
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success(`Solicitação de saque de ${numAmount.toLocaleString("pt-AO")} Kz criada com sucesso! O valor foi reservado até o processamento.`);
      setAmount("");
      setRecipientName("");
      setAccountNumber("");
      setPhoneNumber("");
      onClose();
      await onSuccess();
    } catch (err: unknown) {
      toast.error("Falha ao registrar solicitação de saque.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md bg-white border-slate-200 text-slate-900 sm:rounded-3xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-2 border-b border-slate-100 pb-5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-1">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
            Solicitar Saque
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs font-medium leading-relaxed">
            O valor solicitado será bloqueado do saldo disponível e permanecerá reservado até aprovação e quitação pela administração.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Card de saldo disponível */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-black uppercase tracking-widest">Saldo Disponível:</span>
            <span className="text-sm font-black text-emerald-600">
              {availableBalance.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="w-amount" className="text-xs text-slate-400 font-black uppercase tracking-widest">
              Valor do Saque (Kz) <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="w-amount"
              type="number"
              step="1"
              min="1"
              max={availableBalance}
              placeholder="Ex: 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus-visible:ring-emerald-500 rounded-2xl h-12"
              disabled={isSubmitting}
              required
            />
            {numAmount > availableBalance && (
              <p className="text-xs text-rose-500 flex items-center gap-1 mt-1 font-medium">
                <AlertCircle className="w-3.5 h-3.5" />
                Valor superior ao saldo disponível.
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="w-method" className="text-xs text-slate-400 font-black uppercase tracking-widest">
              Método de Pagamento
            </Label>
            <Select value={method} onValueChange={setMethod} disabled={isSubmitting}>
              <SelectTrigger className="bg-white border-slate-200 text-slate-900 focus:ring-emerald-500 rounded-2xl h-12">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200 text-slate-900">
                <SelectItem value="Multicaixa Express">
                  <div className="flex items-center gap-2.5">
                    <img src="/icons/express.jpg" alt="Express" className="w-6 h-6 object-cover rounded-lg shadow-sm" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Multicaixa Express</span>
                  </div>
                </SelectItem>
                <SelectItem value="Transferência Bancária (IBAN)">
                  <div className="flex items-center gap-2.5">
                    <img src="/icons/iban.jpg" alt="IBAN" className="w-6 h-6 object-cover rounded-lg shadow-sm" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Transferência Bancária (IBAN)</span>
                  </div>
                </SelectItem>
                <SelectItem value="Unitel Money">
                  <div className="flex items-center gap-2.5">
                    <img src="/icons/unitel.jpg" alt="Unitel" className="w-6 h-6 object-cover rounded-lg shadow-sm" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Unitel Money</span>
                  </div>
                </SelectItem>
                <SelectItem value="Pix">
                  <div className="flex items-center gap-2.5">
                    <img src="/icons/pix.jpg" alt="Pix" className="w-6 h-6 object-cover rounded-lg shadow-sm" />
                    <span className="text-[10px] font-black uppercase tracking-wider">Pix</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="w-holder" className="text-xs text-slate-400 font-black uppercase tracking-widest">
              Nome do Titular da Conta <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="w-holder"
              placeholder="Nome conforme registo bancário"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus-visible:ring-emerald-500 rounded-2xl h-12"
              disabled={isSubmitting}
              required
            />
          </div>

          {method === "Multicaixa Express" || method === "Unitel Money" ? (
            <div className="space-y-2">
              <Label htmlFor="w-phone" className="text-xs text-slate-400 font-black uppercase tracking-widest">
                {method === "Unitel Money" ? "Número Unitel Money" : "Número de Telefone Express"} <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="w-phone"
                placeholder="+244 9..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 focus-visible:ring-emerald-500 rounded-2xl h-12"
                disabled={isSubmitting}
                required
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="w-account" className="text-xs text-slate-400 font-black uppercase tracking-widest">
                {method === "Pix" ? "Chave Pix" : "IBAN Bancário"} <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="w-account"
                placeholder={method === "Pix" ? "Chave Pix..." : "AO06 0000 0000 0000 0000 0000 0"}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="bg-white border-slate-200 text-slate-900 placeholder:text-slate-300 font-mono text-xs focus-visible:ring-emerald-500 rounded-2xl h-12"
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3 text-xs text-emerald-800 font-medium">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Caso o saque seja recusado pelo administrador, o valor reservado retornará imediatamente e de forma integral para o saldo disponível da sua carteira.
            </span>
          </div>

          <div className="pt-4 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-2xl h-12 font-black uppercase tracking-widest text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || numAmount > availableBalance}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl h-12 shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Solicitando...
                </>
              ) : (
                "Confirmar Saque"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
