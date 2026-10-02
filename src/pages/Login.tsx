import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock, Mail } from "lucide-react";

const Login: React.FC = () => {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirecionamento automático caso já esteja autenticado
  if (!authLoading && session && profile) {
    if (profile.first_login) {
      return <Navigate to="/account/setup" replace />;
    }
    if (profile.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/app" replace />;
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          <p className="text-xs font-medium text-slate-500 uppercase tracking-widest">Verificando credenciais...</p>
        </div>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      toast.error("Preencha o e-mail e a senha de acesso.");
      return;
    }

    setIsLoggingIn(true);
    console.log("[Login] Tentando autenticar:", cleanEmail);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        console.error("[Login] Erro do Supabase Auth:", error);
        toast.error(`Erro: ${error.message}`);
        setIsLoggingIn(false);
        return;
      }

      console.log("[Login] Sucesso:", data);
      toast.success("Autenticação realizada com sucesso.");

      // Consultar perfil na base de dados para garantir valor real de first_login e role
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("first_login, role")
        .eq("id", data.user.id)
        .maybeSingle();

      const isFirstLogin = userProfile?.first_login ?? data.user?.user_metadata?.first_login;
      const role = userProfile?.role || data.user?.user_metadata?.role || "user";

      if (isFirstLogin) {
        navigate("/account/setup", { replace: true });
      } else if (role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    } catch (err: unknown) {
      console.error("[Login] Erro inesperado:", err);
      toast.error("Erro inesperado ao conectar ao servidor de autenticação.");
      setIsLoggingIn(false);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 px-4 py-8 text-slate-900">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <img src="/logo.png" alt="ADXmoney Logo" className="h-20 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">ADXmoney</h1>
          <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mt-2">Acesso Operacional ao Sistema</p>
        </div>

        <Card className="bg-white border-slate-200 text-slate-900 shadow-xl shadow-slate-200/50 rounded-3xl overflow-hidden border-none">
          <CardHeader className="space-y-1 pb-6 pt-8 text-center bg-white">
            <CardTitle className="text-xl font-bold text-slate-900">Bem-vindo</CardTitle>
            <CardDescription className="text-slate-500 text-xs">
              Insira seus dados para acessar o seu painel de operador.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-5 px-8">
              <div className="space-y-2">
                <Label htmlFor="login-email" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">E-mail de Operador</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white text-slate-900 text-sm rounded-2xl transition-all"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Senha de Segurança</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 h-12 bg-slate-50 border-transparent focus:border-emerald-500 focus:bg-white text-slate-900 text-sm rounded-2xl transition-all"
                    disabled={isLoggingIn}
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-4 pb-10 px-8">
              <Button
                type="submit"
                className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-200 transition-all active:scale-[0.98]"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Entrando...</> : "Entrar no Sistema"}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center mt-10 text-[10px] text-slate-400 font-medium uppercase tracking-tighter">
          ADXmoney &copy; {new Date().getFullYear()} &bull; Plataforma Financeira Operacional
        </p>
      </div>
    </div>
  );
};

export default Login;
