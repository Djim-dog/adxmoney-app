import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { session, profile, loading, isActive } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-xs font-mono text-slate-400">Verificando autorização...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redireciona para o login
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se a conta estiver inativa, bloqueia acesso e manda para login
  if (!isActive) {
    return <Navigate to="/login" replace />;
  }

  // Se a rota exige role ADMIN e o usuário não for admin, redireciona para o painel de usuário
  if (requiredRole === "admin" && profile?.role !== "admin") {
    return <Navigate to="/app" replace />;
  }

  // Se a rota for destinada a USER e o usuário for ADMIN, redireciona para o painel admin
  if (requiredRole === "user" && profile?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
