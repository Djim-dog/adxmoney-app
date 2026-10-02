import React from "react";
import { ArrowUpRight, Clock, ShieldCheck, Wallet, CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserWalletSectionProps {
  wallet: { balance: number; reserved_balance: number; iban?: string; holder_name?: string } | null;
  withdrawals: any[];
  onOpenWithdraw: () => void;
}

export const UserWalletSection: React.FC<UserWalletSectionProps> = ({
  wallet,
  withdrawals,
  onOpenWithdraw,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-50 text-emerald-700 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Pago
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-50 text-rose-700 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" /> Rejeitado
          </Badge>
        );
      case "PENDING":
      default:
        return (
          <Badge className="bg-amber-50 text-amber-700 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-600" /> Em Análise
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Carteira & Pagamentos</h2>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">
            Histórico de saques e controle de saldo líquido
          </p>
        </div>
        <Button
          onClick={onOpenWithdraw}
          disabled={(wallet?.balance || 0) <= 0}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest h-12 px-6 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center gap-2 self-start sm:self-auto"
        >
          <ArrowUpRight className="w-4 h-4" />
          Solicitar Levantamento
        </Button>
      </div>

      {/* Balance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Wallet className="w-6 h-6" />
            </div>
            <Badge className="bg-emerald-100 text-emerald-800 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1">
              Disponível para Saque
            </Badge>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
            {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 0 })}{" "}
            <span className="text-sm font-bold text-slate-400">Kz</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-2">
            Disponível imediatamente para transferência bancária.
          </p>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <Badge className="bg-amber-100 text-amber-800 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1">
              Saldo Retido
            </Badge>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono tracking-tighter">
            {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 0 })}{" "}
            <span className="text-sm font-bold text-slate-400">Kz</span>
          </div>
          <p className="text-xs text-slate-400 font-medium mt-2">
            Valores de levantamento em auditoria pela equipa financeira.
          </p>
        </Card>
      </div>

      {/* Withdrawal History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">
            Histórico de Levantamentos
          </h3>
          <Badge className="bg-slate-100 text-slate-600 border-none font-black text-[9px] uppercase px-2.5 py-1">
            {withdrawals.length} solicitações
          </Badge>
        </div>

        {withdrawals.length === 0 ? (
          <Card className="bg-white border-dashed border-2 border-slate-200 p-14 text-center rounded-3xl shadow-sm">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <p className="text-xs text-slate-400 font-black uppercase tracking-widest">
              Nenhum levantamento realizado ainda.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {withdrawals.map((w) => (
              <Card
                key={w.id}
                className="bg-white border-none shadow-md hover:shadow-lg rounded-3xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-slate-50 text-slate-700 flex items-center justify-center shrink-0">
                    <Wallet className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 font-mono tracking-tighter">
                        {Number(w.amount).toLocaleString("pt-AO")} Kz
                      </span>
                      {getStatusBadge(w.status)}
                    </div>
                    <div className="text-xs text-slate-400 font-medium mt-1 font-mono">
                      IBAN: {w.iban || "Registado no perfil"} • {w.holder_name || "Titular"}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-slate-400 font-mono sm:text-right">
                  {new Date(w.created_at).toLocaleDateString("pt-AO", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
