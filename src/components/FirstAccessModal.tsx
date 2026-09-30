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

  // Carregar dados existentes do perfil ao abrir
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

    // Validações obrigatórias da nova senha
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
      // 1. Atualizar a senha no serviço de autenticação do Supabase (esquecendo a senha provisória)
      const { error: authError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (authError) {
        throw new Error(authError.message || "Erro ao atualizar a senha.");
      }

      // 2. Atualizar perfil e marcar first_login como false
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado.");

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
        .eq("id", user.id);

      if (profileError) {
        throw profileError;
      }

      // 3. Registrar log de atividade
      await supabase.from("activity_logs").insert({
        user_id: user.id,
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
        className="max-w-lg bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className="text-left space-y-2">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-1">
            <KeyRound className="w-6 h-6" />
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Troca Obrigatória de Senha
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              1º Acesso
            </span>
          </DialogTitle>
          <DialogDescription className="text-slate-400 text-xs leading-relaxed">
            Por motivos de segurança, você deve substituir a senha pré-definida temporária por uma nova senha pessoal definitiva para liberar o painel.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* Bloco de Nova Senha Obrigatória */}
          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/30 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
              <Lock className="w-4 h-4" />
              <span>Definir Nova Senha Pessoal *</span>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Nova Senha (Mínimo 6 caracteres) *</Label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-slate-100 pr-10 text-xs"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs text-slate-300">Confirmar Nova Senha *</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repita sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-slate-900 border-slate-800 text-slate-100 pr-10 text-xs"
                  required
                  minLength={6}
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Bloco de Confirmação de Perfil */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-sky-400" />
              Confirmação dos Dados Cadastrados
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-400">Nome Completo</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-400">Telefone / WhatsApp</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-slate-400">Link Principal Cadastrado</Label>
              <Input
                value={primaryLink}
                onChange={(e) => setPrimaryLink(e.target.value)}
                placeholder="https://..."
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                disabled={isSubmitting}
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-400">TikTok</Label>
                <Input
                  value={tiktok}
                  onChange={(e) => setTiktok(e.target.value)}
                  placeholder="@perfil"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-400">Instagram</Label>
                <Input
                  value={instagram}
                  onChange={(e) => setInstagram(e.target.value)}
                  placeholder="@perfil"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-[11px] text-slate-400">YouTube</Label>
                <Input
                  value={youtube}
                  onChange={(e) => setYoutube(e.target.value)}
                  placeholder="Canal/@"
                  className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[11px] text-slate-400">País</Label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-slate-950 border-slate-800 text-slate-100 text-xs"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="pt-3">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold h-10 flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/40"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Gravando nova senha...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Salvar Nova Senha & Liberar Painel
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
