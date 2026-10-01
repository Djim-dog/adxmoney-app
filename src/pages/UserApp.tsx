import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useNavigate } from "react-router-dom";
import { WithdrawModal } from "@/components/user/WithdrawModal";
import {
  Layers,
  Wallet,
  History,
  User as UserIcon,
  LogOut,
  ArrowUpRight,
  ChevronRight,
  TrendingUp,
  Share2,
  ExternalLink,
  Loader2,
  Copy,
  Plus,
  Banknote,
  PhoneCall,
  Smartphone,
  CreditCard,
  Gift,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function UserAppPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"home" | "tasks" | "wallet" | "account">("home");

  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ id: string; balance: number; reserved_balance: number } | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [affiliate, setAffiliate] = useState<any | null>(null);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);

  // Profile and Withdrawal states
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Withdrawal form
  const [withdrawMethod, setWithdrawMethod] = useState<string>("express");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawIban, setWithdrawIban] = useState("");
  const [withdrawHolder, setWithdrawHolder] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  const [withdrawPix, setWithdrawPix] = useState("");
  const [isRequestingWithdraw, setIsRequestingWithdraw] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || "");
      setProfilePhone(profile.phone || "");
      setProfileLink(profile.primary_link || "");
      setWithdrawHolder(profile.name || "");
      setWithdrawPhone(profile.phone || "");
    }
  }, [profile]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Wallet
      const { data: wData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wData) {
        setWallet(wData);
      }

      // 2. Transactions
      const { data: txData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (txData) setTransactions(txData);

      // 3. Campaigns
      const { data: assignments } = await supabase
        .from("campaign_assignments")
        .select(`id, status, campaign_id, campaigns (*)`)
        .eq("user_id", user.id);

      if (assignments) {
        const mapped = assignments
          .filter((a) => a.campaigns)
          .map((a) => ({
            ...a.campaigns,
            assignment_id: a.id,
            assignment_status: a.status,
          }));
        setCampaigns(mapped);
      }

      // 4. Affiliate
      const { data: affData } = await supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (affData) setAffiliate(affData);
    } catch (err: any) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profileName.trim(),
          phone: profilePhone.trim(),
          primary_link: profileLink.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Dados atualizados com sucesso!");
      await refreshProfile();
    } catch (err: any) {
      toast.error("Erro ao atualizar perfil: " + err.message);
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleRequestWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      toast.error("Insira um valor válido para o saque.");
      return;
    }

    if (!wallet || amount > wallet.balance) {
      toast.error("Saldo insuficiente para este valor.");
      return;
    }

    setIsRequestingWithdraw(true);
    try {
      // 1. Create withdrawal request
      const details = {
        method: withdrawMethod,
        iban: withdrawMethod === 'iban' ? withdrawIban : null,
        holder: withdrawMethod === 'iban' ? withdrawHolder : null,
        phone: (withdrawMethod === 'express' || withdrawMethod === 'unitel') ? withdrawPhone : null,
        pix: withdrawMethod === 'pix' ? withdrawPix : null
      };

      const { error: wError } = await supabase
        .from("withdrawals")
        .insert({
          user_id: user?.id,
          amount: amount,
          method: withdrawMethod,
          status: "PENDING",
          details: details
        });

      if (wError) throw wError;

      // 2. Reserved balance logic would be handled by a DB trigger in a real app,
      // but here we just notify the user and refresh
      toast.success("Solicitação de saque enviada! Aguardando processamento.");
      setWithdrawAmount("");
      loadUserData();
    } catch (err: any) {
      toast.error("Erro ao solicitar saque: " + err.message);
    } finally {
      setIsRequestingWithdraw(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado!`);
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/login?r=${profile?.referral_code || ""}`;
  };

  if (profile?.first_login) {
    return <Navigate to="/account/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-24">
      {/* Cabeçalho Operacional */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ADX Money" className="h-7 w-auto" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-tight">
              {profile?.name || user?.email?.split('@')[0]}
            </span>
            <span className="text-[9px] text-emerald-400 font-mono uppercase tracking-wider">Operador Ativo</span>
          </div>
        </div>

        <Button
          size="sm"
          variant="ghost"
          onClick={() => signOut()}
          className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </header>

      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-6">
        
        {/* ABA: INÍCIO */}
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            {/* Bloco de Saldo */}
            <Card className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 border-none shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <Wallet className="w-24 h-24 rotate-12" />
              </div>
              <CardHeader className="pb-2">
                <CardDescription className="text-indigo-200 text-[10px] font-bold uppercase tracking-widest">
                  Saldo Total
                </CardDescription>
                <CardTitle className="text-4xl font-extrabold text-white font-mono tracking-tighter">
                  {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-xl">Kz</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-indigo-100 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Pendente: {(wallet?.reserved_balance || 0).toLocaleString("pt-AO")} Kz
                </div>
                <Button
                  onClick={() => setActiveTab("wallet")}
                  className="bg-white text-indigo-700 hover:bg-indigo-50 text-xs h-8 px-4 font-bold rounded-full shadow-lg"
                >
                  Levantar
                </Button>
              </CardContent>
            </Card>

            {/* Ações Rápidas */}
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setActiveTab("tasks")}
                className="flex flex-col items-center justify-center p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-indigo-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform mb-3">
                  <Layers className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white">Tarefas</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Novas tarefas</span>
              </button>

              <button 
                onClick={() => setActiveTab("account")}
                className="flex flex-col items-center justify-center p-5 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/50 transition-all group"
              >
                <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform mb-3">
                  <Share2 className="w-6 h-6" />
                </div>
                <span className="text-sm font-bold text-white">Afiliados</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Link de convite</span>
              </button>
            </div>

            {/* Recentes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Atividade Recente</h3>
                <button onClick={() => setActiveTab("wallet")} className="text-[10px] text-indigo-400 hover:underline">Ver tudo</button>
              </div>
              {transactions.length === 0 ? (
                <div className="bg-slate-900/40 border border-dashed border-slate-800 rounded-2xl p-6 text-center">
                  <p className="text-xs text-slate-500">Nenhuma atividade recente.</p>
                </div>
              ) : (
                <div className="bg-slate-900 rounded-2xl overflow-hidden border border-slate-800">
                  {transactions.slice(0, 3).map((tx, idx) => (
                    <div key={tx.id} className={`p-4 flex items-center justify-between ${idx !== 2 ? 'border-b border-slate-800' : ''}`}>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {tx.amount > 0 ? <Plus className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{tx.description || tx.type}</p>
                          <p className="text-[10px] text-slate-500">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} Kz
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ABA: TAREFAS */}
        {activeTab === "tasks" && (
          <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-extrabold text-white">Tarefas Operacionais</h2>
              <p className="text-xs text-slate-400 mt-1">Execute as atividades para aumentar o seu saldo.</p>
            </div>

            {campaigns.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800 border-dashed p-10 text-center">
                <Layers className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                <p className="text-xs text-slate-500">Sem tarefas atribuídas no momento. Aguarde liberação do administrador.</p>
              </Card>
            ) : (
              <div className="space-y-4">
                {campaigns.map((c) => (
                  <Card key={c.id} className="bg-slate-900 border-slate-800 overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-[9px] uppercase border-slate-700 text-slate-400">
                          {c.platform}
                        </Badge>
                        <span className="text-xs font-black text-emerald-400 font-mono">
                          +{c.reward_amount.toLocaleString()} Kz
                        </span>
                      </div>
                      <CardTitle className="text-sm font-bold text-white">{c.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-slate-400 pb-4">
                      {c.description}
                    </CardContent>
                    <CardFooter className="bg-slate-950/50 p-3 border-t border-slate-800 flex justify-between items-center">
                      <Badge className={c.assignment_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-none' : 'bg-amber-500/10 text-amber-400 border-none'}>
                        {c.assignment_status === 'COMPLETED' ? 'Concluída' : 'Pendente'}
                      </Badge>
                      <Button size="sm" className="h-7 text-[10px] bg-indigo-600 hover:bg-indigo-500" asChild>
                        <a href={c.target_url} target="_blank" rel="noreferrer">
                          Abrir Tarefa <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: CARTEIRA E LEVANTAMENTO */}
        {activeTab === "wallet" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-extrabold text-white">Carteira & Saques</h2>
              <p className="text-xs text-slate-400 mt-1">Gerencie seus ganhos e solicite levantamentos.</p>
            </div>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-4">
                <CardDescription className="text-xs text-slate-500">Saldo Disponível para Saque</CardDescription>
                <CardTitle className="text-3xl font-black text-white font-mono tracking-tight">
                  {(wallet?.balance || 0).toLocaleString("pt-AO")} <span className="text-sm font-normal text-slate-400">Kz</span>
                </CardTitle>
              </CardHeader>
              
              <form onSubmit={handleRequestWithdraw}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-300">Método de Recebimento</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'express', label: 'Express', icon: Smartphone },
                        { id: 'unitel', label: 'Unitel Money', icon: PhoneCall },
                        { id: 'iban', label: 'IBAN', icon: Banknote },
                        { id: 'pix', label: 'PIX', icon: CreditCard }
                      ].map((method) => (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setWithdrawMethod(method.id)}
                          className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                            withdrawMethod === method.id 
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'
                          }`}
                        >
                          <method.icon className="w-4 h-4" />
                          <span className="text-xs font-bold">{method.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-300">Valor do Saque</Label>
                    <div className="relative">
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        className="bg-slate-950 border-slate-800 h-11 font-mono text-lg text-emerald-400"
                        required
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 font-bold">Kz</span>
                    </div>
                  </div>

                  {/* Campos Dinâmicos conforme Método */}
                  {withdrawMethod === 'iban' && (
                    <div className="space-y-3 p-4 bg-slate-950 rounded-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">Titular da Conta</Label>
                        <Input 
                          value={withdrawHolder} 
                          onChange={(e) => setWithdrawHolder(e.target.value)}
                          className="bg-slate-900 border-slate-800 text-xs" 
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[10px] uppercase font-bold text-slate-500">IBAN</Label>
                        <Input 
                          placeholder="AO06..." 
                          value={withdrawIban}
                          onChange={(e) => setWithdrawIban(e.target.value)}
                          className="bg-slate-900 border-slate-800 font-mono text-xs" 
                        />
                      </div>
                    </div>
                  )}

                  {(withdrawMethod === 'express' || withdrawMethod === 'unitel') && (
                    <div className="space-y-1.5 p-4 bg-slate-950 rounded-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">Número de Telefone</Label>
                      <Input 
                        placeholder="9..." 
                        value={withdrawPhone}
                        onChange={(e) => setWithdrawPhone(e.target.value)}
                        className="bg-slate-900 border-slate-800 font-mono" 
                      />
                    </div>
                  )}

                  {withdrawMethod === 'pix' && (
                    <div className="space-y-1.5 p-4 bg-slate-950 rounded-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
                      <Label className="text-[10px] uppercase font-bold text-slate-500">Chave PIX</Label>
                      <Input 
                        placeholder="E-mail, CPF ou Telefone" 
                        value={withdrawPix}
                        onChange={(e) => setWithdrawPix(e.target.value)}
                        className="bg-slate-900 border-slate-800" 
                      />
                    </div>
                  )}
                </CardContent>
                <CardFooter className="pt-2">
                  <Button
                    type="submit"
                    disabled={isRequestingWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl shadow-lg shadow-indigo-950/50"
                  >
                    {isRequestingWithdraw ? <Loader2 className="w-5 h-5 animate-spin" /> : "Solicitar Levantamento"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Histórico Completo */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Histórico Operacional</h3>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden divide-y divide-slate-800">
                {transactions.length === 0 ? (
                  <div className="p-8 text-center text-slate-600 text-xs italic">Nenhum registro encontrado.</div>
                ) : (
                  transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-lg h-fit ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {tx.amount > 0 ? <Plus className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{tx.description || tx.type}</p>
                          <p className="text-[10px] text-slate-500">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} Kz
                        </p>
                        <p className="text-[9px] text-slate-600 uppercase font-bold">{tx.status}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ABA: CONTA & AFILIADOS */}
        {activeTab === "account" && (
          <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
            <div>
              <h2 className="text-xl font-extrabold text-white">Conta & Afiliados</h2>
              <p className="text-xs text-slate-400 mt-1">O seu código de convite e dados de perfil.</p>
            </div>

            {/* Programa de Afiliados */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800 relative overflow-hidden">
              <div className="absolute -right-4 -top-4 opacity-5">
                <Gift className="w-32 h-32" />
              </div>
              <CardHeader className="pb-3">
                <Badge className="w-fit mb-2 bg-emerald-500/10 text-emerald-400 border-none">Programa de Ganhos</Badge>
                <CardTitle className="text-base font-bold text-white">Convide Amigos</CardTitle>
                <CardDescription className="text-xs text-slate-500">Ganhe bónus por cada operador ativo que utilizar o seu código.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-slate-500">O seu Código de Convite</Label>
                  <div className="flex gap-2">
                    <div className="flex-1 h-11 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-center font-mono text-lg font-bold text-emerald-400 tracking-wider">
                      {profile?.referral_code || "---"}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(profile?.referral_code || "", "Código")}
                      className="h-11 w-11 border-slate-800 bg-slate-900 text-slate-400"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Total de Convidados</p>
                    <p className="text-xl font-black text-white font-mono">{affiliate?.total_referrals || 0}</p>
                  </div>
                  <div className="w-px h-8 bg-slate-800" />
                  <div className="space-y-1 text-right">
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Ganhos de Indicação</p>
                    <p className="text-xl font-black text-emerald-400 font-mono">{Number(affiliate?.total_earned || 0).toLocaleString()} Kz</p>
                  </div>
                </div>
                
                <Button 
                  onClick={() => copyToClipboard(getReferralLink(), "Link de Convite")}
                  className="w-full bg-slate-100 text-slate-950 hover:bg-slate-200 font-bold h-11 rounded-xl"
                >
                  <Share2 className="w-4 h-4 mr-2" /> Copiar Link de Convite
                </Button>
              </CardContent>
            </Card>

            {/* Perfil */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-bold text-white">Dados Operacionais</CardTitle>
                <CardDescription className="text-xs text-slate-500">Mantenha seus dados atualizados para validação.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Nome Completo</Label>
                    <Input 
                      value={profileName} 
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm h-11" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Telefone / WhatsApp</Label>
                    <Input 
                      value={profilePhone} 
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm h-11" 
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-slate-500">Rede Social Principal</Label>
                    <Input 
                      value={profileLink} 
                      onChange={(e) => setProfileLink(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-sm h-11" 
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-slate-800">
                  <Button 
                    type="submit" 
                    disabled={updatingProfile}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl"
                  >
                    {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Guardar Alterações"}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

      </main>

      {/* Barra de Navegação Inferior (App Estilo Mobile-First) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800 z-40 px-6 py-3">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center transition-all ${
              activeTab === "home" ? "text-indigo-400 scale-110" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "home" ? "bg-indigo-500/10" : ""}`}>
              <Smartphone className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-bold">Início</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex flex-col items-center justify-center transition-all ${
              activeTab === "tasks" ? "text-indigo-400 scale-110" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "tasks" ? "bg-indigo-500/10" : ""}`}>
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-bold">Tarefas</span>
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex flex-col items-center justify-center transition-all ${
              activeTab === "wallet" ? "text-indigo-400 scale-110" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "wallet" ? "bg-indigo-500/10" : ""}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-bold">Carteira</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`flex flex-col items-center justify-center transition-all ${
              activeTab === "account" ? "text-indigo-400 scale-110" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1.5 rounded-lg ${activeTab === "account" ? "bg-indigo-500/10" : ""}`}>
              <UserIcon className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-bold">Conta</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
