import React, { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface SplashScreenProps {
  message?: string;
  showReloadAfterMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = "Conectando ao sistema...",
  showReloadAfterMs = 7000
}) => {
  const [showReload, setShowReload] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowReload(true);
    }, showReloadAfterMs);

    return () => clearTimeout(timer);
  }, [showReloadAfterMs]);

  const handleReload = () => {
    window.location.reload();
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-50 bg-slate-50 flex flex-col items-center justify-center antialiased p-4 select-none"
    >
      <div className="relative flex flex-col items-center gap-8 max-w-xs text-center">
        {/* Logo Container */}
        <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20 overflow-hidden animate-in fade-in zoom-in duration-500">
          {!imgError ? (
            <img
              src="/logo.png"
              alt="ADXmoney"
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-white text-3xl font-black tracking-wider">ADX</span>
          )}
        </div>

        {/* Título e Status de Carregamento */}
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-black text-slate-900 tracking-tight text-3xl">ADXmoney</h1>
          <div className="flex items-center gap-2 text-slate-500 font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="text-sm">{message}</span>
          </div>
        </div>

        {/* Botão de contingência se a conexão estiver lenta */}
        {showReload && (
          <div className="mt-2 flex flex-col items-center gap-2 animate-in fade-in duration-500">
            <p className="text-xs text-slate-400">Está demorando mais do que o esperado?</p>
            <button
              onClick={handleReload}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-full border border-emerald-200 transition-colors shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              Recarregar página
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
