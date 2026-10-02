import React from "react";

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  message = "Conectando ao sistema..."
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center antialiased p-4">
      <div className="relative flex flex-col items-center gap-8">
        <div className="w-32 h-32 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-500/20 overflow-hidden animate-in fade-in zoom-in duration-500">
          <img src="/logo.png" alt="ADXmoney" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-3">
          <h1 className="font-black text-slate-900 tracking-tight text-3xl">ADXmoney</h1>
          <div className="flex items-center gap-1.5 text-slate-500 font-medium tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-sm">{message}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
