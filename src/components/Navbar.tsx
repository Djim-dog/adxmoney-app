import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  ShieldAlert, 
  LogOut, 
  User as UserIcon, 
  Sparkles,
  Layers,
  Wallet,
  Settings
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Operador";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
        <div className="flex items-center gap-10">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="ADXmoney" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-100/50 border border-slate-100 transition-transform group-hover:scale-105" />
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900 tracking-tight text-xl block leading-none">ADX<span className="text-emerald-600">money</span></span>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-[0.1em] mt-1 block">Operações Digitais</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-2">
            <Link to="/app">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-xl flex items-center gap-2 text-[13px] font-semibold h-10 px-4 transition-all ${
                  location.pathname === "/app" ? "bg-slate-100 text-slate-900" : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${location.pathname === "/app" ? "text-emerald-600" : ""}`} />
                <span>Painel</span>
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`rounded-xl flex items-center gap-2 text-[13px] font-semibold h-10 px-4 transition-all ${
                    location.pathname === "/admin" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:text-emerald-700 hover:bg-emerald-50/50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Gestão</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex flex-col text-right hidden sm:flex">
             <span className="text-sm font-semibold text-slate-900">{displayName}</span>
             <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{profile?.role === 'admin' ? 'Administrador' : 'Operador'}</span>
          </div>

          <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0 shadow-sm">
             <UserIcon className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-6 w-px bg-slate-100 hidden sm:block" />

          <Button
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 sm:w-auto sm:px-4 flex items-center justify-center gap-2 transition-all font-semibold text-[13px]"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
