import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
  adminOnly?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  adminOnly = false
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium text-slate-300">Carregando ADX Money...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Se o usuário estiver logado mas o perfil demorar um instante, mostra loading amigável
  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium text-slate-200">Preparando sua sessão...</p>
      </div>
    );
  }

  // Redirecionamento da raiz ('/')
  if (location.pathname === '/') {
    if (profile.role === 'admin') {
      return <Navigate to="/admin" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  // Validação estrita de perfil/role
  const effectiveRole = profile.role || 'user';

  if (adminOnly && effectiveRole !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  if (requiredRole === 'admin' && effectiveRole !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  if (requiredRole === 'user' && effectiveRole === 'admin') {
    // Se um admin acessar /app diretamente, redireciona ao Admin Dashboard
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
