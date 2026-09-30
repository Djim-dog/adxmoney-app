import React, { useState } from "react";
import { ArrowUpRight, Loader2, Info } from "lucide-react";
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
      <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-base text-white flex items-center gap-2">
            <ArrowUpRight className="w-5 h-5 text-emerald-400" /> Solicitar Saque
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-400">
            O valor solicitado será reservado e transferido para seus dados bancários após aprovação.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleRequestWithdraw} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">Método de Recebimento</Label>
            <Select value={withdrawMethod} onValueChange={setWithdrawMethod}>
              <SelectTrigger className="bg-slate-950 border-slate-800 text-xs text-white">
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white text-xs">
                <SelectItem value="MULTICAIXA_EXPRESS">Multicaixa Express (Telefone)</SelectItem>
                <SelectItem value="IBAN">Transferência Bancária (IBAN)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-slate-300">
              {withdrawMethod === "MULTICAIXA_EXPRESS"
                ? "Número Multicaixa Express (9 dígitos)"
                : "IBAN da Conta"}
            </Label>
            <Input
              value={withdrawTarget}
              onChange={(e) => setWithdrawTarget(e.target.value)}
              placeholder={withdrawMethod === "MULTICAIXA_EXPRESS" ? "Ex: 923456789" : "Ex: AO06.0040.0000..."}
              className="bg-slate-950 border-slate-800 text-white text-xs"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-slate-300">Valor a Sacar (Kz)</Label>
              <span className="text-[10px] text-emerald-400 font-mono">
                Disponível: {availableBalance.toLocaleString("pt-AO")} Kz
              </span>
            </div>
            <Input
              type="number"
              value={withdrawAmount}
              onChange={(e) => setWithdrawAmount(e.target.value)}
              placeholder="0.00"
              className="bg-slate-950 border-slate-800 text-white font-mono text-xs"
              required
              min="1"
              max={availableBalance}
            />
          </div>

          <div className="bg-slate-950/70 p-3 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex gap-2 items-start">
            <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
            <span>
              Saques são processados e pagos nos dias úteis. Certifique-se de que os dados bancários estão corretos.
            </span>
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-800 text-slate-300 text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={submittingWithdraw || availableBalance <= 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-4"
            >
              {submittingWithdraw ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Enviando...
                </>
              ) : (
                "Confirmar Saque"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
