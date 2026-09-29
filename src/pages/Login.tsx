import React, { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, Lock, Mail, User as UserIcon, ShieldCheck, Sparkles } from "lucide-react";

const Login: React.FC = () => {
  const { session, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Login Form State
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Sign Up Form State
  const [signUpFirstName, setSignUpFirstName] = useState("");
  const [signUpLastName, setSignUpLastName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [isSigningUp, setIsSigningUp] = useState(false);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    setIsLoggingIn(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          toast.error("E-mail ou senha incorretos.");
        } else {
          toast.error(error.message);
        }
      } else {
        toast.success("Login efetuado com sucesso!");
        navigate("/");
      }
    } catch (err: unknown) {
      toast.error("Erro inesperado ao realizar login.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpEmail || !signUpPassword) {
      toast.error("Por favor, preencha o e-mail e a senha.");
      return;
    }

    if (signUpPassword.length < 6) {
      toast.error("A senha deve conter pelo menos 6 caracteres.");
      return;
    }

    setIsSigningUp(true);
    try {
      const { error, data } = await supabase.auth.signUp({
        email: signUpEmail,
        password: signUpPassword,
        options: {
          data: {
            first_name: signUpFirstName,
            last_name: signUpLastName,
          },
        },
      });

      if (error) {
        toast.error(error.message);
      } else {
        if (data.session) {
          toast.success("Conta criada e autenticada com sucesso!");
          navigate("/");
        } else {
          toast.success("Conta criada! Por favor, verifique a confirmação em seu e-mail caso necessário.");
        }
      }
    } catch (err: unknown) {
      toast.error("Erro ao criar conta.");
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-slate-50 to-blue-50 p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-200 mb-3">
            <Sparkles className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Acesse sua Conta
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Entre ou registre-se para gerenciar seus dados com segurança
          </p>
        </div>

        <Card className="border-border/60 shadow-xl shadow-slate-200/50 backdrop-blur rounded-2xl">
          <Tabs defaultValue="login" className="w-full">
            <div className="px-6 pt-6">
              <TabsList className="grid w-full grid-cols-2 rounded-xl p-1 bg-slate-100">
                <TabsTrigger value="login" className="rounded-lg text-sm font-medium">
                  Entrar
                </TabsTrigger>
                <TabsTrigger value="register" className="rounded-lg text-sm font-medium">
                  Criar Conta
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB LOGIN */}
            <TabsContent value="login">
              <form onSubmit={handleLogin}>
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg">Login</CardTitle>
                  <CardDescription>
                    Digite seu e-mail e senha para acessar o sistema.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        className="pl-9 rounded-xl"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password">Senha</Label>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 rounded-xl"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 shadow-md shadow-indigo-100"
                    disabled={isLoggingIn}
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Acessando...
                      </>
                    ) : (
                      "Entrar"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* TAB CADASTRO */}
            <TabsContent value="register">
              <form onSubmit={handleSignUp}>
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-lg">Criar uma Nova Conta</CardTitle>
                  <CardDescription>
                    Preencha as informações abaixo para começar.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="signup-firstname">Nome</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <Input
                          id="signup-firstname"
                          type="text"
                          placeholder="João"
                          className="pl-9 rounded-xl"
                          value={signUpFirstName}
                          onChange={(e) => setSignUpFirstName(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-lastname">Sobrenome</Label>
                      <Input
                        id="signup-lastname"
                        type="text"
                        placeholder="Silva"
                        className="rounded-xl"
                        value={signUpLastName}
                        onChange={(e) => setSignUpLastName(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">E-mail</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="seu.email@exemplo.com"
                        className="pl-9 rounded-xl"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Senha (mínimo 6 caracteres)</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        className="pl-9 rounded-xl"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        required
                        minLength={6}
                      />
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-5 shadow-md shadow-indigo-100"
                    disabled={isSigningUp}
                  >
                    {isSigningUp ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando conta...
                      </>
                    ) : (
                      "Cadastrar"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>

        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Autenticação segura via Supabase Auth & RLS</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
