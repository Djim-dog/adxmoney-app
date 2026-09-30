import React from "react";
import { User, Lock, Loader2, CheckCircle2, ShieldCheck, Mail, Phone } from "lucide-react";
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
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-white tracking-tight">Meu Perfil e Segurança</h2>
        <p className="text-xs text-slate-400">Atualize suas credenciais e visualize os dados cadastrados.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800 lg:col-span-1">
          <CardHeader>
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xl mb-2">
              {(profile?.name || user?.email || "U").substring(0, 2).toUpperCase()}
            </div>
            <CardTitle className="text-base text-white">{profile?.name || "Usuário"}</CardTitle>
            <CardDescription className="text-xs text-slate-400">{user?.email}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-0 text-xs">
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> E-mail
              </span>
              <span className="text-slate-200 font-mono text-[11px] truncate max-w-[150px]">{user?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> Telefone
              </span>
              <span className="text-slate-200">{profile?.phone || "Não informado"}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Status da Conta
              </span>
              <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">
                Ativo / Verificado
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base text-white">Editar Informações</CardTitle>
            <CardDescription className="text-xs text-slate-400">
              Modifique seus dados de identificação e senha de acesso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Nome Completo</Label>
                  <Input
                    value={profileName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-300">Número de Telefone</Label>
                  <Input
                    value={profilePhone}
                    onChange={(e) => onPhoneChange(e.target.value)}
                    placeholder="Ex: 923 000 000"
                    className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80">
                <h4 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" /> Alterar Senha (Opcional)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Nova Senha</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => onNewPasswordChange(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-slate-300">Confirmar Nova Senha</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => onConfirmPasswordChange(e.target.value)}
                      placeholder="Repita a nova senha"
                      className="bg-slate-950 border-slate-800 text-white text-xs h-9"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button
                  type="submit"
                  disabled={updatingProfile}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-9 px-5 rounded-lg"
                >
                  {updatingProfile ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" /> Salvar Alterações
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
