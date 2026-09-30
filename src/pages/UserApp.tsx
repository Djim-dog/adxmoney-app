import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FirstAccessModal } from "@/components/FirstAccessModal";
import { WithdrawalModal } from "@/components/WithdrawalModal";
import { toast } from "sonner";
import {
  Home,
  Layers,
  Wallet,
  History,
  User,
  LogOut,
  RefreshCw,
  Loader2,
  ArrowUpRight,
  CheckCircle2,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const UserAppPage: React.FC = () => {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<"home" | "campaigns" | "wallet" | "history" | "profile">("home");

  const [loading, setLoading] = useState(false);
  const [wallet, setWallet] = useState<{ id: string; balance: number; reserved_balance: number } | null>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [affiliate, setAffiliate] = useState<any | null>(null);

  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [executingId, setExecutingId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const [profileName, setProfileName] = useState(profile?.name || "");
  const [profilePhone, setProfilePhone] = useState(profile?.phone || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      if (profile.name) setProfileName(profile.name);
      if (profile.phone) setProfilePhone(profile.phone);
    }
  }, [profile]);

  const loadUserData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 1. Carteira
      const { data: wData } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (wData) setWallet(wData);

      // 2. Transações
      const { data: tData } = await supabase
        .from("wallet_transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (tData) setTransactions(tData);

      // 3. Campanhas
      const { data: cAssignments } = await supabase
        .from("campaign_assignments")
        .select(`
          id,
          status,
          completed_at,
          campaign_id,
          campaigns:campaign_id (
            id,
            title,
            description,
            platform,
            target_url,
            instructions,
            reward_amount,
            status
          )
        `)
        .eq("user_id", user.id);

      if (cAssignments) {
        const list = cAssignments
          .filter((a: any) => a.campaigns && (a.campaigns.status === "ACTIVE" || a.status === "COMPLETED"))
          .map((a: any) => ({
            id: a.campaigns ? a.campaigns.id : a.campaign_id,
            title: a.campaigns?.title || "Campanha",
            description: a.campaigns?.description || "",
            platform: a.campaigns?.platform || "Geral",
            target_url: a.campaigns?.target_url || "#",
            instructions: a.campaigns?.instructions || "",
            reward_amount: a.campaigns ? Number(a.campaigns.reward_amount) : 0,
            assignment_id: a.id,
            assignment_status: a.status,
            completed_at: a.completed_at,
          }));
        setCampaigns(list);
      }

      // 4. Afiliado
      const { data: affData } = await supabase
        .from("affiliate_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (affData) setAffiliate(affData);
    } catch (err) {
      console.error("[UserApp] Erro ao carregar dados:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [user]);

  const handleExecuteCampaign = (campaign: any) => {
    window.open(campaign.target_url, "_blank", "noopener,noreferrer");
    setConfirmingId(campaign.id);
    toast.info("Link aberto! Clique em 'Confirmar Conclusão' após realizar a tarefa.");
  };

  const handleConfirmCompletion = async (campaign: any) => {
    setExecutingId(campaign.id);
    try {
      const { error } = await supabase.rpc("complete_campaign_execution", {
        p_campaign_id: campaign.id,
      });

      if (error) throw error;

      toast.success(`Tarefa concluída! ${campaign.reward_amount.toLocaleString("pt-AO")} Kz creditados na carteira.`);
      setConfirmingId(null);
      await loadUserData();
    } catch (err: any) {
      toast.error(err.message || "Erro ao concluir campanha.");
    } finally {
      setExecutingId(null);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          name: profileName.trim(),
          phone: profilePhone.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) throw error;

      if (newPassword) {
        if (newPassword.length < 6) {
          toast.error("A senha deve conter no mínimo 6 caracteres.");
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("As senhas informadas não coincidem.");
          return;
        }
        const { error: pwErr } = await supabase.auth.updateUser({ password: newPassword });
        if (pwErr) throw pwErr;
        toast.success("Senha alterada com sucesso.");
        setNewPassword("");
        setConfirmPassword("");
      }

      toast.success("Perfil atualizado.");
      await refreshProfile();
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar perfil.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Modal de Primeiro Acesso Obrigatório */}
      {profile?.first_login && user && (
        <FirstAccessModal
          isOpen={true}
          userEmail={user.email || ""}
          initialName={profile.name || ""}
          onSuccess={async () => {
            await refreshProfile();
            await loadUserData();
          }}
        />
      )}

      {/* Modal de Saque */}
      {wallet && (
        <WithdrawalModal
          isOpen={isWithdrawModalOpen}
          onClose={() => setIsWithdrawModalOpen(false)}
          availableBalance={wallet.balance}
          onSuccess={async () => {
            await loadUserData();
          }}
        />
      )}

      {/* Topo do Painel */}
      <header className="border-b border-slate-800 bg-slate-900/90 px-6 py-3.5 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="font-mono font-bold text-sm text-emerald-400">ADXmoney</span>
          <span className="text-xs text-slate-400 font-medium hidden sm:inline">• Área do Operador</span>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadUserData}
            disabled={loading}
            className="text-slate-400 hover:text-white hover:bg-slate-800 h-8 px-2 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </Button>

          <span className="text-xs text-slate-300 font-medium">{profile?.name || user?.email}</span>

          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 h-8 px-2.5 text-xs gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Navegação */}
        <aside className="w-full md:w-56 border-r border-slate-800 bg-slate-900/50 p-3 space-y-1 shrink-0">
          <nav className="space-y-1">
            <button
              onClick={() => setActiveSection("home")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "home"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Início</span>
            </button>

            <button
              onClick={() => setActiveSection("campaigns")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "campaigns"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Minhas Tarefas ({campaigns.filter((c) => c.assignment_status !== "COMPLETED").length})</span>
            </button>

            <button
              onClick={() => setActiveSection("wallet")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "wallet"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <Wallet className="w-4 h-4" />
              <span>Carteira &amp; Saque</span>
            </button>

            <button
              onClick={() => setActiveSection("history")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "history"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <History className="w-4 h-4" />
              <span>Extrato Financeiro</span>
            </button>

            <button
              onClick={() => setActiveSection("profile")}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                activeSection === "profile"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Meu Perfil</span>
            </button>
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto max-w-5xl">
          {activeSection === "home" && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Painel Operacional</h2>
                <p className="text-xs text-slate-400">Resumo da sua conta e tarefas disponíveis.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                      Solicitar Saque
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400">Saldo Reservado (Em Saque)</CardDescription>
                    <CardTitle className="text-2xl font-bold text-amber-400 font-mono">
                      {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-slate-500">
                    Valor retido aguardando processamento bancário.
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400">Programa de Convite</CardDescription>
                    <CardTitle className="text-base font-bold text-sky-400 font-mono">
                      {affiliate?.affiliate_code || "Inativo"}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-slate-400">
                    {affiliate ? (
                      <div className="flex items-center justify-between">
                        <span>{affiliate.total_referrals} indicações</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(affiliate.affiliate_code, "Código")}
                          className="h-6 text-[10px] px-2 border-slate-800"
                        >
                          <Copy className="w-2.5 h-2.5 mr-1" /> Copiar
                        </Button>
                      </div>
                    ) : (
                      "Solicite ativação ao administrador."
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-200">Tarefas Pendentes de Execução</h3>
                {campaigns.filter((c) => c.assignment_status !== "COMPLETED").length === 0 ? (
                  <Card className="bg-slate-900 border-slate-800 p-6 text-center text-xs text-slate-500">
                    Nenhuma tarefa atribuída no momento. Novas atividades serão liberadas pelo administrador.
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {campaigns
                      .filter((c) => c.assignment_status !== "COMPLETED")
                      .slice(0, 4)
                      .map((c) => (
                        <Card key={c.id} className="bg-slate-900 border-slate-800">
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                              <Badge className="text-[10px] bg-slate-950 text-slate-300 border-slate-800">
                                {c.platform}
                              </Badge>
                              <span className="text-xs font-bold text-emerald-400">
                                +{c.reward_amount.toLocaleString("pt-AO")} Kz
                              </span>
                            </div>
                            <CardTitle className="text-sm font-bold text-white mt-1">{c.title}</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-0">
                            {confirmingId === c.id ? (
                              <Button
                                size="sm"
                                onClick={() => handleConfirmCompletion(c)}
                                disabled={executingId === c.id}
                                className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 rounded-lg animate-pulse"
                              >
                                {executingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar Conclusão"}
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleExecuteCampaign(c)}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg"
                              >
                                Executar Tarefa
                              </Button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeSection === "campaigns" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Todas as Minhas Tarefas</h2>
                <p className="text-xs text-slate-400">Conclua o fluxo indicado para receber a bonificação real.</p>
              </div>

              {campaigns.length === 0 ? (
                <Card className="bg-slate-900 border-slate-800 p-8 text-center text-xs text-slate-500">
                  Nenhuma campanha atribuída.
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {campaigns.map((c) => {
                    const isDone = c.assignment_status === "COMPLETED";
                    const isConfirming = confirmingId === c.id;

                    return (
                      <Card key={c.id} className={`bg-slate-900 border ${isDone ? "border-slate-800 opacity-60" : "border-slate-700"}`}>
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <Badge className="text-[10px] bg-slate-950 text-slate-300 border-slate-800">
                              {c.platform}
                            </Badge>
                            <span className="text-xs font-bold text-emerald-400">
                              +{c.reward_amount.toLocaleString("pt-AO")} Kz
                            </span>
                          </div>
                          <CardTitle className="text-sm font-bold text-white mt-1">{c.title}</CardTitle>
                          <CardDescription className="text-xs text-slate-400">{c.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="pt-0 space-y-2">
                          <p className="text-[11px] text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                            {c.instructions}
                          </p>
                          {isDone ? (
                            <div className="flex items-center justify-center gap-1 text-xs text-emerald-400 py-1.5 font-medium">
                              <CheckCircle2 className="w-4 h-4" /> Concluída
                            </div>
                          ) : isConfirming ? (
                            <Button
                              size="sm"
                              onClick={() => handleConfirmCompletion(c)}
                              disabled={executingId === c.id}
                              className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs h-8 rounded-lg animate-pulse"
                            >
                              {executingId === c.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Confirmar Conclusão"}
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => handleExecuteCampaign(c)}
                              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg"
                            >
                              Iniciar e Concluir
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeSection === "wallet" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Carteira Digital</h2>
                <p className="text-xs text-slate-400">Saldo e saques da sua conta.</p>
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
                      onClick={() => setIsWithdrawModalOpen(true)}
                      disabled={(wallet?.balance || 0) <= 0}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-8 rounded-lg"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5 mr-1" />
                      Solicitar Saque
                    </Button>
                  </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-xs text-slate-400">Saldo em Análise de Saque</CardDescription>
                    <CardTitle className="text-2xl font-bold text-amber-400 font-mono">
                      {(wallet?.reserved_balance || 0).toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0 text-[11px] text-slate-500">
                    Bloqueado temporariamente até quitação pelo administrador.
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeSection === "history" && (
            <div className="space-y-4">
              <div>
                <h2 className="text-base font-bold text-white">Extrato de Movimentações</h2>
                <p className="text-xs text-slate-400">Registro imutável de transações financeiras.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-0">
                  {transactions.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">Nenhuma movimentação financeira.</div>
                  ) : (
                    <div className="divide-y divide-slate-800">
                      {transactions.map((t) => {
                        const isPos = t.amount > 0;
                        return (
                          <div key={t.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-800/30">
                            <div>
                              <p className="font-semibold text-white">{t.description}</p>
                              <p className="text-[10px] text-slate-500">{new Date(t.created_at).toLocaleString("pt-AO")}</p>
                            </div>
                            <div className="text-right">
                              <span className={`font-mono font-bold ${isPos ? "text-emerald-400" : "text-amber-400"}`}>
                                {isPos ? "+" : ""}{t.amount.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} Kz
                              </span>
                              <span className="block text-[9px] text-slate-500">{t.status}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {activeSection === "profile" && (
            <div className="space-y-4 max-w-md">
              <div>
                <h2 className="text-base font-bold text-white">Meu Perfil</h2>
                <p className="text-xs text-slate-400">Dados pessoais e credenciais.</p>
              </div>

              <Card className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <form onSubmit={handleUpdateProfile} className="space-y-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">E-mail (não alterável)</Label>
                      <Input
                        value={user?.email || ""}
                        disabled
                        className="bg-slate-950 border-slate-800 text-slate-500 text-xs cursor-not-allowed"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Nome Completo</Label>
                      <Input
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                        required
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-300">Telefone / WhatsApp</Label>
                      <Input
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>

                    <div className="pt-2 border-t border-slate-800 space-y-2">
                      <span className="text-xs font-semibold text-slate-300 block">Alterar Senha (opcional)</span>
                      <Input
                        type="password"
                        placeholder="Nova senha"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                      <Input
                        type="password"
                        placeholder="Confirmar nova senha"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={updatingProfile}
                      className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium mt-2"
                    >
                      {updatingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Salvar Alterações"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default UserAppPage;
