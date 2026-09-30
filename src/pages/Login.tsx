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
    if (profile.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else {
      return <Navigate to="/app" replace />;
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono text-slate-400">Verificando credenciais...</p>
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
    try {
      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        console.error("[Login] Erro de autenticação:", error);
        toast.error(error.message || "Erro ao autenticar. Verifique suas credenciais.");
        setIsLoggingIn(false);
        return;
      }

      if (authData.user) {
        // Redirecionamento baseado nos metadados ou na sessão direta sem travar se o profile demorar
        const userRole = authData.user.user_metadata?.role || "user";
        toast.success("Autenticação realizada com sucesso.");

        if (userRole === "admin") {
          navigate("/admin", { replace: true });
        } else {
          navigate("/app", { replace: true });
        }
      }
    } catch (err: unknown) {
      console.error("[Login] Erro inesperado:", err);
      toast.error("Erro inesperado ao conectar ao servidor de autenticação.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-slate-950 px-4 py-8 text-slate-100">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="ADXmoney Logo" 
              className="w-20 h-20 object-contain rounded-2xl shadow-2xl border border-slate-800/50 bg-slate-900/40 p-1.5" 
            />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white font-mono uppercase">ADXmoney</h1>
          <p className="text-xs text-slate-400 mt-1">
            Acesso Operacional ao Sistema
          </p>
        </div>

        <Card className="bg-slate-900 border-slate-800 text-slate-100 shadow-xl rounded-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-base font-semibold text-white">Login</CardTitle>
            <CardDescription className="text-slate-400 text-xs">
              Insira os dados da sua conta para acessar o painel correspondente.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="login-email" className="text-xs font-medium text-slate-300">
                  E-mail
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus-visible:ring-emerald-500"
                    disabled={isLoggingIn}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="login-password" className="text-xs font-medium text-slate-300">
                  Senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-9 bg-slate-950 border-slate-800 text-slate-100 text-xs placeholder:text-slate-600 focus-visible:ring-emerald-500"
                    disabled={isLoggingIn}
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs py-2.5 rounded-xl shadow-lg transition-colors"
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Entrando...
                  </>
                ) : (
                  "Entrar"
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <div className="mt-8 text-center text-[11px] text-slate-500">
          Autenticação criptografada • Verificação estrita de permissões
        </div>
      </div>
    </div>
  );
};

export default Login;
