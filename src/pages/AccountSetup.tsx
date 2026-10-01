import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ShieldCheck, Lock, User, Phone, Link2, Eye, EyeOff, Loader2, CheckCircle2, ArrowRight, UserPlus } from "lucide-react";
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
  const [inviteCode, setInviteCode] = useState("");
  const [country, setCountry] = useState("Angola");

  useEffect(() => {
    if (profile) {
      if (profile.first_login === false) {
        navigate("/app", { replace: true });
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

    setLoading(true);

    try {
      // 1. Atualizar a palavra-passe no Supabase Auth
      const { error: authError } = await supabase.auth.updateUser({
        password: password,
      });

      if (authError) {
        toast.error(`Erro ao atualizar palavra-passe: ${authError.message}`);
        setLoading(false);
        return;
      }

      // 2. Chamar a RPC para atualizar perfil e bônus atômicamente
      const { data: rpcData, error: rpcError } = await supabase.rpc('complete_account_setup', {
        p_user_id: user?.id,
        p_name: name.trim(),
        p_phone: phone.trim(),
        p_primary_link: primaryLink.trim(),
        p_invite_code: inviteCode.trim().toUpperCase() || null
      });

      if (rpcError) {
        console.error("Erro na RPC setup:", rpcError);
        toast.error(`Erro ao salvar dados: ${rpcError.message}`);
        setLoading(false);
        return;
      }

      const result = rpcData as { success: boolean; message: string };
      if (!result.success) {
        toast.error(result.message);
        setLoading(false);
        return;
      }

      await refreshProfile();
      toast.success(result.message || "Configuração inicial concluída com sucesso!");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      console.error("Erro inesperado no setup:", err);
      toast.error("Ocorreu um erro ao configurar a sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col justify-center items-center px-4 py-8">
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
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-indigo-500 h-full transition-all duration-300"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
          <CardTitle className="text-xl font-bold text-white pt-2">
            {step === 1 ? "Nova Palavra-passe" : "Confirmar os Seus Dados"}
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs leading-relaxed">
            {step === 1
              ? "Defina uma nova palavra-passe pessoal e segura para proteger a sua conta."
              : "Complete os seus dados operacionais. Se tiver um código de convite, insira abaixo."}
          </CardDescription>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <CardContent className="space-y-4 pt-2">
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
                <Label className="text-xs text-slate-300 font-medium">Confirmar Palavra-passe</Label>
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
                Sair
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
                  placeholder="Seu nome"
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
                  placeholder="+244..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950/60 border-slate-700 text-white focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                  Código de Convite (Opcional)
                </Label>
                <Input
                  placeholder="Ex: ADX..."
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="bg-slate-950/60 border-slate-700 text-emerald-300 font-mono placeholder:text-slate-600 focus:border-emerald-500"
                />
                <p className="text-[10px] text-slate-400">
                  Insira o código se foi convidado por alguém para receber o bónus inicial de 250 Kz.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-300 font-medium flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-400" />
                  Link Redes Sociais (Opcional)
                </Label>
                <Input
                  placeholder="TikTok ou Instagram link"
                  value={primaryLink}
                  onChange={(e) => setPrimaryLink(e.target.value)}
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
                  <Loader2 className="w-4 h-4 animate-spin" />
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
        ADX Money &copy; {new Date().getFullYear()} — Todos os direitos reservados.
      </div>
    </div>
  );
}
