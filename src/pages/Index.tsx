import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

const Index: React.FC = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login", { replace: true });
      } else if (profile?.first_login) {
        navigate("/account/setup", { replace: true });
      } else if (profile?.role === "admin") {
        navigate("/admin", { replace: true });
      } else {
        navigate("/app", { replace: true });
      }
    }
  }, [user, profile, loading, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center text-slate-500 gap-3">
      <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-xl shadow-emerald-200">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400 mt-2">
        A carregar ADXmoney...
      </p>
    </div>
  );
};

export default Index;
