import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff, ShieldCheck } from "lucide-react";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
  isOpen,
  onSuccess,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      // Update first_login flag in profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ first_login: false })
        .eq("id", (await supabase.auth.getUser()).data.user?.id);

      if (profileError) throw profileError;

      toast.success("Senha alterada com sucesso!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Erro ao atualizar a senha.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md bg-white border-none shadow-2xl rounded-3xl p-8 max-h-[85vh] overflow-y-auto">
        <DialogHeader className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3 mx-auto shadow-sm">
            <Lock className="w-7 h-7" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 tracking-tight">
            Definir Palavra-passe Pessoal
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-500 font-medium mt-1">
            Por motivos de conformidade e segurança da sua conta bancária e saldo, altere a senha temporária para uma senha forte e individual.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Nova Palavra-passe
            </Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 pr-10 text-sm font-bold h-12 rounded-2xl transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
              Confirmar Palavra-passe
            </Label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-slate-50 border-transparent focus:bg-white focus:border-emerald-500 text-sm font-bold h-12 rounded-2xl transition-all"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest h-12 rounded-2xl shadow-xl shadow-emerald-100 transition-all active:scale-95 flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Atualizar e Prosseguir
              </>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
