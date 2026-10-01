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

    if (method === "Transferência Bancária (IBAN)" && !accountNumber.trim()) {
      toast.error("Informe o IBAN para a transferência bancária.");
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
      <DialogContent className="max-w-md bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-left space-y-2">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-1">
            <ArrowUpRight className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            Solicitar Saque
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs">
            O valor solicitado será bloqueado do saldo disponível e permanecerá reservado até aprovação e quitação pela administração.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Card de saldo disponível */}
          <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Saldo Disponível:</span>
            <span className="text-base font-bold text-emerald-400">
              {availableBalance.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </span>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="w-amount" className="text-xs text-slate-300">
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
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
              disabled={isSubmitting}
              required
            />
            {numAmount > availableBalance && (
              <p className="text-xs text-rose-400 flex items-center gap-1 mt-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Valor superior ao saldo disponível.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="w-method" className="text-xs text-slate-300">
              Método de Pagamento
            </Label>
            <Select value={method} onValueChange={setMethod} disabled={isSubmitting}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-slate-100 focus:ring-emerald-500">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-slate-100">
                <SelectItem value="Multicaixa Express">Multicaixa Express</SelectItem>
                <SelectItem value="Transferência Bancária (IBAN)">Transferência Bancária (IBAN)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="w-holder" className="text-xs text-slate-300">
              Nome do Titular da Conta <span className="text-rose-400">*</span>
            </Label>
            <Input
              id="w-holder"
              placeholder="Nome conforme registo bancário"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
              disabled={isSubmitting}
              required
            />
          </div>

          {method === "Multicaixa Express" ? (
            <div className="space-y-1.5">
              <Label htmlFor="w-phone" className="text-xs text-slate-300">
                Número de Telefone Express <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="w-phone"
                placeholder="+244 9..."
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500"
                disabled={isSubmitting}
                required
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <Label htmlFor="w-iban" className="text-xs text-slate-300">
                IBAN Bancário <span className="text-rose-400">*</span>
              </Label>
              <Input
                id="w-iban"
                placeholder="AO06 0000 0000 0000 0000 0000 0"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 placeholder:text-slate-600 font-mono text-xs focus-visible:ring-emerald-500"
                disabled={isSubmitting}
                required
              />
            </div>
          )}

          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start gap-2.5 text-xs text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              Caso o saque seja recusado pelo administrador, o valor reservado retornará imediatamente e de forma integral para o saldo disponível da sua carteira.
            </span>
          </div>

          <div className="pt-2 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || numAmount <= 0 || numAmount > availableBalance}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-lg shadow-emerald-950"
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
