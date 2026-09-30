import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, ShieldAlert, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { session, profile, loading, signOut } = useAuth();

  // 1. Tela de Carregamento enquanto verifica sessão e perfil
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono text-slate-400">Verificando autorização de acesso...</p>
        </div>
      </div>
    );
  }

  // 2. Não autenticado -> Redireciona para login
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  // 3. Perfil não encontrado no banco de dados (evita loop infinito)
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-center text-rose-400 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Perfil não Localizado</h2>
            <p className="text-xs text-slate-400 mt-1">
              Não foi possível carregar as permissões do seu perfil na base de dados.
            </p>
          </div>
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="border-slate-800 text-rose-400 hover:bg-rose-950/40 text-xs h-9 w-full"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sair e Tentar Novamente
          </Button>
        </div>
      </div>
    );
  }

  // 4. Usuário Inativo / Bloqueado
  if (profile.is_active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center justify-center text-amber-400 mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">Conta Desativada</h2>
            <p className="text-xs text-slate-400 mt-1">
              O seu acesso foi temporariamente suspenso pela administração. Entre em contacto com o suporte.
            </p>
          </div>
          <Button
            onClick={() => signOut()}
            variant="outline"
            className="border-slate-800 text-slate-300 hover:bg-slate-800 text-xs h-9 w-full"
          >
            <LogOut className="w-3.5 h-3.5 mr-2" />
            Sair da Conta
          </Button>
        </div>
      </div>
    );
  }

  // 5. Validação do papel (Role) para acesso à rota
  if (requiredRole && profile.role !== requiredRole) {
    if (profile.role === "admin") {
      return <Navigate to="/admin" replace />;
    } else if (profile.role === "user") {
      return <Navigate to="/app" replace />;
    } else {
      return <Navigate to="/login" replace />;
    }
  }

  return <>{children}</>;
};
