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
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-400 gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-xs font-medium text-slate-300">Carregando...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Obter papel com fallback imediato baseado no metadata do Supabase Auth para evitar qualquer bloqueio
  const effectiveRole = profile?.role || (user.user_metadata?.role as string) || 'user';

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
