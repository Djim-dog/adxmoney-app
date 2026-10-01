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
  CheckCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  Share2,
  ExternalLink,
  Shield,
  Loader2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  // Profile editing state
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileLink, setProfileLink] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileName(profile.name || "");
      setProfilePhone(profile.phone || "");
      setProfileLink(profile.primary_link || "");
    }
  }, [profile]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Wallets
      const { data: wData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (wData) {
        setWallet(wData);
      } else {
        const { data: createdW } = await supabase
          .from("wallets")
          .upsert({ user_id: user.id, balance: 0.0, reserved_balance: 0.0 })
          .select()
          .maybeSingle();
        if (createdW) setWallet(createdW);
      }

      // 2. Campaign Assignments
      const { data: assignments } = await supabase
        .from("campaign_assignments")
        .select(`
          id,
          status,
          campaign_id,
          campaigns (*)
        `)
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

      // 3. Transactions
      const { data: txData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);

      if (txData) setTransactions(txData);

      // 4. Affiliate
      const { data: affData } = await supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (affData) setAffiliate(affData);
    } catch (err: any) {
      console.error("Erro ao carregar dados do usuário:", err);
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  if (profile?.first_login) {
    return <Navigate to="/account/setup" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white pb-20">
      {/* Modal de Saque */}
      <WithdrawModal
        open={isWithdrawModalOpen}
        onOpenChange={setIsWithdrawModalOpen}
        availableBalance={wallet?.balance || 0}
        onSuccess={loadUserData}
      />

      {/* Cabeçalho Operacional Simples */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ADX Money" className="h-7 w-auto" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white tracking-tight">
              {profile?.name || user?.email}
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Operador Ativo</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => signOut()}
            className="text-slate-400 hover:text-white hover:bg-slate-800 text-xs h-8 px-2.5 gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Conteúdo Principal por Abas */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-5">
        
        {/* ABA: INÍCIO */}
        {activeTab === "home" && (
          <div className="space-y-5">
            {/* Bloco principal de SALDO DISPONÍVEL */}
            <Card className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border-slate-800 shadow-xl overflow-hidden relative">
              <div className="absolute right-0 top-0 bottom-0 w-32 bg-indigo-500/5 pointer-events-none blur-2xl" />
              <CardHeader className="pb-2">
                <CardDescription className="text-xs text-slate-400 font-medium uppercase tracking-wider">
                  Saldo Disponível
                </CardDescription>
                <CardTitle className="text-3xl font-extrabold text-emerald-400 font-mono tracking-tight pt-1">
                  {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-2 flex items-center justify-between">
                <div className="text-[11px] text-slate-400 space-y-0.5">
                  <div>Bloqueado/Saque: <span className="text-amber-400 font-mono font-medium">{(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz</span></div>
                </div>
                <Button
                  onClick={() => setIsWithdrawModalOpen(true)}
                  disabled={(wallet?.balance || 0) <= 0}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-4 font-semibold shadow-lg shadow-emerald-950/40 gap-1.5"
                >
                  <ArrowUpRight className="w-4 h-4" />
                  Solicitar Saque
                </Button>
              </CardContent>
            </Card>

            {/* Grid de Atalhos: [ TAREFAS ] [ CAMPANHAS ] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                onClick={() => setActiveTab("tasks")} 
                className="bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 group-hover:bg-indigo-500/20 transition-colors">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Tarefas</CardTitle>
                      <CardDescription className="text-[11px] text-slate-400">Atividades operacionais</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </CardHeader>
                <CardContent className="text-xs text-slate-400 pt-1 pb-4">
                  {campaigns.filter(c => c.assignment_status !== "COMPLETED").length} tarefas pendentes disponíveis para execução.
                </CardContent>
              </Card>

              <Card 
                onClick={() => setActiveTab("tasks")} 
                className="bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:bg-sky-500/20 transition-colors">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Campanhas</CardTitle>
                      <CardDescription className="text-[11px] text-slate-400">Divulgações ativas</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </CardHeader>
                <CardContent className="text-xs text-slate-400 pt-1 pb-4">
                  {campaigns.length} campanhas vinculadas ao seu perfil de divulgador.
                </CardContent>
              </Card>
            </div>

            {/* Grid de Atalhos: [ AFILIADOS ] [ HISTÓRICO ] */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card 
                onClick={() => setActiveTab("account")} 
                className="bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 group-hover:bg-purple-500/20 transition-colors">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Afiliados</CardTitle>
                      <CardDescription className="text-[11px] text-slate-400">Programa de indicação</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </CardHeader>
                <CardContent className="text-xs text-slate-400 pt-1 pb-4">
                  Código: <span className="font-mono text-purple-300 font-semibold">{affiliate?.affiliate_code || "Não atribuído"}</span> ({affiliate?.total_referrals || 0} indicados)
                </CardContent>
              </Card>

              <Card 
                onClick={() => setActiveTab("wallet")} 
                className="bg-slate-900 border-slate-800 hover:border-slate-700 cursor-pointer transition-all hover:shadow-lg group"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500/20 transition-colors">
                      <History className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold text-white">Histórico</CardTitle>
                      <CardDescription className="text-[11px] text-slate-400">Extrato e transações</CardDescription>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-slate-300 transition-colors" />
                </CardHeader>
                <CardContent className="text-xs text-slate-400 pt-1 pb-4">
                  {transactions.length} registros recentes na sua carteira financeira.
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* ABA: TAREFAS (Tarefas e Campanhas) */}
        {activeTab === "tasks" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Tarefas e Campanhas</h2>
                <p className="text-xs text-slate-400">Lista de atividades e campanhas operacionais atribuídas.</p>
              </div>
              <Button size="sm" variant="outline" onClick={loadUserData} className="h-8 text-xs border-slate-800 bg-slate-900 text-slate-300">
                Atualizar
              </Button>
            </div>

            {campaigns.length === 0 ? (
              <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-500">
                Nenhuma tarefa ou campanha encontrada no momento.
              </Card>
            ) : (
              <div className="space-y-3">
                {campaigns.map((c) => (
                  <Card key={c.id || c.assignment_id} className="bg-slate-900 border-slate-800">
                    <CardHeader className="pb-3 flex flex-row items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge className="text-[10px] bg-slate-950 text-slate-300 border-slate-800">
                            {c.platform || "Geral"}
                          </Badge>
                          <span className="text-xs font-bold text-emerald-400 font-mono">
                            +{(c.reward_amount || 0).toLocaleString("pt-AO")} Kz
                          </span>
                        </div>
                        <CardTitle className="text-sm font-bold text-white">{c.title || c.name}</CardTitle>
                      </div>
                      <Badge className={`text-[10px] ${c.assignment_status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {c.assignment_status === 'COMPLETED' ? 'Concluída' : 'Pendente'}
                      </Badge>
                    </CardHeader>
                    {c.description && (
                      <CardContent className="pt-0 pb-3 text-xs text-slate-400">
                        {c.description}
                      </CardContent>
                    )}
                    <CardFooter className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Status operacional padrão</span>
                      {c.target_url && (
                        <a
                          href={c.target_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                        >
                          Acessar Link <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ABA: CARTEIRA (Saldo e Histórico) */}
        {activeTab === "wallet" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Carteira Financeira</h2>
              <p className="text-xs text-slate-400">Controlo de saldos e histórico de extrato.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs text-slate-400">Saldo Disponível</CardDescription>
                  <CardTitle className="text-2xl font-bold text-emerald-400 font-mono">
                    {(wallet?.balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button
                    size="sm"
                    onClick={() => setIsWithdrawModalOpen(true)}
                    disabled={(wallet?.balance || 0) <= 0}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                    Solicitar Saque
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardDescription className="text-xs text-slate-400">Saldo Reservado</CardDescription>
                  <CardTitle className="text-2xl font-bold text-amber-400 font-mono">
                    {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-0 text-[11px] text-slate-500">
                  Aguardando liquidação bancária.
                </CardContent>
              </Card>
            </div>

            <div className="space-y-3 pt-2">
              <h3 className="text-sm font-bold text-white">Extrato de Transações</h3>
              {transactions.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800 p-6 text-center text-xs text-slate-500">
                  Nenhuma transação registrada até o momento.
                </Card>
              ) : (
                <Card className="bg-slate-900 border-slate-800 overflow-hidden">
                  <div className="divide-y divide-slate-800">
                    {transactions.map((tx) => (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-white">{tx.description || tx.type}</div>
                          <div className="text-[10px] text-slate-500">{new Date(tx.created_at).toLocaleString("pt-AO")}</div>
                        </div>
                        <div className={`font-mono font-bold ${tx.amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {tx.amount >= 0 ? "+" : ""}{tx.amount.toLocaleString("pt-AO")} Kz
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* ABA: CONTA (Perfil e Afiliados) */}
        {activeTab === "account" && (
          <div className="space-y-5">
            <div>
              <h2 className="text-base font-bold text-white">Dados da Conta</h2>
              <p className="text-xs text-slate-400">Informações pessoais e programa de indicação de afiliados.</p>
            </div>

            {/* Programa de Afiliados */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white">Programa de Afiliados</CardTitle>
                <CardDescription className="text-xs text-slate-400">Compartilhe seu código para convidar novos operadores.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-1">
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={affiliate?.affiliate_code || "N/A"}
                    className="bg-slate-950 border-slate-800 font-mono text-emerald-400 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(affiliate?.affiliate_code || "", "Código de afiliado")}
                    className="border-slate-800 bg-slate-800/50 hover:bg-slate-800 text-xs h-9"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" /> Copiar
                  </Button>
                </div>
                <div className="text-xs text-slate-400">
                  Total de indicações ativas: <span className="font-bold text-white">{affiliate?.total_referrals || 0}</span>
                </div>
              </CardContent>
            </Card>

            {/* Dados Pessoais */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-white">Atualizar Dados Pessoais</CardTitle>
                <CardDescription className="text-xs text-slate-400">Mantenha seus dados atualizados para validação de saques.</CardDescription>
              </CardHeader>
              <form onSubmit={handleUpdateProfile}>
                <CardContent className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Nome Completo</Label>
                    <Input
                      value={profileName}
                      onChange={(e) => setProfileName(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Telefone / WhatsApp</Label>
                    <Input
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-300">Link Principal (TikTok/Instagram)</Label>
                    <Input
                      value={profileLink}
                      onChange={(e) => setProfileLink(e.target.value)}
                      className="bg-slate-950 border-slate-800 text-xs text-white"
                      required
                    />
                  </div>
                </CardContent>
                <CardFooter className="pt-2 border-t border-slate-800 flex justify-end">
                  <Button
                    type="submit"
                    disabled={updatingProfile}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs h-8 font-semibold"
                  >
                    {updatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
                    Salvar Alterações
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </div>
        )}

      </main>

      {/* Barra de Navegação Inferior (App Operacional) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur border-t border-slate-800 z-40 px-4 py-2">
        <div className="max-w-md mx-auto grid grid-cols-4 gap-1 text-center">
          <button
            onClick={() => setActiveTab("home")}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === "home" ? "text-emerald-400 bg-emerald-500/10 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Início</span>
          </button>

          <button
            onClick={() => setActiveTab("tasks")}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === "tasks" ? "text-emerald-400 bg-emerald-500/10 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <TrendingUp className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Tarefas</span>
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === "wallet" ? "text-emerald-400 bg-emerald-500/10 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wallet className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Carteira</span>
          </button>

          <button
            onClick={() => setActiveTab("account")}
            className={`flex flex-col items-center justify-center py-1.5 rounded-xl transition-colors ${
              activeTab === "account" ? "text-emerald-400 bg-emerald-500/10 font-semibold" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <UserIcon className="w-4 h-4 mb-0.5" />
            <span className="text-[10px]">Conta</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
