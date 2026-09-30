import React from "react";
import { ArrowUpRight, ArrowDownLeft, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface UserWalletSectionProps {
  wallet: { id: string; balance: number; reserved_balance: number } | null;
  transactions: any[];
  onOpenWithdraw: () => void;
}

export const UserWalletSection: React.FC<UserWalletSectionProps> = ({
  wallet,
  transactions,
  onOpenWithdraw,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Carteira e Saldo</h2>
        <p className="text-xs text-slate-400">Gerencie seus ganhos e solicite saques para sua conta bancária.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Saldo Disponível para Saque</CardDescription>
            <CardTitle className="text-3xl font-bold text-emerald-400 font-mono">
              {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2">
            <Button
              onClick={onOpenWithdraw}
              disabled={(wallet?.balance || 0) <= 0}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 rounded-lg font-medium"
            >
              <ArrowUpRight className="w-4 h-4 mr-1.5" />
              Solicitar Transferência / Saque
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs text-slate-400">Saldo Reservado / Em Processamento</CardDescription>
            <CardTitle className="text-3xl font-bold text-amber-400 font-mono">
              {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-2 text-xs text-slate-400 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Valores de saques em verificação pela administração.</span>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-bold text-slate-200">Extrato Financeiro Recente</h3>
        {transactions.length === 0 ? (
          <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-500">
            Nenhuma transação registrada até o momento.
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      tx.amount >= 0 ? "bg-emerald-950 text-emerald-400" : "bg-red-950 text-red-400"
                    }`}
                  >
                    {tx.amount >= 0 ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">{tx.description || tx.type}</div>
                    <div className="text-[10px] text-slate-500">
                      {new Date(tx.created_at).toLocaleString("pt-AO")}
                    </div>
                  </div>
                </div>
                <div
                  className={`text-xs font-bold font-mono ${
                    tx.amount >= 0 ? "text-emerald-400" : "text-red-400"
                  }`}
                >
                  {tx.amount >= 0 ? "+" : ""}
                  {Number(tx.amount).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
