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
  MoreVertical,
  HelpCircle,
  Shield,
  FileText,
  Info,
  Clock,
  MessageSquare,
  X,
  Eye,
  EyeOff,
  ShoppingCart,
  TrendingUp,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import LoComponent from "@/components/user/EngagementComponent"; // Lo (Ex-Engajamento)
import { toast } from "sonner";

import { UserCampaignsHub } from "@/components/user/UserCampaignsSection";
import { CommunityTasksSection } from "@/components/user/CommunityTasksSection";
import {
  Video as TiktokIcon,
  Instagram as InstagramIcon,
  User as UserIcon
} from "lucide-react";

import { SplashScreen } from "@/components/SplashScreen";

export default function UserAppPage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Navigation Tabs: "tasks" | "campaigns" | "affiliate" | "wallet" | "engagement"
  const [activeTab, setActiveTab] = useState<"tasks" | "campaigns" | "affiliate" | "wallet" | "engagement">("tasks");
  const [tasksSubTab, setTasksSubTab] = useState<"community" | "financial">("community");

  const [loading, setLoading] = useState(true);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [wallet, setWallet] = useState<{ id: string; balance: number; reserved_balance: number } | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [affiliate, setAffiliate] = useState<any | null>(null);

  // Profile overlay / Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isPrivacyOpen, setIsPrivacyOpen] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

  // Espelho de saldo ocultável na home
  const [hideBalanceHome, setHideBalanceHome] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [profileTiktok, setProfileTiktok] = useState("");
  const [profileInstagram, setProfileInstagram] = useState("");
  const [profileYoutube, setProfileYoutube] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Simulador de ganhos
  const [simulatorValue, setSimulatorValue] = useState(1);
  const EARNING_PER_MEMBER = 500;

  // Remitly dataset
  const REMITLY_COUNTRIES = {
    "Angola": {
      code: "+244",
      cities: ["Luanda", "Benguela", "Huambo", "Lubango", "Cabinda", "Soyo", "Malanje", "Kuito", "Uíge", "Namibe"]
    },
    "Brasil": {
      code: "+55",
      cities: ["São Paulo", "Rio de Janeiro", "Brasília", "Salvador", "Fortaleza", "Belo Horizonte", "Curitiba", "Manaus", "Recife", "Porto Alegre"]
    },
    "Portugal": {
      code: "+351",
      cities: ["Lisboa", "Porto", "Amadora", "Braga", "Coimbra", "Funchal", "Setúbal", "Vila Nova de Gaia", "Almada"]
    },
    "Moçambique": {
      code: "+258",
      cities: ["Maputo", "Matola", "Beira", "Nampula", "Chimoio", "Nacala", "Quelimane", "Tete"]
    },
    "Cabo Verde": {
      code: "+238",
      cities: ["Praia", "Mindelo", "Santa Maria", "Espargos", "Assomada", "Porto Novo"]
    }
  } as const;

  type RemitlyCountryKey = keyof typeof REMITLY_COUNTRIES;

  // Withdrawal form
  const [withdrawMethod, setWithdrawMethod] = useState<string>("express");
  const [withdrawAmount, setWithdrawAmount] = useState<string>("");
  const [withdrawIban, setWithdrawIban] = useState("");
  const [withdrawHolder, setWithdrawHolder] = useState("");
  const [withdrawPhone, setWithdrawPhone] = useState("");
  
  // Remitly specific fields
  const [remitlyFullName, setRemitlyFullName] = useState("");
  const [remitlyCountry, setRemitlyCountry] = useState<RemitlyCountryKey>("Angola");
  const [remitlyCity, setRemitlyCity] = useState("Luanda");
  const [remitlyPhone, setRemitlyPhone] = useState("+244 ");
  const [remitlyEmail, setRemitlyEmail] = useState("");
  const [remitlyDeliveryMethod, setRemitlyDeliveryMethod] = useState("Conta bancária");
  const [remitlyCurrency, setRemitlyCurrency] = useState("Kz (AOA)");
  
  const [isRequestingWithdraw, setIsRequestingWithdraw] = useState(false);
  const [hideTransactions, setHideTransactions] = useState(false);

  const handleRemitlyCountryChange = (country: RemitlyCountryKey) => {
    setRemitlyCountry(country);
    const countryData = REMITLY_COUNTRIES[country];
    if (countryData) {
      setRemitlyCity(countryData.cities[0]);
      setRemitlyPhone(countryData.code + " ");
    }
  };

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
      const p = profile as any;
      setProfileName(p.name || "");
      setProfilePhone(p.phone || "");
      setProfileLink(p.primary_link || "");
      setProfileTiktok(p.tiktok || "");
      setProfileInstagram(p.instagram || "");
      setProfileYoutube(p.youtube || "");
      setWithdrawHolder(p.name || "");
      setWithdrawPhone(p.phone || "");
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
      setIsFirstLoad(false);
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
      const details: any = {};
      if (withdrawMethod === 'iban') {
        details.titular = withdrawHolder;
        details.iban = withdrawIban;
      } else if (withdrawMethod === 'express' || withdrawMethod === 'unitel') {
        details.telefone = withdrawPhone;
      } else if (withdrawMethod === 'remitly') {
        details.remitly = {
          nome_beneficiario: remitlyFullName,
          pais: remitlyCountry,
          cidade: remitlyCity,
          telefone: remitlyPhone,
          email: remitlyEmail,
          metodo_recebimento: remitlyDeliveryMethod,
          moeda_recebimento: remitlyCurrency
        };
      }

      const { data, error: wError } = await supabase.rpc("request_withdrawal", {
        p_amount: amount,
        p_method: withdrawMethod.toUpperCase(),
        p_payment_details: details
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

  if (isFirstLoad || loading) {
    return <SplashScreen message="Carregando aplicativo..." />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased overflow-x-hidden select-none pb-24">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between backdrop-blur-md bg-white/90">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-100 overflow-hidden bg-emerald-600">
            <img src="/logo.png" alt="ADX" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 leading-none">
              ADXmoney <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">v2</span>
            </h1>
            <p className="text-[12px] text-slate-500 font-medium mt-1">
              Operador: <span className="text-emerald-600 font-semibold">{profile?.name?.split(' ')[0] || "Usuário"}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Espelho do Saldo Resumido no Topo Direto da Home */}
          <div className="flex flex-col items-end bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setHideBalanceHome(!hideBalanceHome)}
                className="text-slate-400 hover:text-emerald-600 transition-colors"
                title={hideBalanceHome ? "Mostrar saldo" : "Ocultar saldo"}
              >
                {hideBalanceHome ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">Saldo</span>
            </div>
            <span className="text-sm font-bold text-emerald-600">
              {hideBalanceHome ? "••••" : `${wallet ? wallet.balance.toLocaleString("pt-PT", { maximumFractionDigits: 0 }) : "0"} Kz`}
            </span>
          </div>

          <button
            onClick={() => setIsMenuOpen(true)}
            className="w-10 h-10 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-center text-slate-600 transition-all active:scale-95 border border-slate-100 shadow-sm"
          >
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full mx-auto max-w-4xl px-4 py-6 space-y-8">

        {/* 1. ABA: TAREFAS */}
        {activeTab === "tasks" && (
          <div className="space-y-8">
            {/* Seletor Segmentado */}
            <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm">
              <button
                onClick={() => setTasksSubTab("community")}
                className={`flex-1 py-2.5 text-[13px] font-semibold rounded-xl transition-all ${
                  tasksSubTab === "community"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Comunitárias
              </button>
              <button
                onClick={() => setTasksSubTab("financial")}
                className={`flex-1 py-2.5 text-[13px] font-semibold rounded-xl transition-all ${
                  tasksSubTab === "financial"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                Tarefas Financeiras
              </button>
            </div>

            {tasksSubTab === "financial" ? (
              <div className="space-y-6">
                <div className="px-1">
                  <h2 className="text-xl font-bold text-slate-900 flex items-center gap-3">
                    <Layers className="w-6 h-6 text-emerald-600" /> Atividades Disponíveis
                  </h2>
                  <p className="text-[15px] text-slate-500 mt-2 font-normal">Conclua as tarefas para creditar o seu saldo em tempo real.</p>
                </div>

                {campaigns.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-[24px] py-20 text-center shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Layers className="w-10 h-10 text-slate-300" />
                    </div>
                    <p className="text-base text-slate-700 font-semibold uppercase tracking-tight">Sem tarefas financeiras no momento</p>
                    <p className="text-sm text-slate-400 mt-2">Aguarde novas oportunidades de ganhos.</p>
                  </div>
                ) : (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {campaigns.map((c) => (
                      <div key={c.id} className="bg-white border border-slate-100 rounded-[24px] p-6 flex flex-col justify-between hover:shadow-2xl hover:shadow-slate-200/50 transition-all shadow-xl shadow-slate-200/20 group">
                        <div>
                          <div className="flex justify-between items-start mb-4">
                            <Badge className="text-[10px] uppercase font-bold border-none text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
                              {c.platform}
                            </Badge>
                            <span className="text-xl font-bold text-emerald-600 font-mono">
                              +{c.reward_amount.toLocaleString()} Kz
                            </span>
                          </div>
                          <h3 className="text-[15px] font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{c.title}</h3>
                          <p className="text-sm text-slate-500 mt-3 line-clamp-2 leading-relaxed font-normal">{c.description}</p>
                        </div>
                        
                        <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                          <Badge className={c.assignment_status === 'COMPLETED' ? 'bg-slate-100 text-slate-500 border-none px-3 py-1 font-semibold' : 'bg-lime-400 text-slate-900 border-none px-3 py-1 font-bold'}>
                            {c.assignment_status === 'COMPLETED' ? 'Finalizada' : 'Disponível'}
                          </Badge>
                          <Button size="sm" className="h-10 text-[13px] font-semibold bg-slate-900 hover:bg-emerald-600 text-white rounded-xl shadow-lg transition-all px-6" asChild>
                            <a href={c.target_url} target="_blank" rel="noreferrer">
                              EXECUTAR <ExternalLink className="w-4 h-4 ml-2" />
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
          <div className="space-y-6">
            <UserCampaignsSection userId={user.id} />
          </div>
        )}

        {/* 3. ABA: AFILIADOS (DESIGN APP NATIVO) */}
        {activeTab === "affiliate" && (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Card Principal / Saldo de Afiliado */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 rounded-3xl p-6 text-white shadow-xl shadow-emerald-200/50 relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-white/20 text-white border-none text-[10px] font-black uppercase tracking-widest px-3 py-1 backdrop-blur-md">
                    Programa de Indicação
                  </Badge>
                  <Gift className="w-5 h-5 text-emerald-200" />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">Minha Rede</span>
                    <span className="text-2xl font-black tracking-tight text-white mt-0.5 block">{affiliate?.total_referrals || 0} <span className="text-xs font-medium text-emerald-200">membros</span></span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-emerald-200 uppercase tracking-widest block">Comissões Acumuladas</span>
                    <span className="text-2xl font-black tracking-tight text-white mt-0.5 block">
                      {Number(affiliate?.total_earned || 0).toLocaleString("pt-AO")} <span className="text-xs font-medium text-emerald-200">Kz</span>
                    </span>
                  </div>
                </div>

                {/* Bloco de Código e Link Nativo */}
                <div className="bg-black/20 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 space-y-2">
                  <span className="text-[10px] text-emerald-200 font-bold uppercase block">Seu Link de Convite Nativo</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={getReferralLink()}
                      className="bg-transparent text-xs font-mono font-bold text-white flex-1 outline-none truncate"
                    />
                    <Button
                      onClick={() => copyToClipboard(getReferralLink(), "Link de Indicação")}
                      className="h-8 px-3 bg-white text-emerald-800 hover:bg-emerald-50 font-black text-[10px] rounded-xl shadow-sm shrink-0 uppercase tracking-wider"
                    >
                      Copiar
                    </Button>
                  </div>
                </div>
              </div>
              <Gift className="absolute -right-6 -bottom-6 w-36 h-36 text-white/10 pointer-events-none rotate-12" />
            </div>

            {/* Banner de Funcionamento Estilo App */}
            <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-900 block">Comissão Direta de 500 Kz</span>
                <p className="text-[11px] text-slate-500 font-medium">Ganhe por cada novo membro cadastrado com o seu link.</p>
              </div>
            </div>

            {/* Simulador Estilo Mobile */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 uppercase tracking-tight">Simulador de Rendimentos</span>
                <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl">
                  {simulatorValue.toLocaleString()} membros
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="5000"
                step="5"
                value={simulatorValue}
                onChange={(e) => setSimulatorValue(parseInt(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 rounded-lg"
              />

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Rendimento Estimado</span>
                  <span className="text-xl font-black text-slate-900 font-mono">
                    {(simulatorValue * EARNING_PER_MEMBER).toLocaleString("pt-AO")} Kz
                  </span>
                </div>
                <Users className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            </div>
          </div>
        )}

        {/* ABA: LO (COMPRA & HISTORICO) */}
        {activeTab === "engagement" && (
          <LoComponent />
        )}

        {/* 4. ABA: CARTEIRA */}
        {activeTab === "wallet" && (
          <div className="space-y-6">
            {/* Card de Saldo */}
            <div className="bg-white border border-slate-200/80 rounded-[24px] p-8 shadow-xl shadow-slate-200/40 relative overflow-hidden">
              <div className="absolute right-6 top-6">
                <span className="text-[11px] bg-emerald-600 text-white px-3 py-1 rounded-full font-semibold uppercase tracking-wider shadow-sm">
                  Operacional
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-[13px] font-semibold uppercase text-slate-400 tracking-wider">Saldo Disponível para Saque</p>
                <p className="text-4xl font-bold text-slate-900 font-mono tracking-tight">
                  {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-xl font-normal text-slate-400">Kz</span>
                </p>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 font-normal">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-slate-400" />
                  Saldo em processamento: <span className="font-semibold text-slate-700">{(wallet?.reserved_balance || 0).toLocaleString()} Kz</span>
                </span>
              </div>
            </div>

            {/* Formulário de Levantamento */}
            <div className="bg-white border border-slate-200/80 rounded-[24px] p-8 shadow-xl shadow-slate-200/40 space-y-6">
              <h3 className="text-base font-semibold text-slate-900">Solicitar Pagamento</h3>
              
              <form onSubmit={handleRequestWithdraw} className="space-y-6">
                <div className="space-y-3">
                  <Label className="text-[13px] font-semibold text-slate-600 ml-1">Escolha o Método</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'express', label: 'Multicaixa Express', icon: '/icons/express.jpg' },
                      { id: 'unitel', label: 'Unitel Money', icon: '/icons/unitel.jpg' },
                      { id: 'iban', label: 'Transferência (IBAN)', icon: '/icons/iban.jpg' },
                      { id: 'remitly', label: 'Remitly', icon: '/icons/remitly.jpg' }
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setWithdrawMethod(method.id)}
                        className={`flex items-center justify-center gap-3 p-3.5 rounded-xl border transition-all ${
                          withdrawMethod === method.id
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={method.icon}
                          alt={method.label}
                          className="w-7 h-7 object-cover rounded-md shadow-sm border border-slate-100/20 shrink-0"
                        />
                        <span className="text-xs font-semibold">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-semibold text-slate-600 ml-1">Valor do Saque</Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="Mínimo 1.000 Kz"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="bg-slate-50 border-slate-200 focus:bg-white focus:border-emerald-500 h-12 font-mono text-xl font-bold text-slate-900 rounded-xl px-4"
                      required
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-sm">Kz</span>
                  </div>
                </div>

                {/* Formulários Dinâmicos */}
                {withdrawMethod === 'iban' && (
                  <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-slate-600 ml-1">Titular da Conta</Label>
                      <Input
                        value={withdrawHolder}
                        onChange={(e) => setWithdrawHolder(e.target.value)}
                        className="bg-white border-slate-200 text-base font-normal h-11 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-slate-600 ml-1">IBAN para Crédito</Label>
                      <Input
                        placeholder="AO06..."
                        value={withdrawIban}
                        onChange={(e) => setWithdrawIban(e.target.value)}
                        className="bg-white border-slate-200 font-mono text-base font-normal h-11 rounded-xl"
                      />
                    </div>
                  </div>
                )}

                {(withdrawMethod === 'express' || withdrawMethod === 'unitel') && (
                  <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <Label className="text-[13px] font-semibold text-slate-600 ml-1">Número de Telefone</Label>
                    <Input
                      placeholder="9xx xxx xxx"
                      value={withdrawPhone}
                      onChange={(e) => setWithdrawPhone(e.target.value)}
                      className="bg-white border-slate-200 font-mono text-base font-normal h-11 rounded-xl mt-1.5"
                    />
                  </div>
                )}

                {withdrawMethod === 'remitly' && (
                  <div className="space-y-4 p-5 bg-slate-50 rounded-xl border border-slate-200/60">
                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-slate-600 ml-1">Nome completo do beneficiário</Label>
                      <Input
                        placeholder="Nome completo"
                        value={remitlyFullName}
                        onChange={(e) => setRemitlyFullName(e.target.value)}
                        className="bg-white border-slate-200 text-base font-normal h-11 rounded-xl"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-slate-600 ml-1">País do beneficiário</Label>
                        <select
                          value={remitlyCountry}
                          onChange={(e) => handleRemitlyCountryChange(e.target.value as any)}
                          className="w-full bg-white border border-slate-200 text-sm h-11 rounded-xl px-3 outline-none focus:border-emerald-500 text-slate-700 font-medium"
                          required
                        >
                          {Object.keys(REMITLY_COUNTRIES).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-[13px] font-semibold text-slate-600 ml-1">Cidade</Label>
                        <select
                          value={remitlyCity}
                          onChange={(e) => setRemitlyCity(e.target.value)}
                          className="w-full bg-white border border-slate-200 text-sm h-11 rounded-xl px-3 outline-none focus:border-emerald-500 text-slate-700 font-medium"
                          required
                        >
                          {REMITLY_COUNTRIES[remitlyCountry]?.cities.map((city) => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-slate-600 ml-1">Número de Telefone</Label>
                      <Input
                        placeholder="Telefone do beneficiário"
                        value={remitlyPhone}
                        onChange={(e) => setRemitlyPhone(e.target.value)}
                        className="bg-white border-slate-200 font-mono text-base font-normal h-11 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-[13px] font-semibold text-slate-600 ml-1">E-mail</Label>
                      <Input
                        type="email"
                        placeholder="exemplo@email.com"
                        value={remitlyEmail}
                        onChange={(e) => setRemitlyEmail(e.target.value)}
                        className="bg-white border-slate-200 text-base font-normal h-11 rounded-xl"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Método de recebimento</Label>
                      <div className="grid grid-cols-3 gap-1.5">
                        {["Conta bancária", "Carteira móvel", "Levantamento em dinheiro"].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => setRemitlyDeliveryMethod(m)}
                            className={`p-2 rounded-xl border text-center text-[8px] font-black uppercase tracking-tight transition-all ${
                              remitlyDeliveryMethod === m
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-50"
                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                            }`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase text-slate-500">Moeda de recebimento</Label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {["Kz (AOA)", "USD", "EUR", "BRL"].map((curr) => (
                          <button
                            key={curr}
                            type="button"
                            onClick={() => setRemitlyCurrency(curr)}
                            className={`p-2 rounded-xl border text-center text-[9px] font-black tracking-tight transition-all ${
                              remitlyCurrency === curr
                                ? "bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-50"
                                : "bg-white border-slate-100 text-slate-600 hover:border-slate-200"
                            }`}
                          >
                            {curr}
                          </button>
                        ))}
                      </div>
                    </div>
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

            {/* Histórico com Ocultar Movimentações */}
            <div className="space-y-4">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Extrato de Movimentações</h3>
                <button
                  type="button"
                  onClick={() => setHideTransactions(!hideTransactions)}
                  className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-emerald-600 bg-slate-100 hover:bg-slate-200/80 px-2.5 py-1 rounded-xl transition-all"
                >
                  {hideTransactions ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Mostrar Movimentação</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                      <span>Ocultar Movimentação</span>
                    </>
                  )}
                </button>
              </div>
              
              {!hideTransactions && (
                transactions.length === 0 ? (
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
                )
              )}
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
      {/* Modal / Sheet do Menu Três Pontos */}
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent className="bg-white rounded-3xl border-none max-w-[90vw] sm:max-w-sm p-4 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="pb-2 border-b border-slate-100 pr-8">
            <DialogTitle className="text-base font-black text-slate-900 tracking-tight">Menu Principal</DialogTitle>
            <DialogDescription className="text-[10px] text-slate-400">
              Opções e recursos ADXmoney
            </DialogDescription>
          </div>

          <div className="space-y-1.5 py-3">
            <button
              onClick={() => { setIsMenuOpen(false); setIsNotificationsOpen(true); }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all font-bold text-xs text-slate-700 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Bell className="w-4.5 h-4.5" />
                </div>
                <span className="truncate">Notificações</span>
              </div>
              <span className="text-[10px] text-emerald-600 font-bold shrink-0">Ver avisos</span>
            </button>

            <button
              onClick={() => { setIsMenuOpen(false); setIsSettingsOpen(true); }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all font-bold text-xs text-slate-700 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Settings className="w-4.5 h-4.5" />
                </div>
                <span className="truncate">Configurações</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Editar perfil</span>
            </button>

            <button
              onClick={() => { setIsMenuOpen(false); setIsHistoryOpen(true); }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all font-bold text-xs text-slate-700 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Clock className="w-4.5 h-4.5" />
                </div>
                <span className="truncate">Histórico</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Atividades</span>
            </button>

            <button
              onClick={() => { setIsMenuOpen(false); setIsSupportOpen(true); }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all font-bold text-xs text-slate-700 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4.5 h-4.5" />
                </div>
                <span className="truncate">Apoio ao Cliente</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">WhatsApp</span>
            </button>

            <button
              onClick={() => { setIsMenuOpen(false); setIsAboutOpen(true); }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all font-bold text-xs text-slate-700 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Info className="w-4.5 h-4.5" />
                </div>
                <span className="truncate">Sobre ADXmoney</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Info</span>
            </button>

            <button
              onClick={() => { setIsMenuOpen(false); setIsPrivacyOpen(true); }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all font-bold text-xs text-slate-700 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Shield className="w-4.5 h-4.5" />
                </div>
                <span className="truncate">Privacidade e Termos</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Regras</span>
            </button>

            <button
              onClick={() => { setIsMenuOpen(false); setIsFaqOpen(true); }}
              className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 border border-transparent transition-all font-bold text-xs text-slate-700 gap-2"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <HelpCircle className="w-4.5 h-4.5" />
                </div>
                <span className="truncate">Perguntas Frequentes</span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium shrink-0">Dúvidas</span>
            </button>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <Button
              onClick={() => { setIsMenuOpen(false); signOut(); }}
              variant="destructive"
              className="w-full h-11 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-black text-[11px] uppercase tracking-widest gap-2 border border-rose-200 transition-all active:scale-95"
            >
              <LogOut className="w-4 h-4" /> Terminar Sessão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Notificações */}
      <Dialog open={isNotificationsOpen} onOpenChange={setIsNotificationsOpen}>
        <DialogContent className="bg-white rounded-3xl border-none max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Notificações</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Avisos e atualizações recentes da sua conta ADXmoney.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex gap-3">
              <Bell className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-slate-900">Bem-vindo à nova versão ADXmoney</h4>
                <p className="text-[11px] text-slate-600 mt-1">Explore campanhas, conclua tarefas de comunidade e aumente seus ganhos diários.</p>
                <span className="text-[9px] text-emerald-600 font-bold uppercase mt-2 block">Hoje</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Histórico */}
      <Dialog open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
        <DialogContent className="bg-white rounded-3xl border-none max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Histórico de Atividades</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Suas últimas transações e movimentações financeiras.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto space-y-3">
            {transactions.length === 0 ? (
              <p className="text-center text-xs text-slate-400 py-8">Nenhuma transação recente encontrada.</p>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{tx.description || tx.type}</h4>
                    <span className="text-[10px] text-slate-400">{new Date(tx.created_at).toLocaleDateString()}</span>
                  </div>
                  <span className={`text-xs font-black ${tx.amount > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                    {tx.amount > 0 ? "+" : ""}{tx.amount} Kz
                  </span>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Suporte */}
      <Dialog open={isSupportOpen} onOpenChange={setIsSupportOpen}>
        <DialogContent className="bg-white rounded-3xl border-none max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Apoio ao Cliente</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Precisa de ajuda? Fale diretamente com nossa equipe via WhatsApp.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 space-y-4 text-center">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto">
              <MessageSquare className="w-8 h-8" />
            </div>
            <p className="text-xs text-slate-600 font-medium">
              Nosso atendimento funciona de segunda a sábado das 08h às 20h.
            </p>
            <Button
              onClick={() => window.open("https://wa.me/244923000000?text=Olá,%20preciso%20de%20suporte%20no%20ADXmoney", "_blank")}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest gap-2 shadow-lg shadow-emerald-600/20"
            >
              Abrir WhatsApp de Suporte
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Sobre */}
      <Dialog open={isAboutOpen} onOpenChange={setIsAboutOpen}>
        <DialogContent className="bg-white rounded-3xl border-none max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Sobre a ADXmoney</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Conectando anunciantes e operadores na maior plataforma de engajamento.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
            <p>A ADXmoney é uma plataforma digital inovadora focada em impulsionar campanhas de marketing de forma colaborativa e segura.</p>
            <p>Versão atual: 2.0.0 (Build 2026)</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Privacidade e Termos */}
      <Dialog open={isPrivacyOpen} onOpenChange={setIsPrivacyOpen}>
        <DialogContent className="bg-white rounded-3xl border-none max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Privacidade e Termos</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Termos de uso e diretrizes de privacidade da plataforma.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto space-y-3 text-xs text-slate-600 leading-relaxed font-medium">
            <p>1. Ao utilizar a ADXmoney, você concorda em cumprir todas as diretrizes operacionais.</p>
            <p>2. É estritamente proibido o uso de contas falsas ou bots para a conclusão de tarefas.</p>
            <p>3. Os pagamentos são processados após verificação dos requisitos de cada campanha.</p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal FAQ / Perguntas Frequentes */}
      <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
        <DialogContent className="bg-white rounded-3xl border-none max-w-lg p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900">Perguntas Frequentes (FAQ)</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Respostas para as dúvidas mais comuns dos operadores.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 max-h-[60vh] overflow-y-auto space-y-4">
            <div className="p-3.5 rounded-2xl bg-slate-50 space-y-1">
              <h4 className="text-xs font-black text-slate-900">Como começo a ganhar?</h4>
              <p className="text-[11px] text-slate-600">Acesse a aba Tarefas ou Campanhas, escolha uma tarefa disponível, realize a ação solicitada e envie a comprovação.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 space-y-1">
              <h4 className="text-xs font-black text-slate-900">Quanto tempo demoram os levantamentos?</h4>
              <p className="text-[11px] text-slate-600">Os levantamentos são processados em até 24 horas úteis diretamente para sua conta bancária ou Multicaixa Express.</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 space-y-1">
              <h4 className="text-xs font-black text-slate-900">Como funciona o programa de afiliados?</h4>
              <p className="text-[11px] text-slate-600">Compartilhe seu link de convite exclusivo. Você ganha comissões em cima de cada tarefa concluída pelos seus indicados.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
            onClick={() => setActiveTab("engagement")}
            className={`flex flex-col items-center justify-center transition-all w-20 ${
              activeTab === "engagement" ? "text-emerald-600 scale-110" : "text-slate-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl transition-all ${activeTab === "engagement" ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400"}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">Loja</span>
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
