import React from "react";
import { User, Lock, Loader2, CheckCircle2, ShieldCheck, Mail, Phone, Settings, UserCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface UserProfileSectionProps {
  user: any;
  profile: any;
  profileName: string;
  profilePhone: string;
  newPassword: string;
  confirmPassword: string;
  updatingProfile: boolean;
  onNameChange: (val: string) => void;
  onPhoneChange: (val: string) => void;
  onNewPasswordChange: (val: string) => void;
  onConfirmPasswordChange: (val: string) => void;
  onUpdateProfile: (e: React.FormEvent) => void;
}

export const UserProfileSection: React.FC<UserProfileSectionProps> = ({
  user,
  profile,
  profileName,
  profilePhone,
  newPassword,
  confirmPassword,
  updatingProfile,
  onNameChange,
  onPhoneChange,
  onNewPasswordChange,
  onConfirmPasswordChange,
  onUpdateProfile,
}) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="px-1">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Meu Perfil e Segurança</h2>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-widest mt-1">Gerencie suas credenciais e dados pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden lg:col-span-1 h-fit">
          <CardHeader className="pb-6 pt-8 px-8 items-center text-center">
            <div className="w-24 h-24 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-3xl mb-4 shadow-sm border border-emerald-100">
              {(profile?.name || user?.email || "U").substring(0, 2).toUpperCase()}
            </div>
            <CardTitle className="text-xl font-black text-slate-900 tracking-tight">{profile?.name || "Operador"}</CardTitle>
            <CardDescription className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-0 px-8 pb-10">
            <div className="flex flex-col gap-1 py-3 border-b border-slate-50">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-emerald-500" /> Endereço de E-mail
              </span>
              <span className="text-sm font-bold text-slate-700 truncate">{user?.email}</span>
            </div>
            <div className="flex flex-col gap-1 py-3 border-b border-slate-50">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                <Phone className="w-3 h-3 text-emerald-500" /> WhatsApp Conectado
              </span>
              <span className="text-sm font-bold text-slate-700">{profile?.phone || "Não informado"}</span>
            </div>
            <div className="flex items-center justify-between py-4">
              <span className="text-[9px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Status Global
              </span>
              <Badge className="bg-emerald-50 text-emerald-600 border-none font-black text-[9px] uppercase tracking-widest px-2.5 py-1">
                Ativo / Verificado
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-none shadow-xl shadow-slate-100 rounded-3xl overflow-hidden lg:col-span-2">
          <CardHeader className="pb-6 pt-8 px-8 border-b border-slate-50 mb-6">
            <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
                  <Settings className="w-5 h-5" />
               </div>
               <div>
                  <CardTitle className="text-lg font-black text-slate-900 tracking-tight">Parametrizar Conta</CardTitle>
                  <CardDescription className="text-xs text-slate-500 font-medium">Atualize suas informações de identificação.</CardDescription>
               </div>
            </div>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <form onSubmit={onUpdateProfile} className="space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <UserCircle2 className="w-3 h-3 text-emerald-500" /> Nome de Operador
                  </Label>
                  <Input
                    value={profileName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3 h-3 text-emerald-500" /> Telefone Operacional
                  </Label>
                  <Input
                    value={profilePhone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="Ex: 923 000 000"
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all font-mono"
                  />
                </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-emerald-500" /> Segurança e Acesso
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nova Palavra-passe</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => onNewPasswordChange(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Confirmar Palavra-passe</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => onConfirmPasswordChange(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase tracking-widest h-12 px-10 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95"
                >
                  {updatingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Atualizar Perfil
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
