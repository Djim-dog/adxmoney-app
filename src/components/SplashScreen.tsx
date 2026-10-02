import React from "react";

interface SplashScreenProps {
  message?: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ 
  message = "Carregando recursos..." 
}) => {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center antialiased">
      <div className="relative flex flex-col items-center gap-6">
        <div className="w-24 h-24 rounded-3xl bg-emerald-600 flex items-center justify-center shadow-2xl shadow-emerald-100 overflow-hidden animate-pulse">
          <img src="/logo.png" alt="ADXmoney" className="w-full h-full object-cover" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="font-black text-slate-900 tracking-tight text-2xl">ADXmoney</span>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {message}
          </span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '100ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '200ms' }}></span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
        </div>
      </div>
    </div>
  );
};
