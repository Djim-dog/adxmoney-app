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
  Layers
} from "lucide-react";

export const Navbar: React.FC = () => {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.first_name 
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : user?.email?.split("@")[0] || "Usuário";

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link to="/" className="flex items-center gap-2.5 font-bold text-lg text-slate-900">
            <div className="p-2 bg-indigo-600 text-white rounded-xl shadow-md shadow-indigo-100 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <span className="tracking-tight hidden sm:inline">Workspace Hub</span>
          </Link>

          <nav className="flex items-center gap-2">
            <Link to="/">
              <Button 
                variant={location.pathname === "/" ? "secondary" : "ghost"} 
                size="sm"
                className="rounded-xl flex items-center gap-2 font-medium"
              >
                <LayoutDashboard className="w-4 h-4 text-indigo-600" />
                <span>Painel Principal</span>
              </Button>
            </Link>

            {isAdmin && (
              <Link to="/admin">
                <Button 
                  variant={location.pathname === "/admin" ? "secondary" : "ghost"} 
                  size="sm"
                  className="rounded-xl flex items-center gap-2 font-medium text-amber-700 hover:text-amber-800"
                >
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Painel Admin</span>
                </Button>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 border border-slate-200/50">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-semibold flex items-center justify-center text-xs">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col text-left text-xs">
              <span className="font-semibold text-slate-800">{displayName}</span>
              <span className="text-slate-500 capitalize">{profile?.role || "user"}</span>
            </div>
          </div>

          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleSignOut}
            className="rounded-xl text-rose-600 hover:text-rose-700 hover:bg-rose-50"
          >
            <LogOut className="w-4 h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">Sair</span>
          </Button>
        </div>
      </div>
    </header>
  );
};
