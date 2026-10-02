import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, KeyRound, ShieldCheck, CheckCircle2, Lock, Eye, EyeOff, User, Phone, Link2 } from "lucide-react";

interface FirstAccessModalProps {
  isOpen: boolean;
  userEmail: string;
  initialName?: string | null;
  onSuccess: () => Promise<void>;
}

export const FirstAccessModal: React.FC<FirstAccessModalProps> = ({
  isOpen,
  userEmail,
  initialName,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState(initialName || "");
  const [phone, setPhone] = useState("");
  const [primaryLink, setPrimaryLink] = useState("");
  const [country, setCountry] = useState("Angola");

  const [loadingData, setLoadingData] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCurrentProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data, error } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", user.id)
            .single();

          if (data && !error) {
            if (data.name) setName(data.name);
            if (data.phone) setPhone(data.phone);
            if (data.primary_link) setPrimaryLink(data.primary_link);
            if (data.country) setCountry(data.country);
          }
        }
      } catch (err) {
        console.error("Erro ao buscar dados do perfil:", err);
      } finally {
        setLoadingData(false);
      }
    };

    if (isOpen) {
      fetchCurrentProfile();
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newPassword || newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("A confirmação da nova senha não confere.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw new Error(authError.message || "Erro ao atualizar a senha.");
      }

      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id) throw new Error("Sessão expirada. Por favor, tente novamente.");

      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          name: name.trim() || initialName || "Operador",
          phone: phone.trim() || null,
          primary_link: primaryLink.trim() || null,
          country: country.trim() || "Angola",
          first_login: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", currentUser.id);

      if (profileError) {
        throw profileError;
      }

      await supabase.from("activity_logs").insert({
        user_id: currentUser.id,
        action_type: "FIRST_LOGIN_COMPLETED",
        title: "Primeiro Acesso Concluído",
        details: "Senha definitiva configurada e dados confirmados pelo usuário.",
      });

      toast.success("Senha alterada com sucesso! Seu painel foi desbloqueado.");
      await onSuccess();
    } catch (err: any) {
      console.error("Erro no primeiro acesso:", err);
      toast.error(err.message || "Falha ao definir nova senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="max-w-lg bg-white border-none text-slate-900 sm:rounded-[32px] p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-left space-y-2 border-b border-slate-50 pb-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <KeyRound className="w-8 h-8" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">
            Configuração Inicial
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-xs font-black uppercase tracking-widest mt-1">
            Liberação Obrigatória de Operador
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-8 mt-6">
          <div className="space-y-5">
            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
              <Lock className="w-4 h-4" />
              <span>Segurança da Conta</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nova Palavra-passe</Label>
                <div className="relative">
                  <Input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Mínimo 6 chars"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all pr-10"
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Confirmar Senha</Label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all pr-10"
                    required
                    minLength={6}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-5 pt-2 border-t border-slate-50">
            <div className="flex items-center gap-2 text-emerald-600 font-black text-[10px] uppercase tracking-widest">
              <User className="w-4 h-4" />
              <span>Dados Identificativos</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nome Completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do Operador"
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">WhatsApp Operacional</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+244..."
                  className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all font-mono"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Link Principal de Trabalho</Label>
              <Input
                value={primaryLink}
                onChange={(e) => setPrimaryLink(e.target.value)}
                placeholder="Ex: tiktok.com/@seuusuario"
                className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 h-12 rounded-2xl text-sm font-bold transition-all"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-emerald-100 uppercase tracking-widest text-xs transition-all active:scale-[0.98]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Salvando Configurações...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  Ativar Minha Conta
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
