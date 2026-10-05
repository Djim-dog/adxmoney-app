import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Upload, FileCheck, ShoppingCart } from 'lucide-react';

const EngagementOrderPage = () => {
  const { user } = useAuth();
  const [platform, setPlatform] = useState('TikTok');
  const [service, setService] = useState('Seguidores');
  const [link, setLink] = useState('');
  const [quantity, setQuantity] = useState('100');
  const [currency, setCurrency] = useState('Kz (AOA)');
  const [method, setMethod] = useState('MULTICAIXA');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

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
        p_currency: currency.includes('AOA') ? 'AOA' : currency,
        p_method: method,
        p_proof_url: filePath
      });

      if (error) throw error;
      toast({ title: "Pedido enviado!", description: "Aguarde a aprovação do admin." });
      navigate('/app');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro", description: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container max-w-lg py-12">
      <h1 className="text-3xl font-black mb-2">Comprar Engajamento</h1>
      <Card>
        <CardContent className="pt-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select value={platform} onValueChange={setPlatform}>
              <SelectTrigger><SelectValue placeholder="Plataforma" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="TikTok">TikTok</SelectItem>
                <SelectItem value="Instagram">Instagram</SelectItem>
                <SelectItem value="YouTube">YouTube</SelectItem>
              </SelectContent>
            </Select>

            <Select value={service} onValueChange={setService}>
              <SelectTrigger><SelectValue placeholder="Serviço" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Seguidores">Seguidores/Inscritos</SelectItem>
                <SelectItem value="Gostos">Gostos</SelectItem>
                <SelectItem value="Comentários">Comentários</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Link do perfil/publicação" value={link} onChange={e => setLink(e.target.value)} required />
            <Input type="number" placeholder="Quantidade" value={quantity} onChange={e => setQuantity(e.target.value)} required />

            <div className="border-dashed border-2 p-4 text-center cursor-pointer" onClick={() => document.getElementById('file-upload')?.click()}>
              <input id="file-upload" type="file" className="hidden" onChange={e => e.target.files && setFile(e.target.files[0])} />
              {file ? <FileCheck className="mx-auto text-emerald-500" /> : <Upload className="mx-auto text-gray-400" />}
            </div>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? <Loader2 className="animate-spin" /> : 'Confirmar Pedido'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default EngagementOrderPage;
