import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, KeyRound, ShieldCheck, CheckCircle2, Lock, Eye, EyeOff } from "lucide-react";

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
  const [tiktok, setTiktok] = useState("");
  const [instagram, setInstagram] = useState("");
  const [youtube, setYoutube] = useState("");
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
            if (data.tiktok) setTiktok(data.tiktok);
            if (data.instagram) setInstagram(data.instagram);
            if (data.youtube) setYoutube(data.youtube);
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
          tiktok: tiktok.trim() || null,
          instagram: instagram.trim() || null,
          youtube: youtube.trim() || null,
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
        className="max-w-lg bg-white border-slate-200 text-slate-900 sm:rounded-3xl p-8 shadow-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-left space-y-2 border-b border-slate-100 pb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-2">
            <KeyRound className="w-7 h-7" />
          </div>
          <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            Troca Obrigatória de Senha
            <span className="text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
              1º Acesso
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 text-sm font-medium leading-relaxed">
            Por motivos de segurança, você deve substituir a senha pré-definida temporária por uma nova senha pessoal definitiva para liberar o painel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-2">
          <div className="p-6 rounded-3xl bg-slate-50 border border-slate-100 space-y-5">
            <div className="flex items-center gap-2 text-emerald-700 font-black text-xs uppercase tracking-widest">
              <Lock className="w-4 h-4" />
              <span>Nova Senha Pessoal *</span>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nova Senha (Mínimo 6 caracteres)</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 pr-12 text-sm rounded-2xl h-12"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 pr-12 text-sm rounded-2xl h-12"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-900"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-1">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
              <img src="/logo.png" alt="Logo" className="w-5 h-5 object-contain" />
              Confirmação de Perfil
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Nome Completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 text-sm rounded-2xl h-12"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Telefone / WhatsApp</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-white border-slate-200 text-slate-900 text-sm rounded-2xl h-12"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Link Principal de Trabalho</Label>
              <Input
                value={primaryLink}
                onChange={(e) => setPrimaryLink(e.target.value)}
                placeholder="https://..."
                className="bg-white border-slate-200 text-slate-900 text-sm rounded-2xl h-12"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-14 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-100 uppercase tracking-widest text-xs"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Concluir e Acessar Painel
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
