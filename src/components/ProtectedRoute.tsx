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
      <div className="min-h-screen bg-white flex flex-col items-center justify-center antialiased">
        <div className="relative flex flex-col items-center gap-6">
          <div className="w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-100 overflow-hidden animate-pulse">
            <img src="/logo.png" alt="ADXmoney" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <span className="font-black text-slate-900 tracking-tight text-2xl">ADXmoney</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '100ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '200ms' }}></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
            </div>
          </div>
        </div>
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
