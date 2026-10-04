import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Lock, Loader2, HelpCircle } from "lucide-react";
import { SplashScreen } from "@/components/SplashScreen";

const Login: React.FC = () => {
  const { session, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isFaqOpen, setIsFaqOpen] = useState(false);

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
    return <SplashScreen message="Verificando acesso..." />;
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
        password: password,
      });

      if (error) {
        console.error("[Login] Erro auth:", error);
        toast.error("E-mail ou senha incorretos.");
        return;
      }

      console.log("[Login] Sucesso:", data.user.id);
      // O redirect será disparado pelo AuthContext/ProtectedRoute
    } catch (err: any) {
      console.error("[Login] Erro inesperado:", err);
      toast.error("Ocorreu um erro ao entrar.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 select-none">
      <div className="w-full max-w-sm flex justify-end mb-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsFaqOpen(true)}
          className="text-xs text-slate-500 hover:text-emerald-600 flex items-center gap-1.5 h-8 px-2.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span className="font-semibold">Ajuda & FAQ</span>
        </Button>
      </div>

      <div className="w-full max-w-sm text-center mb-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/20 overflow-hidden">
          <img src="/logo.png" alt="ADXmoney" className="w-full h-full object-cover" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          ADX<span className="text-emerald-600">money</span>
        </h1>
      </div>

      <Card className="w-full max-w-sm shadow-xl shadow-slate-200/50 border border-slate-200/80 bg-white rounded-3xl">
        <CardHeader className="pt-4 pb-2 px-6 text-center">
          <CardTitle className="text-base font-black text-slate-900 tracking-tight">
            Aceda à sua conta
          </CardTitle>
        </CardHeader>
        
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-3 px-6 pb-2">
            <div className="space-y-1">
              <Label htmlFor="email" className="text-[11px] font-bold text-slate-700 uppercase">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@exemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor="password" className="text-[11px] font-bold text-slate-700 uppercase">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoggingIn}
                  className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl text-sm font-medium"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="pt-2 pb-5 px-6 flex flex-col gap-3">
            <Button
              type="submit"
              disabled={isLoggingIn}
              className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20 text-sm"
            >
              {isLoggingIn ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Entrando...
                </>
              ) : (
                "Entrar na Conta"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Dialog open={isFaqOpen} onOpenChange={setIsFaqOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Ajuda e Suporte</DialogTitle>
            <DialogDescription>
              Se esqueceu a sua senha ou não tem acesso, por favor entre em contacto com o seu patrocinador ou administrador da plataforma.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Login;
