import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Layers,
  Wallet,
  LogOut,
  ArrowUpRight,
  ExternalLink,
  Loader2,
  Copy,
  Plus,
  Gift,
  Lock,
  Megaphone,
  Settings,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

import { UserCampaignsHub } from "@/components/user/UserCampaignsHub";
import { CommunityTasksSection } from "@/components/user/CommunityTasksSection";
import {
  Video as TiktokIcon,
  Instagram as InstagramIcon,
  User as UserIcon
} from "lucide-react";

export default function UserAppPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Navigation Tabs: "tasks" | "campaigns" | "affiliate" | "wallet"
  const [activeTab, setActiveTab] = useState<"tasks" | "campaigns" | "affiliate" | "wallet">("tasks");
  const [tasksSubTab, setTasksSubTab] = useState<"financial" | "community">("financial");

  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ id: string; balance: number; reserved_balance: number } | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [affiliate, setAffiliate] = useState<any | null>(null);

  // Profile overlay / Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [profileTiktok, setProfileTiktok] = useState("");
  const [profileInstagram, setProfileInstagram] = useState("");
  const [profileYoutube, setProfileYoutube] = useState("");
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
    const checkSuspension = async () => {
      if (!user) return;

      const { data: profileData } = await supabase
        .from("profiles")
        .select("suspended_until, is_active")
        .eq("id", user.id)
        .single();

      if (profileData) {
        const now = new Date();
        const suspendedUntil = profileData.suspended_until ? new Date(profileData.suspended_until) : null;

        if (suspendedUntil && suspendedUntil > now) {
          toast.error("Conta suspensa temporariamente por violação de diretrizes.", {
            duration: 10000,
          });
        } else if (suspendedUntil && suspendedUntil <= now && !profileData.is_active) {
          await supabase.from("profiles").update({ is_active: true, suspended_until: null }).eq("id", user.id);
          toast.success("Sua conta foi reativada após o período de suspensão.");
          await refreshProfile();
        }
      }
    };
    checkSuspension();
  }, [user]);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || "");
      setProfilePhone(profile.phone || "");
      setProfileLink(profile.primary_link || "");
      setProfileTiktok(profile.tiktok || "");
      setProfileInstagram(profile.instagram || "");
      setProfileYoutube(profile.youtube || "");
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
          tiktok: profileTiktok.trim(),
          instagram: profileInstagram.trim(),
          youtube: profileYoutube.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Dados do perfil atualizados com sucesso!");
      await refreshProfile();
      setIsSettingsOpen(false);
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
      const { data, error: wError } = await supabase.rpc("request_withdrawal", {
        p_amount: amount,
        p_method: withdrawMethod.toUpperCase(),
        p_payment_details: {
          titular: withdrawMethod === 'iban' ? withdrawHolder : (user?.user_metadata?.name || null),
          iban: withdrawMethod === 'iban' ? withdrawIban : null,
          telefone: (withdrawMethod === 'express' || withdrawMethod === 'unitel') ? withdrawPhone : null,
          pix: withdrawMethod === 'pix' ? withdrawPix : null
        }
      });

      if (wError) throw wError;

      toast.success("Solicitação de levantamento enviada com sucesso!");
      setWithdrawAmount("");
      loadUserData();
    } catch (err: any) {
      toast.error("Erro ao solicitar levantamento: " + err.message);
    } finally {
      setIsRequestingWithdraw(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado com sucesso!`);
  };

  const getReferralLink = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/login?r=${profile?.referral_code || ""}`;
  };

  if (profile?.first_login) {
    return <Navigate to="/account/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden select-none pb-24">
      
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-100 overflow-hidden bg-emerald-600">
            <img src="/logo.png" alt="ADX" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
              ADXmoney <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">v2</span>
            </h1>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">
              Operador: <span className="text-emerald-600 font-bold">{profile?.name?.split(' ')[0] || "Usuário"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => toast.info("Não tem notificações novas no momento.")}
            className="w-10 h-10 rounded-2xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-all active:scale-95"
          >
            <Bell className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-10 h-10 rounded-2xl bg-emerald-50 hover:bg-emerald-100 flex items-center justify-center text-emerald-600 transition-all active:scale-95 border border-emerald-100"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto max-w-4xl px-4 py-6 space-y-8">

        {/* 1. ABA: TAREFAS */}
        {activeTab === "tasks" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            {/* Seletor Segmentado */}
            <div className="flex bg-white p-1 rounded-3xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setTasksSubTab("financial")}
                className={`flex-1 py-2.5 text-xs font-black rounded-2xl transition-all ${
                  tasksSubTab === "financial"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                TAREFAS FINANCEIRAS
              </button>
              <button
                onClick={() => setTasksSubTab("community")}
                className={`flex-1 py-2.5 text-xs font-black rounded-2xl transition-all ${
                  tasksSubTab === "community"
                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-100"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                COMUNITÁRIAS
              </button>
            </div>

            {tasksSubTab === "financial" ? (
              <div className="space-y-5">
                <div className="px-1">
                  <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <Layers className="w-6 h-6 text-emerald-600" /> Atividades Disponíveis
                  </h2>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Conclua as tarefas para creditar o seu saldo em tempo real.</p>
                </div>

                {campaigns.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-3xl py-16 text-center shadow-sm">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Layers className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm text-slate-600 font-bold uppercase tracking-tight">Sem tarefas financeiras no momento</p>
                    <p className="text-xs text-slate-400 mt-1">Aguarde novas oportunidades de ganhos.</p>
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {campaigns.map((c) => (
                      <div key={c.id} className="bg-white border border-slate-100 rounded-3xl p-5 flex flex-col justify-between hover:shadow-xl hover:shadow-slate-200/50 transition-all shadow-md group">
                        <div>
                          <div className="flex justify-between items-start mb-3">
                            <Badge className="text-[10px] uppercase font-black border-none text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
                              {c.platform}
                            </Badge>
                            <span className="text-lg font-black text-emerald-600 font-mono">
                              +{c.reward_amount.toLocaleString()} Kz
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{c.title}</h3>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2 leading-relaxed font-medium">{c.description}</p>
                        </div>
                        
                        <div className="mt-5 pt-4 border-t border-slate-50 flex items-center justify-between">
                          <Badge className={c.assignment_status === 'COMPLETED' ? 'bg-slate-50 text-slate-400 border-none px-3 py-1 font-bold' : 'bg-lime-400 text-slate-900 border-none px-3 py-1 font-black'}>
                            {c.assignment_status === 'COMPLETED' ? 'Finalizada' : 'Disponível'}
                          </Badge>
                          <Button size="sm" className="h-10 text-xs font-black bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl shadow-lg transition-all px-5" asChild>
                            <a href={c.target_url} target="_blank" rel="noreferrer">
                              EXECUTAR <ExternalLink className="w-3 h-3 ml-2" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <CommunityTasksSection />
            )}
          </div>
        )}

        {/* 2. ABA: CAMPANHAS */}
        {activeTab === "campaigns" && user && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="px-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="w-6 h-6 text-emerald-600" /> Central de Campanhas
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Participe de ações de marketing estruturadas e bônus extras.</p>
            </div>
            <UserCampaignsHub userId={user.id} />
          </div>
        )}

        {/* 3. ABA: AFILIADO */}
        {activeTab === "affiliate" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="px-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Gift className="w-6 h-6 text-emerald-600" /> Programa de Afiliados
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Convide novos membros e ganhe uma porcentagem sobre as operações deles.</p>
            </div>

            <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Gift size={120} />
               </div>
               <div className="relative z-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Indicações Totais</p>
                      <p className="text-3xl font-black mt-1 font-mono">{affiliate?.total_referrals || 0}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-200">Ganhos em Comissões</p>
                      <p className="text-3xl font-black mt-1 font-mono">
                        {Number(affiliate?.total_earned || 0).toLocaleString()} <span className="text-sm">Kz</span>
                      </p>
                    </div>
                  </div>
               </div>
            </div>

            {/* Bloco do Código */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Seu Código Exclusivo</Label>
                <div className="flex gap-3">
                  <div className="flex-1 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center font-mono text-xl font-black text-emerald-600 tracking-widest">
                    {profile?.referral_code || "---"}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(profile?.referral_code || "", "Código")}
                    className="h-14 w-14 border-slate-200 bg-white text-slate-600 rounded-2xl hover:bg-slate-50 transition-all shadow-sm"
                  >
                    <Copy className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              <Button 
                onClick={() => copyToClipboard(getReferralLink(), "Link de Indicação")}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-lg shadow-emerald-100 transition-all flex items-center justify-center gap-2"
              >
                COPIAR LINK DE CONVITE <ArrowUpRight className="w-5 h-5" />
              </Button>
            </div>

            <div className="bg-lime-100/50 border border-lime-200 rounded-3xl p-6 space-y-3">
              <h4 className="text-sm font-black text-slate-900 uppercase">Como funcionam os ganhos?</h4>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Ao compartilhar seu link, cada novo usuário que se cadastrar se torna seu afiliado. Você recebe uma comissão automática por cada tarefa paga que eles concluírem na plataforma.
              </p>
            </div>
          </div>
        )}

        {/* 4. ABA: CARTEIRA */}
        {activeTab === "wallet" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-3 duration-300">
            <div className="px-1">
              <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Wallet className="w-6 h-6 text-emerald-600" /> Gestão Financeira
              </h2>
              <p className="text-sm text-slate-500 mt-1 font-medium">Acompanhe seu saldo e solicite levantamentos de forma segura.</p>
            </div>

            {/* Card de Saldo */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50 relative overflow-hidden">
              <div className="absolute right-6 top-6">
                <span className="text-[10px] bg-emerald-600 text-white px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-md shadow-emerald-100">
                  Operacional
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Saldo Disponível para Saque</p>
                <p className="text-4xl font-black text-slate-900 font-mono">
                  {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-lg font-medium text-slate-400">Kz</span>
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-300" />
                  Saldo em processamento: <span className="font-bold text-slate-700">{(wallet?.reserved_balance || 0).toLocaleString()} Kz</span>
                </span>
              </div>
            </div>

            {/* Formulário de Levantamento */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest px-1">Solicitar Pagamento</h3>
              
              <form onSubmit={handleRequestWithdraw} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-xs font-black text-slate-400 uppercase">Escolha o Método</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'express', label: 'Multicaixa Express', icon: '/icons/express.jpg' },
                      { id: 'unitel', label: 'Unitel Money', icon: '/icons/unitel.jpg' },
                      { id: 'iban', label: 'Transferência (IBAN)', icon: '/icons/iban.jpg' },
                      { id: 'pix', label: 'PIX Instantâneo', icon: '/icons/pix.jpg' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setWithdrawMethod(method.id)}
                        className={`flex items-center justify-center gap-2.5 p-3.5 rounded-2xl border transition-all ${
                          withdrawMethod === method.id
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-100'
                            : 'bg-white border-slate-100 text-slate-700 hover:border-slate-200'
                        }`}
                      >
                        <img
                          src={method.icon}
                          alt={method.label}
                          className="w-7 h-7 object-cover rounded-lg shadow-sm border border-slate-100/20 shrink-0"
                        />
                        <span className="text-[10px] font-black uppercase tracking-tight">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase">Valor do Saque</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Mínimo 1.000 Kz"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-14 font-mono text-xl font-black text-slate-900 rounded-2xl px-6"
                      required
                    />
                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">Kz</span>
                  </div>
                </div>

                {/* Formulários Dinâmicos */}
                {withdrawMethod === 'iban' && (
                  <div className="space-y-4 p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-300">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Titular da Conta</Label>
                      <Input 
                        value={withdrawHolder} 
                        onChange={(e) => setWithdrawHolder(e.target.value)}
                        className="bg-white border-slate-100 text-sm h-11 rounded-xl" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">IBAN para Crédito</Label>
                      <Input 
                        placeholder="AO06..." 
                        value={withdrawIban}
                        onChange={(e) => setWithdrawIban(e.target.value)}
                        className="bg-white border-slate-100 font-mono text-sm h-11 rounded-xl" 
                      />
                    </div>
                  </div>
                )}

                {(withdrawMethod === 'express' || withdrawMethod === 'unitel') && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-300">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Número de Telefone</Label>
                    <Input 
                      placeholder="9xx xxx xxx" 
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="bg-white border-slate-100 font-mono text-sm h-11 rounded-xl mt-2" 
                    />
                  </div>
                )}

                {withdrawMethod === 'pix' && (
                  <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in duration-300">
                    <Label className="text-[10px] font-black uppercase text-slate-500">Chave PIX</Label>
                    <Input 
                      placeholder="E-mail, CPF ou Telefone" 
                      value={withdrawPix}
                      onChange={(e) => setWithdrawPix(e.target.value)}
                      className="bg-white border-slate-100 text-sm h-11 rounded-xl mt-2" 
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isRequestingWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (wallet?.balance || 0)}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl shadow-xl shadow-emerald-100 transition-all text-sm uppercase tracking-widest"
                >
                  {isRequestingWithdraw ? <Loader2 className="w-5 h-5 animate-spin" /> : "Solicitar Levantamento"}
                </Button>
              </form>
            </div>

            {/* Histórico */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest px-1">Extrato de Movimentações</h3>
              
              {transactions.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center text-xs text-slate-400 font-medium">
                  Nenhuma movimentação registrada.
                </div>
              ) : (
                <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden divide-y divide-slate-50 shadow-sm">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-5 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tx.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                          {tx.amount > 0 ? <Plus className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-slate-900">{tx.description || tx.type}</p>
                          <p className="text-[11px] text-slate-400 font-bold uppercase tracking-tighter">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-black font-mono ${tx.amount > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} Kz
                        </p>
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 text-slate-400 px-2 mt-1">
                          {tx.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL CONFIGURAÇÕES */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-white border-none sm:rounded-3xl max-h-[90vh] overflow-y-auto w-full max-w-md p-6 shadow-2xl">
          <DialogHeader className="relative border-b border-slate-50 pb-5">
            <DialogTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
              <UserIcon className="w-6 h-6 text-emerald-600" /> Meu Perfil
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500 mt-1 font-medium">
              Atualize suas informações de rede social para validar as tarefas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-5 py-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Nome Operacional</Label>
              <Input 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
                className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-xl text-sm font-bold" 
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">WhatsApp / Telefone</Label>
              <Input 
                value={profilePhone} 
                onChange={(e) => setProfilePhone(e.target.value)}
                className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-xl text-sm font-bold" 
                required
              />
            </div>
            
            <div className="space-y-4 pt-2">
              <span className="text-[11px] font-black text-emerald-600 uppercase tracking-widest block">Canais de Trabalho</span>
              
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                   <img src="/tiktok-logo.png" alt="TikTok" className="w-3 h-3 object-contain" /> TikTok Handle
                </Label>
                <Input
                  value={profileTiktok}
                  onChange={(e) => setProfileTiktok(e.target.value)}
                  placeholder="@usuario"
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-11 rounded-xl text-sm font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                   <img src="/instagram-logo.png" alt="Instagram" className="w-3 h-3 object-contain" /> Instagram Handle
                </Label>
                <Input
                  value={profileInstagram}
                  onChange={(e) => setProfileInstagram(e.target.value)}
                  placeholder="@usuario"
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-11 rounded-xl text-sm font-bold"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                   <img src="/youtube-logo.png" alt="YouTube" className="w-3 h-3 object-contain" /> YouTube Channel
                </Label>
                <Input
                  value={profileYoutube}
                  onChange={(e) => setProfileYoutube(e.target.value)}
                  placeholder="URL ou @canal"
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-11 rounded-xl text-sm font-bold"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-50 flex flex-col gap-3">
              <Button 
                type="submit" 
                disabled={updatingProfile}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-12 rounded-2xl shadow-lg shadow-emerald-100 uppercase text-xs tracking-widest"
              >
                {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "SALVAR ALTERAÇÕES"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => signOut()}
                className="w-full text-red-500 hover:text-red-600 hover:bg-red-50 h-12 rounded-2xl font-black text-xs tracking-widest uppercase gap-2"
              >
                <LogOut className="w-4 h-4" /> ENCERRAR SESSÃO
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 z-40 px-4 py-3 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-around">
          
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex flex-col items-center justify-center transition-all w-20 ${
              activeTab === "tasks" ? "text-emerald-600 scale-110" : "text-slate-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "tasks" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400"}`}>
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Tarefas</span>
          </button>

          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex flex-col items-center justify-center transition-all w-20 ${
              activeTab === "campaigns" ? "text-emerald-600 scale-110" : "text-slate-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "campaigns" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400"}`}>
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Ações</span>
          </button>

          <button
            onClick={() => setActiveTab("affiliate")}
            className={`flex flex-col items-center justify-center transition-all w-20 ${
              activeTab === "affiliate" ? "text-emerald-600 scale-110" : "text-slate-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "affiliate" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400"}`}>
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Afiliado</span>
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex flex-col items-center justify-center transition-all w-20 ${
              activeTab === "wallet" ? "text-emerald-600 scale-110" : "text-slate-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "wallet" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400"}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Minha Conta</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
