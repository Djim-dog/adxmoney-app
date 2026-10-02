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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
               <span className="font-black text-lg tracking-tighter">ADX</span>
            </div>
            <div className="hidden sm:block">
              <span className="font-black text-slate-900 tracking-tight text-lg block leading-none">ADXmoney</span>
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em] mt-0.5">Operações Digitais</span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1.5">
            <Link to="/app">
              <Button 
                variant="ghost" 
                size="sm"
                className={`rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest h-10 px-4 transition-all ${
                  location.pathname === "/app" ? "bg-slate-100 text-slate-900" : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
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
                  className={`rounded-2xl flex items-center gap-2 text-xs font-black uppercase tracking-widest h-10 px-4 transition-all ${
                    location.pathname === "/admin" ? "bg-amber-50 text-amber-700" : "text-slate-400 hover:text-amber-700 hover:bg-amber-50/50"
                  }`}
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>Gestão</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex flex-col text-right mr-2 hidden sm:flex">
             <span className="text-xs font-black text-slate-900 tracking-tight">{displayName}</span>
             <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{profile?.role === 'admin' ? 'Administrador' : 'Operador Nível 1'}</span>
          </div>

          <div className="w-10 h-10 rounded-2xl bg-slate-50 flex items-center justify-center border border-slate-100 shrink-0">
             <UserIcon className="w-5 h-5 text-slate-400" />
          </div>

          <div className="h-6 w-px bg-slate-100 mx-1 hidden sm:block" />

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="rounded-2xl text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 sm:w-auto sm:px-3 flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-black uppercase tracking-widest">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
