import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Lock, User, Phone, Link2, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export default function AccountSetup() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Form states
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [primaryLink, setPrimaryLink] = useState("");
  const [country, setCountry] = useState("Angola");

  useEffect(() => {
    if (profile) {
      // Se o utilizador já concluiu o primeiro login, deve ir direto para o dashboard
      if (profile.first_login === false) {
        navigate("/dashboard", { replace: true });
        return;
      }
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setPrimaryLink(profile.primary_link || "");
      if (profile.country) {
        setCountry(profile.country);
      }
    }
  }, [profile, navigate]);

  const validateStep1 = () => {
    if (!password) {
      toast.error("Por favor, digite a nova palavra-passe.");
      return false;
    }
    if (password.length < 6) {
      toast.error("A palavra-passe deve ter pelo menos 6 caracteres.");
      return false;
    }
    if (password !== confirmPassword) {
      toast.error("As palavras-passe não coincidem.");
      return false;
    }
    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setStep(2);
    }
  };

  const handleCompleteSetup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateStep1()) {
      setStep(1);
      return;
    }

    if (!name.trim()) {
      toast.error("Por favor, informe o seu nome completo.");
      return;
    }

    if (!phone.trim()) {
      toast.error("Por favor, informe o seu telefone/WhatsApp.");
      return;
    }

    if (!primaryLink.trim()) {
      toast.error("Por favor, informe o seu link principal (TikTok, Instagram ou canal).");
      return;
    }

    setLoading(true);

    try {
      // 1. Atualizar a palavra-passe no Supabase Auth usando a API oficial
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) {
        console.error("Erro ao atualizar palavra-passe:", authError);
        toast.error(`Erro ao atualizar palavra-passe: ${authError.message}`);
        setLoading(false);
        return;
      }

      // 2. Atualizar o perfil público do utilizador (garantindo first_login = false)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: name.trim(),
          phone: phone.trim(),
          primary_link: primaryLink.trim(),
          country: country.trim() || "Angola",
          first_login: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user?.id);

      if (profileError) {
        console.error("Erro ao atualizar dados do perfil:", profileError);
        toast.error(`Erro ao salvar dados do perfil: ${profileError.message}`);
        setLoading(false);
        return;
      }

      // 3. Registrar auditoria no activity_logs se a tabela estiver acessível
      try {
        await supabase.from("activity_logs").insert({
          user_id: user?.id,
          action_type: "FIRST_LOGIN_COMPLETED",
          details: {
            step: "account_setup",
            timestamp: new Date().toISOString(),
            ip: "client_confirmed",
          },
        });
      } catch (logErr) {
        console.warn("Log silencioso de auditoria:", logErr);
      }

      // 4. Recarregar o perfil no contexto de autenticação
      await refreshProfile();

      toast.success("Configuração inicial concluída com sucesso! Bem-vindo(a) ao ADX Money.");

      // 5. Redirecionar para o painel principal (/dashboard)
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Erro inesperado no setup de conta:", err);
      toast.error(err?.message || "Ocorreu um erro ao configurar a sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-8">
      {/* Header / Brand */}
      <div className="max-w-md w-full mb-6 text-center">
        <img src="/logo.png" alt="ADX Money Logo" className="h-16 mx-auto mb-3" />
        <p className="text-sm text-slate-400 mt-1">Configuração Obrigatória de Primeiro Acesso</p>
      </div>

      <Card className="max-w-md w-full border-slate-800 bg-slate-900/80 backdrop-blur-md shadow-2xl text-slate-100">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex items-center justify-between text-xs text-indigo-400 font-semibold tracking-wider uppercase">
            <span>Passo {step} de 2</span>
            <span>{step === 1 ? "Segurança" : "Dados Pessoais"}</span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
          <CardTitle className="text-xl font-bold text-white pt-2">
            {step === 1 ? "Alterar Palavra-passe Provisória" : "Confirmar os Seus Dados"}
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs leading-relaxed">
            {step === 1
              ? "Por motivos de segurança, é obrigatório definir uma nova palavra-passe pessoal antes de utilizar o painel."
              : "Complete os seus dados para habilitar a emissão de tarefas e saques de ganhos."}
          </CardDescription>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <CardContent className="space-y-4 pt-2">
              <Alert className="bg-amber-500/10 border-amber-500/20 text-amber-300 text-xs">
                <AlertTitle className="font-semibold text-amber-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  Acesso Restrito
                </AlertTitle>
                <AlertDescription className="text-amber-300/90 text-xs mt-1">
                  Não é possível acessar o painel com a palavra-passe padrão atribuída pelo administrador.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium">Nova Palavra-passe</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo de 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-950/60 border-slate-700 text-white pr-10 focus:border-indigo-500"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium">Confirmar Nova Palavra-passe</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repita a nova palavra-passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-950/60 border-slate-700 text-white pr-10 focus:border-indigo-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-4 flex flex-col sm:flex-row gap-2 border-t border-slate-800/80">
              <Button
                type="button"
                variant="ghost"
                onClick={() => signOut()}
                className="w-full sm:w-auto text-slate-400 hover:text-slate-200 hover:bg-slate-800 text-xs"
              >
                Sair da Conta
              </Button>
              <Button
                type="submit"
                className="w-full sm:flex-1 bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs font-semibold"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleCompleteSetup}>
            <CardContent className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  Nome Completo
                </Label>
                <Input
                  type="text"
                  placeholder="Seu nome oficial"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950/60 border-slate-700 text-white focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  Telefone / WhatsApp
                </Label>
                <Input
                  type="tel"
                  placeholder="+244 9..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950/60 border-slate-700 text-white focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                  Link Principal (TikTok, Instagram ou Canal)
                </Label>
                <Input
                  type="url"
                  placeholder="https://tiktok.com/@seu_perfil"
                  value={primaryLink}
                  onChange={(e) => setPrimaryLink(e.target.value)}
                  className="bg-slate-950/60 border-slate-700 text-white focus:border-indigo-500"
                  required
                />
                <p className="text-[11px] text-slate-400">
                  Utilizado para validar as publicações de campanhas e tarefas concluídas.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium">País de Residência</Label>
                <Input
                  type="text"
                  placeholder="Angola"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="bg-slate-950/60 border-slate-700 text-white focus:border-indigo-500"
                />
              </div>
            </CardContent>

            <CardFooter className="pt-4 flex flex-col sm:flex-row gap-2 border-t border-slate-800/80">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full sm:w-auto border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 text-xs"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs font-semibold shadow-lg shadow-emerald-950/50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Salvando Configurações...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Concluir e Acessar Painel
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

      <div className="text-center mt-6 text-xs text-slate-500">
        ADX Money Security Protocol &copy; {new Date().getFullYear()} — Todos os direitos reservados.
      </div>
    </div>
  );
}
