import React, { useState } from "react";
import { ArrowUpRight, Loader2, Info, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WithdrawModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  availableBalance: number;
  onSuccess: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({
  open,
  onOpenChange,
  availableBalance,
  onSuccess,
}) => {
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState("MULTICAIXA_EXPRESS");
  const [withdrawTarget, setWithdrawTarget] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);

    if (isNaN(amount) || amount <= 0) {
      toast.error("Informe um valor válido para o saque.");
      return;
    }
    if (amount > availableBalance) {
      toast.error("Saldo insuficiente para este valor.");
      return;
    }
    if (!withdrawTarget.trim()) {
      toast.error("Informe o número de telefone ou IBAN para o recebimento.");
      return;
    }

    setSubmittingWithdraw(true);
    try {
      const { data, error } = await supabase.rpc("request_withdrawal", {
        p_amount: amount,
        p_method: withdrawMethod,
        p_payment_details: { target: withdrawTarget.trim() },
      });

      if (error) {
        toast.error("Erro ao solicitar saque: " + error.message);
      } else {
        toast.success("Solicitação de saque enviada com sucesso! Aguarde o processamento.");
        setWithdrawAmount("");
        setWithdrawTarget("");
        onOpenChange(false);
        onSuccess();
      }
    } catch (err: any) {
      toast.error("Ocorreu um erro ao enviar a solicitação: " + err.message);
    } finally {
      setSubmittingWithdraw(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-none shadow-2xl rounded-3xl p-8 max-w-[425px]">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2">
             <Banknote className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
            Solicitar Levantamento
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium">
            O valor solicitado será transferido para os seus dados bancários no prazo de até 24 horas.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRequestWithdraw} className="space-y-5 py-2">
          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Método de Recebimento</Label>
            <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
              <SelectTrigger className="bg-slate-50 border-transparent focus:border-emerald-500 text-xs font-bold h-12 rounded-2xl transition-all">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent className="bg-white rounded-2xl border border-slate-100">
                <SelectItem value="MULTICAIXA_EXPRESS" className="text-xs font-bold">Multicaixa Express (Telefone)</SelectItem>
                <SelectItem value="IBAN" className="text-xs font-bold">Transferência Bancária (IBAN)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              {withdrawMethod === "MULTICAIXA_EXPRESS"
                ? "Número Multicaixa Express"
                : "IBAN da Conta"}
            </Label>
            <Input
              value={withdrawTarget}
              onChange={(e) => setWithdrawTarget(e.target.value)}
              placeholder={withdrawMethod === "MULTICAIXA_EXPRESS" ? "Ex: 923 456 789" : "Ex: AO06 0040..."}
              className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 text-sm font-bold h-12 rounded-2xl transition-all"
              required
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Valor a Sacar (Kz)</Label>
              <span className="text-[9px] text-emerald-600 font-black uppercase tracking-widest bg-emerald-50 px-2 py-0.5 rounded-lg">
                Saldo: {availableBalance.toLocaleString("pt-AO")} Kz
              </span>
            </div>
            <Input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0"
              className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 font-mono text-sm font-bold h-12 rounded-2xl transition-all"
              required
              min="1"
              max={availableBalance}
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[10px] text-slate-500 font-medium flex gap-3 items-start leading-relaxed">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <span>
              Saques processados em até 24 horas. Certifique-se de que os seus dados estão corretos antes de confirmar.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="submit"
              disabled={submittingWithdraw || availableBalance <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest h-12 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {submittingWithdraw ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Processando...
                </>
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4" /> Confirmar Levantamento
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
