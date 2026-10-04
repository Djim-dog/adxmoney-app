import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { SplashScreen } from '@/components/SplashScreen';

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
    return <SplashScreen message="Validando credenciais..." />;
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

  // 3. Verificação de Assinatura (para usuários)
  // Removido o redirect forçado para permitir modo "Visitante"
  // As limitações serão tratadas nos componentes
  /*
  if (requiredRole === 'user' && profile && profile.subscription_status !== 'active' && location.pathname !== '/subscribe') {
      return <Navigate to="/subscribe" replace />;
  }
  */

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
