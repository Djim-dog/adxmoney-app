import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck, Zap, Users } from 'lucide-react';

const SubscriptionPage = () => {
  const { profile, loading: authLoading } = useAuth();
  const [amount, setAmount] = useState('5000'); // Valor padrão exemplo
  const [method, setMethod] = useState('UNITEL');
  const [proofUrl, setProofUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('submit_subscription_payment', {
        p_amount: parseFloat(amount),
        p_currency: 'AOA',
        p_method: method,
        p_proof_url: proofUrl,
        p_payment_date: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Seu pagamento foi submetido para análise. O prazo de ativação é de até 24h.",
      });
      // Refresh context or just wait for status change
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const renderStatus = () => {
    const status = profile?.subscription_status || 'visitor';

    if (status === 'active') {
      return (
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            <div className="bg-green-100 p-4 rounded-full">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Conta Ativa!</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Parabéns! Sua conta está totalmente ativa e você já pode começar a faturar.
            </p>
          </div>
          <Button onClick={() => navigate('/app')} size="lg" className="px-8 rounded-full">
            Ir para o Dashboard <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (status === 'pending') {
      return (
        <div className="text-center space-y-6 py-8">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-4 rounded-full">
              <Clock className="h-16 w-16 text-blue-600 animate-pulse" />
            </div>
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Análise em Andamento</h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Recebemos seu comprovativo. Nossa equipe administrativa está validando seu pagamento.
              Isso costuma levar menos de 24 horas.
            </p>
          </div>
          <div className="pt-4">
            <Button variant="outline" onClick={() => navigate('/app')} className="rounded-full">
              Explorar App (Modo Visitante)
            </Button>
          </div>
        </div>
      );
    }

    if (status === 'rejected') {
      return (
        <div className="space-y-6 py-4">
          <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
            <XCircle className="h-10 w-10 text-red-600 shrink-0" />
            <div>
              <h3 className="font-bold text-red-900">Pagamento Rejeitado</h3>
              <p className="text-sm text-red-700">Por favor, verifique os dados e tente novamente ou entre em contato com o suporte.</p>
            </div>
          </div>
          {renderForm()}
        </div>
      );
    }

    return renderForm();
  };

  const renderForm = () => (
    <div className="space-y-8">
            <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Zap, title: "Acesso Total", desc: "Campanhas" },
                  { icon: Users, title: "Afiliados", desc: "Indicação" },
                  { icon: ShieldCheck, title: "Saques", desc: "Rápidos" }
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl text-center space-y-2 border border-slate-100">
                    <item.icon className="h-6 w-6 mx-auto text-emerald-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{item.title}</p>
                    <p className="text-[10px] text-slate-600 leading-tight font-medium">{item.desc}</p>
                  </div>
                ))}
              </div>

      <Card className="border-none shadow-2xl shadow-slate-200 bg-white/50 backdrop-blur-sm rounded-3xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-black uppercase tracking-widest text-slate-900">Ativar conta</CardTitle>
        <CardDescription className="text-slate-400 font-medium">
          Escolha seu método de pagamento e anexe o comprovativo.
        </CardDescription>
      </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('UNITEL')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    method === 'UNITEL' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="font-bold">Unitel Money</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMethod('EXPRESS')}
                  className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                    method === 'EXPRESS' ? 'border-emerald-500 bg-emerald-50' : 'border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <span className="font-bold">Multicaixa</span>
                </button>
              </div>

            <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Valor do Plano (AOA)</label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-2xl h-14 bg-slate-50 border-transparent focus-visible:ring-emerald-500 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Link do Comprovativo</label>
                <Input
                  type="url"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  placeholder="https://..."
                  className="rounded-2xl h-14 bg-slate-50 border-transparent focus-visible:ring-emerald-500 font-medium"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processando...
                </>
              ) : 'Confirmar Pagamento'}
            </Button>
            
            <p className="text-center text-xs text-gray-400">
              Ao clicar em confirmar, você concorda com nossos termos de uso e política de privacidade.
            </p>
          </form>
        </CardContent>
      </Card>
      
      <div className="text-center mt-6">
        <Button variant="ghost" onClick={() => navigate('/app')} className="text-slate-400 hover:text-emerald-600 font-bold uppercase tracking-widest text-xs">
          Entrar como Visitante
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight italic">ADX<span className="text-emerald-600 not-italic">MONEY</span></h1>
          <p className="text-slate-500 font-medium">A maior plataforma de faturamento digital de Angola</p>
        </div>
        {renderStatus()}
      </div>
    </div>
  );
};

export default SubscriptionPage;
