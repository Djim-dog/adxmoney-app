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
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});
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
          profiles!fk_subscription_payments_profiles (name, email)
        `)
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
      
      // Gerar signed URLs para cada comprovativo privado
      if (data && data.length > 0) {
        const urls: Record<string, string> = {};
        for (const req of data) {
          if (req.proof_url) {
            if (req.proof_url.startsWith('http://') || req.proof_url.startsWith('https://')) {
              urls[req.id] = req.proof_url;
            } else {
              const { data: signedData } = await supabase.storage
                .from('subscription-proofs')
                .createSignedUrl(req.proof_url, 3600);
              if (signedData?.signedUrl) {
                urls[req.id] = signedData.signedUrl;
              }
            }
          }
        }
        setSignedUrls(urls);
      }
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
                    <p className="font-bold">{request.profiles?.name || request.profiles?.email || 'N/A'}</p>
                    <p className="text-xs text-gray-500">{request.profiles?.email}</p>
                  </div>
                  
                  <div className="p-4 border-b md:border-b-0 md:border-r">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Pagamento</p>
                    <div className="flex items-center gap-2">
                      <Wallet className="h-3 w-3 text-gray-400" />
                      <p className="font-bold text-lg">
                        {request.amount} {request.currency}
                      </p>
                    </div>
                    <Badge variant="outline" className="mt-1">{request.method}</Badge>
                  </div>

                  <div className="p-4 border-b md:border-b-0 md:border-r">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Comprovativo</p>
                    {signedUrls[request.id] ? (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
                        onClick={() => window.open(signedUrls[request.id], '_blank')}
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver comprovativo
                      </Button>
                    ) : (
                      <span className="text-xs text-slate-400">Sem comprovativo</span>
                    )}
                  </div>

                  <div className="p-4 flex items-center justify-end gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      disabled={processingId === request.id}
                      onClick={() => {
                        const reason = prompt("Motivo da rejeição (opcional):");
                        if (reason !== null) {
                          handleProcess(request.id, 'REJECTED', reason || undefined);
                        }
                      }}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Rejeitar
                    </Button>
                    <Button 
                      size="sm" 
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      disabled={processingId === request.id}
                      onClick={() => handleProcess(request.id, 'APPROVED')}
                    >
                      {processingId === request.id ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Check className="h-4 w-4 mr-1" />
                      )}
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
