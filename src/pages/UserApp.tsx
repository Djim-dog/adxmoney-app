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
  Lock,
  Megaphone,
  Info,
  Settings,
  Bell,
  CheckCircle,
  HelpCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

import { UserCampaignsHub } from "@/components/user/UserCampaignsHub";
import { CommunityTasksSection } from "@/components/user/CommunityTasksSection";
import {
  Video as TiktokIcon,
  Instagram as InstagramIcon,
  Youtube as YoutubeIcon
} from "lucide-react";

export default function UserAppPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Android Navigation Tabs: "tasks" | "campaigns" | "affiliate" | "wallet"
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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans antialiased overflow-x-hidden select-none pb-24">
      
      {/* Header Nativo Android-Style */}
      <header className="sticky top-0 z-40 bg-slate-900 border-b border-slate-800/80 px-4 py-3.5 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-900/30">
            <img src="/logo.png" alt="ADX" className="h-5 w-auto" />
          </div>
          <div>
            <h1 className="text-sm font-black text-white tracking-tight flex items-center gap-1.5 leading-none">
              ADXmoney <span className="text-[9px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider font-mono">v2</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium mt-0.5">
              Olá, <span className="text-slate-200 font-bold">{profile?.name?.split(' ')[0] || "Operador"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Botão Notificação (Estilo Android) */}
          <button 
            onClick={() => toast.info("Não tem notificações novas no momento.")}
            className="w-9 h-9 rounded-xl bg-slate-800/50 hover:bg-slate-800 flex items-center justify-center text-slate-300 transition-all active:scale-95"
          >
            <Bell className="w-4 h-4" />
          </button>

          {/* Avatar/Perfil do Usuário (Substitui a 5ª Aba de Conta) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="w-9 h-9 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 transition-all active:scale-95"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Container - Android-Style Viewport Expandido */}
      <main className="flex-1 w-full mx-auto max-w-4xl px-4 py-5 space-y-6">

        {/* 1. ABA: TAREFAS */}
        {activeTab === "tasks" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            {/* Seletor Segmentado Nativo Android */}
            <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shadow-inner">
              <button
                onClick={() => setTasksSubTab("financial")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  tasksSubTab === "financial"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Tarefas Operacionais
              </button>
              <button
                onClick={() => setTasksSubTab("community")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  tasksSubTab === "community"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-950/40"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                Comunitárias
              </button>
            </div>

            {tasksSubTab === "financial" ? (
              <div className="space-y-4">
                <div className="px-1">
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    <Layers className="w-5 h-5 text-indigo-400" /> Tarefas Remuneradas
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Siga, curta ou comente para receber recompensas em tempo real.</p>
                </div>

                {campaigns.length === 0 ? (
                  <div className="bg-slate-900/40 border border-dashed border-slate-800/80 rounded-2xl py-14 text-center">
                    <Layers className="w-10 h-10 text-slate-700 mx-auto mb-3 opacity-35" />
                    <p className="text-xs text-slate-400 font-medium">Sem tarefas financeiras no momento.</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Volte mais tarde para novas oportunidades.</p>
                  </div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {campaigns.map((c) => (
                      <div key={c.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-sm">
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-[9px] uppercase font-bold border-indigo-500/20 text-indigo-400 bg-indigo-500/5 px-2 py-0.5 h-auto">
                              {c.platform}
                            </Badge>
                            <span className="text-sm font-black text-emerald-400 font-mono">
                              +{c.reward_amount.toLocaleString()} Kz
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-100 line-clamp-1">{c.title}</h3>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">{c.description}</p>
                        </div>
                        
                        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between">
                          <Badge className={c.assignment_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/10 border-none px-2 py-0.5' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/10 border-none px-2 py-0.5'}>
                            {c.assignment_status === 'COMPLETED' ? 'Concluída' : 'Pendente'}
                          </Badge>
                          <Button size="sm" className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl shadow-md" asChild>
                            <a href={c.target_url} target="_blank" rel="noreferrer">
                              Abrir <ExternalLink className="w-3 h-3 ml-1.5" />
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
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="px-1">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-indigo-400" /> Hub de Campanhas
              </h2>
              <p className="text-xs text-slate-400 mt-1">Explore e participe de campanhas de marketing estruturadas.</p>
            </div>
            <UserCampaignsHub userId={user.id} />
          </div>
        )}

        {/* 3. ABA: AFILIADO */}
        {activeTab === "affiliate" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="px-1">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Gift className="w-5 h-5 text-indigo-400" /> Rede de Afiliados
              </h2>
              <p className="text-xs text-slate-400 mt-1">Indique novos operadores e fature comissão diretamente em saldo.</p>
            </div>

            {/* Card de Informações/Estatísticas Finas */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 relative overflow-hidden shadow-md">
              <div className="absolute right-[-10px] top-[-10px] opacity-[0.03]">
                <Gift className="w-32 h-32" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Convidados</p>
                  <p className="text-2xl font-black text-white font-mono mt-1">{affiliate?.total_referrals || 0}</p>
                </div>
                <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/40">
                  <p className="text-[10px] uppercase font-bold text-slate-400">Total Faturado</p>
                  <p className="text-2xl font-black text-emerald-400 font-mono mt-1">
                    {Number(affiliate?.total_earned || 0).toLocaleString()} Kz
                  </p>
                </div>
              </div>

              {/* Bloco do Código */}
              <div className="mt-5 space-y-2">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Código de Indicação</Label>
                <div className="flex gap-2">
                  <div className="flex-1 h-11 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-center font-mono text-base font-bold text-indigo-400 tracking-wider">
                    {profile?.referral_code || "---"}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(profile?.referral_code || "", "Código")}
                    className="h-11 w-11 border-slate-800 bg-slate-900 text-slate-300 rounded-xl hover:bg-slate-800"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-1">
                <Button 
                  onClick={() => copyToClipboard(getReferralLink(), "Link de Indicação")}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Copiar Link Completo
                </Button>
              </div>
            </div>

            {/* Regras Operacionais de Afiliados */}
            <div className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-4 space-y-2">
              <h4 className="text-xs font-bold text-slate-200">Como funciona o bónus?</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Compartilhe o seu link exclusivo. Quando um convidado se cadastrar e começar a operar na plataforma realizando tarefas, você recebe as recompensas em sua carteira automaticamente.
              </p>
            </div>
          </div>
        )}

        {/* 4. ABA: CARTEIRA */}
        {activeTab === "wallet" && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="px-1">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-indigo-400" /> Minha Carteira
              </h2>
              <p className="text-xs text-slate-400 mt-1">Gerencie suas finanças, solicite levantamentos e veja sua atividade recente.</p>
            </div>

            {/* Card de Saldo Moderno */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative overflow-hidden">
              <div className="absolute right-4 top-4">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                  SLA 24H Úteis
                </span>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-slate-400">Saldo Disponível</p>
                <p className="text-3xl font-black text-white font-mono">
                  {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-base font-normal text-slate-400">Kz</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-500" />
                  Ganhos retidos: <span className="font-mono text-slate-200">{(wallet?.reserved_balance || 0).toLocaleString()} Kz</span>
                </span>
              </div>
            </div>

            {/* Formulário de Levantamento Avançado */}
            <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-5 shadow-md space-y-4">
              <h3 className="text-xs font-extrabold text-slate-200 uppercase tracking-wider">Solicitar Levantamento</h3>
              
              <form onSubmit={handleRequestWithdraw} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-300">Método de Pagamento</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'express', label: 'Express', img: '/icon-express.jpg' },
                      { id: 'unitel', label: 'Unitel Money', img: '/icon-unitel.jpg' },
                      { id: 'iban', label: 'IBAN', img: '/icon-iban.jpg' },
                      { id: 'pix', label: 'PIX', img: '/icon-pix.jpg' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setWithdrawMethod(method.id)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all ${
                          withdrawMethod === method.id
                            ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400'
                            : 'bg-slate-950 border-slate-800/80 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <img src={method.img} alt={method.label} className="w-5 h-5 rounded-md object-cover" />
                        <span className="text-xs font-bold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">Valor</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Ex: 5000"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-slate-950 border-slate-800/80 h-10 font-mono text-base text-emerald-400 focus:border-indigo-500"
                      required
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Kz</span>
                  </div>
                </div>

                {/* Formulários Dinâmicos Android-Style */}
                {withdrawMethod === 'iban' && (
                  <div className="space-y-3 p-4 bg-slate-950/80 rounded-xl border border-slate-800/60 animate-in fade-in duration-200">
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Titular da Conta Bancária</Label>
                      <Input 
                        value={withdrawHolder} 
                        onChange={(e) => setWithdrawHolder(e.target.value)}
                        className="bg-slate-900 border-slate-800 text-xs h-9" 
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[10px] uppercase font-bold text-slate-400">Número do IBAN</Label>
                      <Input 
                        placeholder="AO06..." 
                        value={withdrawIban}
                        onChange={(e) => setWithdrawIban(e.target.value)}
                        className="bg-slate-900 border-slate-800 font-mono text-xs h-9" 
                      />
                    </div>
                  </div>
                )}

                {(withdrawMethod === 'express' || withdrawMethod === 'unitel') && (
                  <div className="space-y-1.5 p-4 bg-slate-950/80 rounded-xl border border-slate-800/60 animate-in fade-in duration-200">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Número de Telefone Associado</Label>
                    <Input 
                      placeholder="9..." 
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="bg-slate-900 border-slate-800 font-mono text-xs h-9" 
                    />
                  </div>
                )}

                {withdrawMethod === 'pix' && (
                  <div className="space-y-1.5 p-4 bg-slate-950/80 rounded-xl border border-slate-800/60 animate-in fade-in duration-200">
                    <Label className="text-[10px] uppercase font-bold text-slate-400">Chave PIX (E-mail, CPF ou Telefone)</Label>
                    <Input 
                      placeholder="Digite a chave pix" 
                      value={withdrawPix}
                      onChange={(e) => setWithdrawPix(e.target.value)}
                      className="bg-slate-900 border-slate-800 text-xs h-9" 
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isRequestingWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > (wallet?.balance || 0)}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-11 rounded-xl shadow-lg transition-all"
                >
                  {isRequestingWithdraw ? <Loader2 className="w-5 h-5 animate-spin" /> : "Solicitar Saque"}
                </Button>
              </form>
            </div>

            {/* Extrato Nativo / Transações */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">Histórico de Transações</h3>
              
              {transactions.length === 0 ? (
                <div className="bg-slate-900/20 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-500 italic">
                  Nenhuma transação encontrada.
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden divide-y divide-slate-800/60 shadow-md">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                      <div className="flex gap-3">
                        <div className={`p-2 rounded-xl h-fit ${tx.amount > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                          {tx.amount > 0 ? <Plus className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-100">{tx.description || tx.type}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{new Date(tx.created_at).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-mono font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount > 0 ? '+' : ''}{tx.amount.toLocaleString()} Kz
                        </p>
                        <span className="text-[8px] font-bold uppercase tracking-wider bg-slate-800 px-1.5 py-0.5 rounded-full text-slate-400">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* MODAL CONFIGURAÇÕES / MEU PERFIL (Estilo Slide-Up / Bottom-Sheet Android) */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl max-h-[85vh] overflow-y-auto w-full max-w-md p-5 shadow-2xl">
          <DialogHeader className="relative border-b border-slate-800 pb-3">
            <DialogTitle className="text-base font-extrabold text-white flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-indigo-400" /> Configurações de Perfil
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-400 mt-1">
              Mantenha seus dados e redes sociais atualizados para validações de tarefas.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleUpdateProfile} className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Nome Completo</Label>
              <Input 
                value={profileName} 
                onChange={(e) => setProfileName(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-10 focus:border-indigo-500" 
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] uppercase font-bold text-slate-400">Telefone / WhatsApp</Label>
              <Input 
                value={profilePhone} 
                onChange={(e) => setProfilePhone(e.target.value)}
                className="bg-slate-950 border-slate-800 text-xs h-10 focus:border-indigo-500" 
                required
              />
            </div>
            
            <div className="space-y-3 pt-1">
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block">Perfis Sociais</span>
              
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400">TikTok Handle</Label>
                <div className="relative">
                  <TiktokIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <Input
                    value={profileTiktok}
                    onChange={(e) => setProfileTiktok(e.target.value)}
                    placeholder="@usuario"
                    className="bg-slate-950 border-slate-800 text-xs h-10 pl-9 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Instagram Handle</Label>
                <div className="relative">
                  <InstagramIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <Input
                    value={profileInstagram}
                    onChange={(e) => setProfileInstagram(e.target.value)}
                    placeholder="@usuario"
                    className="bg-slate-950 border-slate-800 text-xs h-10 pl-9 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Canal YouTube</Label>
                <div className="relative">
                  <YoutubeIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                  <Input
                    value={profileYoutube}
                    onChange={(e) => setProfileYoutube(e.target.value)}
                    placeholder="URL ou @canal"
                    className="bg-slate-950 border-slate-800 text-xs h-10 pl-9 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase font-bold text-slate-400">Rede Social Principal (Geral)</Label>
                <Input
                  value={profileLink}
                  onChange={(e) => setProfileLink(e.target.value)}
                  placeholder="Link de perfil principal"
                  className="bg-slate-950 border-slate-800 text-xs h-10 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2">
              <Button 
                type="submit" 
                disabled={updatingProfile}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold h-10 rounded-xl"
              >
                {updatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : "Salvar Alterações"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => signOut()}
                className="w-full text-rose-500 hover:text-rose-400 hover:bg-rose-500/5 h-10 rounded-xl font-bold gap-2"
              >
                <LogOut className="w-4 h-4" /> Encerrar Sessão
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bottom Navigation Nativo Android */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 z-40 px-4 py-2.5 shadow-2xl">
        <div className="max-w-xl mx-auto flex items-center justify-around">
          
          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex flex-col items-center justify-center transition-all w-16 ${
              activeTab === "tasks" ? "text-indigo-400 scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === "tasks" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500"}`}>
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-extrabold tracking-tight">Tarefas</span>
          </button>

          <button
            onClick={() => setActiveTab("campaigns")}
            className={`flex flex-col items-center justify-center transition-all w-16 ${
              activeTab === "campaigns" ? "text-indigo-400 scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === "campaigns" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500"}`}>
              <Megaphone className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-extrabold tracking-tight">Campanhas</span>
          </button>

          <button
            onClick={() => setActiveTab("affiliate")}
            className={`flex flex-col items-center justify-center transition-all w-16 ${
              activeTab === "affiliate" ? "text-indigo-400 scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === "affiliate" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500"}`}>
              <Gift className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-extrabold tracking-tight">Afiliado</span>
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex flex-col items-center justify-center transition-all w-16 ${
              activeTab === "wallet" ? "text-indigo-400 scale-105" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            <div className={`p-1 rounded-xl transition-all ${activeTab === "wallet" ? "bg-indigo-500/10 text-indigo-400" : "text-slate-500"}`}>
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-extrabold tracking-tight">Carteira</span>
          </button>

        </div>
      </nav>

    </div>
  );
}
