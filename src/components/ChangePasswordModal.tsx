import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";

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
      <DialogContent className="max-w-sm bg-slate-900 border-slate-800 text-slate-100 sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2 mx-auto">
            <Lock className="w-5 h-5 text-amber-500" />
          </div>
          <DialogTitle className="text-center text-lg font-bold">Alteração de Senha</DialogTitle>
          <DialogDescription className="text-center text-xs text-slate-400">
            Como este é seu primeiro acesso, é obrigatório alterar sua senha pré-definida para uma senha pessoal e segura.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Nova Senha</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-slate-950 border-slate-800 pr-10 text-xs"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-300">Confirmar Nova Senha</Label>
            <Input
              type="password"
              placeholder="Repita a nova senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-slate-950 border-slate-800 text-xs"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold h-9"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Atualizar e Prosseguir"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
