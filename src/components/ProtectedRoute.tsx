import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "admin" | "user";
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Verificando Credenciais...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Obter papel com fallback imediato baseado no metadata do Supabase Auth
  const effectiveRole = profile?.role || (user.user_metadata?.role as string) || 'user';

  // 1. Impor primeiro acesso
  if (profile?.first_login && location.pathname !== '/account/setup') {
    return <Navigate to="/account/setup" replace />;
  }

  // 2. Se já completou o first_login, não voltar para setup
  if (profile?.first_login === false && location.pathname === '/account/setup') {
    return <Navigate to="/app" replace />;
  }

  if (location.pathname === '/') {
    return effectiveRole === 'admin' ? <Navigate to="/admin" replace /> : <Navigate to="/app" replace />;
  }

  if (requiredRole === 'admin' && effectiveRole !== 'admin') {
    return <Navigate to="/app" replace />;
  }

  if (requiredRole === 'user' && effectiveRole === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
};
