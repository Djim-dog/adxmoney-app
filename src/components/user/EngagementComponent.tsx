import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Upload, FileCheck, ShoppingCart, History } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const EngagementComponent = () => {
  const { user } = useAuth();
  const [platform, setPlatform] = useState('TikTok');
  const [service, setService] = useState('Seguidores');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [view, setView] = useState<'buy' | 'history'>('buy');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !user) return;
    setSubmitting(true);
    try {
      const filePath = `${user.id}/eng_${Date.now()}.${file.name.split('.').pop()}`;
      await supabase.storage.from('subscription-proofs').upload(filePath, file);
      const { error } = await supabase.rpc('submit_engagement_order', {
        p_platform: platform,
        p_service_type: service,
        p_target_link: link,
        p_quantity: parseInt(quantity),
        p_currency: 'AOA',
        p_method: 'MULTICAIXA',
        p_proof_url: filePath
      });
      if (error) throw error;
      toast({ title: "Pedido enviado!" });
      setView('history');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <div className="flex gap-2">
        <Button variant={view === 'buy' ? 'default' : 'outline'} onClick={() => setView('buy')} className="flex-1"><ShoppingCart className="mr-2 h-4 w-4"/> Comprar</Button>
        <Button variant={view === 'history' ? 'default' : 'outline'} onClick={() => setView('history')} className="flex-1"><History className="mr-2 h-4 w-4"/> Histórico</Button>
      </div>
      
      {view === 'buy' ? (
        <Card>
          <CardHeader><CardTitle>Novo Pedido</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Select value={platform} onValueChange={setPlatform}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="TikTok">TikTok</SelectItem><SelectItem value="Instagram">Instagram</SelectItem><SelectItem value="YouTube">YouTube</SelectItem></SelectContent></Select>
              <Select value={service} onValueChange={setService}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Seguidores">Seguidores</SelectItem><SelectItem value="Gostos">Gostos</SelectItem><SelectItem value="Comentários">Comentários</SelectItem></SelectContent></Select>
              <Input placeholder="Link" value={link} onChange={e => setLink(e.target.value)} required />
              <Input type="number" placeholder="Quantidade" value={quantity} onChange={e => setQuantity(e.target.value)} required />
              <div className="border-2 border-dashed p-4 text-center cursor-pointer" onClick={() => document.getElementById('eng-file')?.click()}>
                <input id="eng-file" type="file" className="hidden" onChange={e => e.target.files && setFile(e.target.files[0])} />
                {file ? <FileCheck className="mx-auto text-emerald-500" /> : <Upload className="mx-auto text-gray-400" />}
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>{submitting ? <Loader2 className="animate-spin"/> : 'Confirmar'}</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <p className="text-center text-gray-500 py-10">Histórico de pedidos em breve.</p>
      )}
    </div>
  );
};

export default EngagementComponent;