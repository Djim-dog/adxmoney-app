import React, { useEffect } from "react";
import { useLocation, Link } from "react-router-dom";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-md w-full text-center bg-white p-10 rounded-3xl shadow-xl shadow-slate-100 border border-slate-100 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 shadow-sm">
          <FileQuestion className="w-8 h-8" />
        </div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">404</h1>
        <p className="text-sm font-bold text-slate-700 mb-2">Página não encontrada</p>
        <p className="text-xs text-slate-400 font-medium mb-8">
          O caminho solicitado não existe ou foi movido na plataforma ADXmoney.
        </p>
        <Link to="/app" className="w-full">
          <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest h-12 rounded-2xl shadow-xl shadow-emerald-100 transition-all flex items-center justify-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
