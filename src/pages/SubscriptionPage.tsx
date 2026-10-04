import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, Clock, ArrowRight, ShieldCheck, Zap, Users, Upload, FileCheck } from 'lucide-react';

const PLAN_RATES: Record<string, { amount: number; label: string; symbol: string }> = {
  AOA: { amount: 4800, label: '4.800 Kz', symbol: 'Kz' },
  USD: { amount: 5.53, label: '$5.53', symbol: '$' },
  EUR: { amount: 4.99, label: '€4.99', symbol: '€' },
  BRL: { amount: 24.95, label: 'R$ 24,95', symbol: 'R$' },
};

const SubscriptionPage = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [currency, setCurrency] = useState<'AOA' | 'USD' | 'EUR' | 'BRL'>('AOA');
  const [method, setMethod] = useState<'EXPRESS' | 'UNITEL' | 'REMITLY'>('EXPRESS');
  const [file, setFile] = useState<File | null>(null);
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

  const handleCurrencyChange = (newCurr: 'AOA' | 'USD' | 'EUR' | 'BRL') => {
    setCurrency(newCurr);
    if (newCurr === 'AOA') {
      setMethod('EXPRESS');
    } else {
      setMethod('REMITLY');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          variant: "destructive",
          title: "Formato inválido",
          description: "Por favor envie um comprovativo em PDF, JPG ou PNG.",
        });
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast({
        variant: "destructive",
        title: "Comprovativo obrigatório",
        description: "Selecione o ficheiro do comprovativo de pagamento antes de prosseguir.",
      });
      return;
    }

    if (!user) {
      toast({
        variant: "destructive",
        title: "Não autenticado",
        description: "Por favor faça login novamente.",
      });
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload seguro para o bucket privado subscription-proofs
      const fileExt = file.name.split('.').pop() || 'png';
      const filePath = `${user.id}/${Date.now()}_proof.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('subscription-proofs')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw new Error(`Falha no upload do comprovativo: ${uploadError.message}`);
      }

      // 2. Chamar RPC segura passando o path do arquivo e os dados validados
      const { error } = await supabase.rpc('submit_subscription_payment', {
        p_amount: PLAN_RATES[currency].amount,
        p_currency: currency,
        p_method: method,
        p_proof_url: filePath,
        p_payment_date: new Date().toISOString()
      });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Seu pagamento foi submetido para análise. O prazo de ativação é de até 24h.",
      });
      // Recarregar status
      window.location.reload();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
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
            Escolha sua moeda, forma de pagamento e anexe o comprovativo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seleção de Moeda */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Selecione a Moeda</label>
              <div className="grid grid-cols-4 gap-2">
                {(['AOA', 'USD', 'EUR', 'BRL'] as const).map((curr) => (
                  <button
                    key={curr}
                    type="button"
                    onClick={() => handleCurrencyChange(curr)}
                    className={`py-2 px-3 rounded-xl border-2 text-sm font-bold transition-all ${
                      currency === curr
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            {/* Métodos de Pagamento Disponíveis */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Método de Pagamento</label>
              {currency === 'AOA' ? (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMethod('EXPRESS')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                      method === 'EXPRESS' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-sm">Multicaixa Express</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('UNITEL')}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-1 ${
                      method === 'UNITEL' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-100 hover:border-slate-200 text-slate-600'
                    }`}
                  >
                    <span className="font-bold text-sm">Unitel Money</span>
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-emerald-800 flex items-center justify-between">
                  <span className="font-bold text-sm">Remitly</span>
                  <span className="text-xs bg-emerald-200 text-emerald-800 font-bold px-2 py-0.5 rounded-full">Internacional</span>
                </div>
              )}
            </div>

            {/* Informações de Pagamento / Destinatário */}
            <div className="p-4 bg-slate-50 border border-slate-200/60 rounded-2xl space-y-2 text-xs text-slate-700">
              <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                <span className="font-bold text-slate-500 uppercase tracking-wider">Valor Exigido</span>
                <span className="text-base font-black text-emerald-600">{PLAN_RATES[currency].label}</span>
              </div>
              {currency === 'AOA' && method === 'EXPRESS' && (
                <div>
                  <p className="font-semibold text-slate-900">Entidade Multicaixa Express:</p>
                  <p className="font-mono text-slate-600">Número de telefone / Referência de pagamento no app</p>
                </div>
              )}
              {currency === 'AOA' && method === 'UNITEL' && (
                <div>
                  <p className="font-semibold text-slate-900">Unitel Money:</p>
                  <p className="font-mono text-slate-600">Transferência para a conta comercial oficial</p>
                </div>
              )}
              {currency !== 'AOA' && (
                <div className="space-y-1">
                  <p className="font-bold text-slate-900 uppercase tracking-wider">Dados para Envio (Remitly):</p>
                  <p><strong>Beneficiário:</strong> adxmoney Company</p>
                  <p><strong>País:</strong> Angola</p>
                  <p><strong>Cidade:</strong> Luanda</p>
                  <p><strong>Telefone:</strong> +244 933271690</p>
                  <p><strong>Método de recebimento:</strong> Bank account</p>
                </div>
              )}
            </div>

            {/* Upload do Comprovativo Físico */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Anexar Comprovativo (PDF, JPG, PNG)</label>
              <div className="relative border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors rounded-2xl p-4 text-center cursor-pointer bg-slate-50">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, application/pdf"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  required
                />
                {file ? (
                  <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                    <FileCheck className="h-5 w-5" />
                    <span className="truncate max-w-[240px]">{file.name}</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-500">
                    <Upload className="h-6 w-6 text-slate-400" />
                    <span className="text-xs font-medium">Toque para selecionar o ficheiro</span>
                  </div>
                )}
              </div>
            </div>

            <Button type="submit" disabled={submitting} className="w-full h-14 rounded-2xl text-lg font-bold shadow-lg shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700">
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  A enviar comprovativo...
                </>
              ) : 'Confirmar Pagamento'}
            </Button>
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
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight italic">ADX<span className="text-emerald-600 not-italic">MONEY</span></h1>
          <p className="text-slate-500 font-medium">A maior plataforma de faturamento digital de Angola</p>
        </div>
        {renderStatus()}
      </div>
    </div>
  );
};

export default SubscriptionPage;
