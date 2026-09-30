import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import AdminDashboardPage from "./pages/AdminDashboard";
import UserAppPage from "./pages/UserApp";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" richColors />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            {/* Rota Pública de Autenticação */}
            <Route path="/login" element={<Login />} />

            {/* Rota Raiz: Redireciona com base na autenticação */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/app" replace />
                </ProtectedRoute>
              }
            />

            {/* ROTA EXCLUSIVA DE ADMIN (Protegida por Role real) */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboardPage />
                </ProtectedRoute>
              }
            />

            {/* ROTA EXCLUSIVA DE USUÁRIO (Protegida por Role real) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute requiredRole="user">
                  <UserAppPage />
                </ProtectedRoute>
              }
            />

            {/* Página 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
