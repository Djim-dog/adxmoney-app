import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Check, X, Eye, Loader2, ExternalLink, Calendar, Wallet } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

const SubscriptionRequests = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('subscription_payments')
        .select(`
          *,
          profiles!fk_subscription_payments_profiles (username, email)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao carregar solicitações",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      setProcessingId(id);
      const { data, error } = await supabase.rpc('admin_process_subscription_payment', {
        p_payment_id: id,
        p_status: status,
        p_rejection_reason: reason
      });

      if (error) throw error;

      toast({
        title: status === 'APPROVED' ? "Assinatura aprovada!" : "Assinatura rejeitada",
        description: "O status do usuário foi atualizado com sucesso.",
      });

      setRequests(requests.filter(r => r.id !== id));
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao processar",
        description: error.message,
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Solicitações de Assinatura</h2>
        <Badge variant="secondary" className="px-3 py-1">{requests.length} Pendentes</Badge>
      </div>

      <div className="grid gap-4">
        {requests.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center text-gray-500">
              Nenhuma solicitação pendente no momento.
            </CardContent>
          </Card>
        ) : (
          requests.map((request) => (
            <Card key={request.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-4 items-center">
                  <div className="p-4 border-b md:border-b-0 md:border-r bg-gray-50/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Usuário</p>
                    <p className="font-bold">{request.profiles?.username || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{request.profiles?.email}</p>
                  </div>
                  
                  <div className="p-4 border-b md:border-b-0 md:border-r">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Pagamento</p>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3 w-3 text-gray-400" />
                      <p className="font-bold text-lg">{formatCurrency(request.amount)}</p>
                    </div>
                    <Badge variant="outline" className="mt-1">{request.method}</Badge>
                  </div>

                  <div className="p-4 border-b md:border-b-0 md:border-r">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Comprovativo</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-primary text-xs font-bold flex items-center gap-1"
                      onClick={() => window.open(request.proof_url, '_blank')}
                    >
                      Ver Comprovativo <ExternalLink className="h-3 w-3" />
                    </Button>
                    <div className="flex items-center gap-1 mt-1 text-[10px] text-gray-400">
                      <Calendar className="h-3 w-3" />
                      {new Date(request.created_at).toLocaleDateString('pt-AO')}
                    </div>
                  </div>

                  <div className="p-4 flex gap-2 justify-end bg-gray-50/50">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="rounded-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                      onClick={() => handleProcess(request.id, 'REJECTED', 'Comprovativo inválido ou valor incorreto.')}
                      disabled={!!processingId}
                    >
                      {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4 mr-1" />}
                      Rejeitar
                    </Button>
                    <Button 
                      size="sm" 
                      className="rounded-full h-10 px-6 font-bold"
                      onClick={() => handleProcess(request.id, 'APPROVED')}
                      disabled={!!processingId}
                    >
                      {processingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Aprovar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SubscriptionRequests;
