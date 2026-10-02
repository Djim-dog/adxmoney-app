import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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

  useEffect(() => {
    if (profile) {
      if (profile.first_login === false) {
        navigate("/app", { replace: true });
        return;
      }
      setName(profile.name || "");
      setPhone(profile.phone || "");
      setPrimaryLink(profile.primary_link || "");
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
      navigate("/app", { replace: true });
    } catch (err: any) {
      console.error("Erro inesperado no setup:", err);
      toast.error("Ocorreu um erro ao configurar a sua conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 py-12 font-sans antialiased">
      <div className="max-w-md w-full mb-10 text-center">
        <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-100">
          <img src="/logo.png" alt="ADX" className="h-10 w-auto brightness-0 invert" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Ativação de Conta</h1>
        <p className="text-xs text-slate-500 mt-2 font-medium uppercase tracking-widest">Configuração Obrigatória de Operador</p>
      </div>

      <Card className="max-w-md w-full border-none bg-white shadow-2xl shadow-slate-200/60 rounded-3xl overflow-hidden text-slate-900">
        <CardHeader className="space-y-4 pb-8 pt-8 px-8">
          <div className="flex items-center justify-between text-[10px] text-emerald-600 font-black tracking-widest uppercase">
            <span>Passo {step} de 2</span>
            <span>{step === 1 ? "Segurança" : "Dados do Operador"}</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-600 h-full transition-all duration-500 ease-in-out"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
          <CardTitle className="text-xl font-black text-slate-900 pt-2 tracking-tight">
            {step === 1 ? "Definir Senha Pessoal" : "Validar Informações"}
          </CardTitle>
          <CardDescription className="text-slate-500 text-xs font-medium leading-relaxed">
            {step === 1
              ? "Substitua a senha provisória enviada pela gestão por uma senha definitiva e segura."
              : "Complete o seu cadastro para começar a receber tarefas e monetizar a sua conta."}
          </CardDescription>
        </CardHeader>

        {step === 1 ? (
          <form onSubmit={handleNextStep}>
            <CardContent className="space-y-6 pt-0 px-8">
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nova Palavra-passe</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Confirmar Palavra-passe</Label>
                <div className="relative">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-6 pb-10 px-8 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => signOut()}
                className="w-full sm:w-auto text-slate-400 hover:text-red-500 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest h-12 rounded-2xl"
              >
                Sair
              </Button>
              <Button
                type="submit"
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-black uppercase tracking-widest h-12 rounded-2xl shadow-lg shadow-emerald-100"
              >
                Continuar
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleCompleteSetup}>
            <CardContent className="space-y-5 pt-0 px-8">
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <User className="w-3 h-3 text-emerald-600" />
                  Nome do Operador
                </Label>
                <Input
                  placeholder="Nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <Phone className="w-3 h-3 text-emerald-600" />
                  WhatsApp Operacional
                </Label>
                <Input
                  placeholder="+244..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all font-mono"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] text-emerald-600 font-black uppercase tracking-widest flex items-center gap-2">
                  <UserPlus className="w-3 h-3" />
                  Código de Convite
                </Label>
                <Input
                  placeholder="ADX-XXXXX"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  className="bg-emerald-50 border-emerald-100 text-emerald-700 placeholder:text-emerald-200 focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-black transition-all font-mono tracking-widest"
                />
                <p className="text-[9px] text-slate-400 font-medium uppercase mt-1">
                  Insira o código se foi convidado por alguém para receber o bónus inicial de 250 Kz.
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                  <Link2 className="w-3 h-3 text-emerald-600" />
                  Perfil de Trabalho (Link)
                </Label>
                <Input
                  placeholder="TikTok, IG ou Canal"
                  value={primaryLink}
                  onChange={(e) => setPrimaryLink(e.target.value)}
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                />
              </div>
            </CardContent>

            <CardFooter className="pt-6 pb-10 px-8 flex flex-col sm:flex-row gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
                className="w-full sm:w-auto border-slate-200 text-slate-400 hover:text-slate-900 hover:bg-slate-100 text-[10px] font-black uppercase tracking-widest h-12 rounded-2xl"
              >
                Voltar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="w-full sm:flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs font-black uppercase tracking-widest h-12 rounded-2xl shadow-lg shadow-emerald-100"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Ativar Conta Agora
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>

      <div className="text-center mt-10 text-[10px] text-slate-400 font-black uppercase tracking-tighter">
        ADXmoney &copy; {new Date().getFullYear()} &bull; Todos os direitos reservados.
      </div>
    </div>
  );
}
