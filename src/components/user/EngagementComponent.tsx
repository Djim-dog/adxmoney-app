import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  TrendingUp,
  ShoppingBag,
  History,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  ExternalLink,
  Upload,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  DollarSign,
  Heart,
  UserPlus,
  MessageCircle,
  FileCheck,
  Loader2,
  AlertCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface EngagementOrder {
  id: string;
  user_id: string;
  platform: string;
  service_type: string;
  target_link: string;
  quantity: number;
  total_price: number;
  currency: string;
  method: string;
  proof_url: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  rejection_reason?: string;
  created_at: string;
}

export const EngagementComponent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"buy" | "history">("buy");

  // Form State
  const [platform, setPlatform] = useState<"TikTok" | "Instagram" | "YouTube">("TikTok");
  const [serviceType, setServiceType] = useState<"Seguidores" | "Gostos" | "Comentários">("Seguidores");
  const [targetLink, setTargetLink] = useState("");
  const [quantity, setQuantity] = useState<number>(100);
  const [method, setMethod] = useState<"MULTICAIXA" | "UNITEL" | "IBAN">("MULTICAIXA");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // History State
  const [orders, setOrders] = useState<EngagementOrder[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Unit pricing based on backend rules
  const getUnitPrice = (plat: string, srv: string): number => {
    if (plat === "TikTok" || plat === "Instagram") {
      if (srv === "Seguidores") return 29;
      return 25; // Gostos ou Comentários
    }
    if (plat === "YouTube") {
      if (srv === "Seguidores") return 35;
      return 30; // Gostos ou Comentários
    }
    return 29;
  };

  const unitPrice = getUnitPrice(platform, serviceType);
  const totalPrice = unitPrice * (quantity || 0);

  // Quick quantity presets
  const quantityPresets = [100, 250, 500, 1000, 2000];

  const fetchOrders = async () => {
    if (!user) return;
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from("engagement_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setOrders((data as EngagementOrder[]) || []);
    } catch (err: any) {
      console.error("Erro ao carregar histórico:", err);
      toast.error("Não foi possível carregar o histórico de pedidos.");
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "history") {
      fetchOrders();
    }
  }, [activeTab, user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado com sucesso!`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Você precisa estar autenticado.");
      return;
    }

    if (!targetLink.trim()) {
      toast.error("Por favor, informe o link do perfil ou publicação.");
      return;
    }

    if (!quantity || quantity < 10) {
      toast.error("A quantidade mínima para pedido é 10.");
      return;
    }

    if (!file) {
      toast.error("Por favor, anexe o comprovativo de transferência ou pagamento.");
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/eng_${Date.now()}.${fileExt}`;

      // Upload proof to storage
      const { error: uploadError } = await supabase.storage
        .from("subscription-proofs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Falha no upload do comprovativo: ${uploadError.message}`);
      }

      // Call submit_engagement_order RPC
      const { error: rpcError } = await supabase.rpc("submit_engagement_order", {
        p_platform: platform,
        p_service_type: serviceType,
        p_target_link: targetLink.trim(),
        p_quantity: quantity,
        p_currency: "AOA",
        p_method: method,
        p_proof_url: fileName,
      });

      if (rpcError) {
        // Fallback: direct insert if RPC has permission restriction
        const { error: insertError } = await supabase.from("engagement_orders").insert({
          user_id: user.id,
          platform,
          service_type: serviceType,
          target_link: targetLink.trim(),
          quantity,
          total_price: totalPrice,
          currency: "AOA",
          method,
          proof_url: fileName,
          status: "PENDING",
        });

        if (insertError) throw insertError;
      }

      toast.success("Pedido de engajamento enviado com sucesso! Aguarde a validação.");
      setTargetLink("");
      setFile(null);
      setQuantity(100);
      setActiveTab("history");
      fetchOrders();
    } catch (err: any) {
      console.error("Erro ao enviar pedido de engajamento:", err);
      toast.error(err.message || "Erro ao processar o seu pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 border-emerald-200 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Aprovado
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 hover:bg-rose-500/25 border-rose-200 flex items-center gap-1 font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 border-amber-200 flex items-center gap-1 font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendente
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              Impulsionamento de Redes Sociais
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Serviços de Engajamento
            </h1>
            <p className="text-sm text-slate-300">
              Aumente seguidores, curtidas e comentários reais com a comunidade ADX Money.
            </p>
          </div>

          <div className="flex bg-slate-800/80 p-1 rounded-2xl border border-slate-700/60 backdrop-blur-md self-start md:self-auto">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "buy"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              Comprar
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "history"
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-900/40"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              Histórico
              {orders.length > 0 && (
                <span className="ml-1 bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                  {orders.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: COMPRA DE ENGAJAMENTO */}
      {activeTab === "buy" && (
        <div className="grid gap-6 md:grid-cols-12">
          {/* Main Purchase Form */}
          <div className="md:col-span-8">
            <Card className="rounded-3xl border-slate-200/80 shadow-md">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                  Configurar Pedido de Engajamento
                </CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Selecione a plataforma, serviço e anexe o comprovativo do pagamento para ativação.
                </CardDescription>
              </CardHeader>

              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Platform Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      1. Plataforma
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {(["TikTok", "Instagram", "YouTube"] as const).map((plat) => (
                        <button
                          key={plat}
                          type="button"
                          onClick={() => setPlatform(plat)}
                          className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                            platform === plat
                              ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm"
                              : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                          }`}
                        >
                          <span className="text-sm font-bold">{plat}</span>
                          <span className="text-[10px] text-slate-400">
                            {plat === "YouTube" ? "A partir de 30 Kz" : "A partir de 25 Kz"}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Service Type Selection */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      2. Tipo de Engajamento
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "Seguidores", label: platform === "YouTube" ? "Inscritos" : "Seguidores", icon: UserPlus },
                        { id: "Gostos", label: "Gostos / Likes", icon: Heart },
                        { id: "Comentários", label: "Comentários", icon: MessageCircle },
                      ].map((srv) => {
                        const Icon = srv.icon;
                        const isSelected = serviceType === srv.id;
                        return (
                          <button
                            key={srv.id}
                            type="button"
                            onClick={() => setServiceType(srv.id as any)}
                            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                              isSelected
                                ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm"
                                : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                            }`}
                          >
                            <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                            <span className="text-xs font-bold">{srv.label}</span>
                            <span className="text-[10px] text-slate-400">
                              {getUnitPrice(platform, srv.id)} Kz/un
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Target Link */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      3. Link de Destino ({serviceType === "Seguidores" ? "Perfil" : "Publicação / Vídeo"})
                    </Label>
                    <Input
                      type="url"
                      placeholder={
                        serviceType === "Seguidores"
                          ? `https://www.${platform.toLowerCase()}.com/@seu_perfil`
                          : `https://www.${platform.toLowerCase()}.com/p/sua_publicacao`
                      }
                      value={targetLink}
                      onChange={(e) => setTargetLink(e.target.value)}
                      className="rounded-xl border-slate-200 h-11 text-sm"
                      required
                    />
                    <p className="text-[11px] text-slate-400">
                      Certifique-se de que o seu perfil ou postagem está em modo público.
                    </p>
                  </div>

                  {/* Quantity & Presets */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                        4. Quantidade Desejada
                      </Label>
                      <span className="text-xs font-semibold text-emerald-600 font-mono">
                        {quantity.toLocaleString()} interações
                      </span>
                    </div>

                    <Input
                      type="number"
                      min={10}
                      step={10}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                      className="rounded-xl border-slate-200 h-11 text-base font-bold font-mono"
                      required
                    />

                    <div className="flex flex-wrap gap-2 pt-1">
                      {quantityPresets.map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setQuantity(preset)}
                          className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                            quantity === preset
                              ? "bg-slate-900 text-white border-slate-900"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-transparent"
                          }`}
                        >
                          +{preset.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      5. Método de Pagamento
                    </Label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "MULTICAIXA", label: "Multicaixa Express" },
                        { id: "IBAN", label: "Transferência IBAN" },
                        { id: "UNITEL", label: "Unitel Money" },
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setMethod(m.id as any)}
                          className={`p-3 rounded-2xl border text-center transition-all ${
                            method === m.id
                              ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 font-bold"
                              : "border-slate-200 text-slate-600 font-medium bg-white"
                          }`}
                        >
                          <span className="text-xs">{m.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Upload Receipt */}
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      6. Comprovativo de Pagamento
                    </Label>
                    <div
                      onClick={() => document.getElementById("engagement-file-upload")?.click()}
                      className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                        file
                          ? "border-emerald-500 bg-emerald-50/40"
                          : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
                      }`}
                    >
                      <input
                        id="engagement-file-upload"
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setFile(e.target.files[0]);
                          }
                        }}
                      />
                      {file ? (
                        <div className="flex flex-col items-center gap-1 text-emerald-700">
                          <FileCheck className="w-8 h-8 text-emerald-600" />
                          <p className="text-xs font-bold">{file.name}</p>
                          <p className="text-[10px] text-slate-500">
                            {(file.size / 1024).toFixed(1)} KB • Clique para substituir
                          </p>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-slate-500">
                          <Upload className="w-8 h-8 text-slate-400" />
                          <p className="text-xs font-bold text-slate-700">
                            Clique para anexar o comprovativo
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Imagens PNG, JPG ou PDF (Máx. 5MB)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Summary & Submit */}
                  <div className="pt-2 border-t border-slate-100 space-y-4">
                    <div className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between border border-slate-200/60">
                      <div>
                        <span className="text-xs text-slate-500 block font-medium">Valor Total a Pagar</span>
                        <span className="text-xs text-slate-400">
                          {quantity.toLocaleString()} un × {unitPrice} Kz
                        </span>
                      </div>
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {totalPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}{" "}
                        <span className="text-sm font-normal text-slate-500">Kz</span>
                      </span>
                    </div>

                    <Button
                      type="submit"
                      disabled={submitting || !file}
                      className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processando Pedido...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Confirmar e Enviar Pedido
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Payment Details & Instructions */}
          <div className="md:col-span-4 space-y-4">
            <Card className="rounded-3xl border-slate-200/80 shadow-md bg-white">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black text-slate-900 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  Instruções de Pagamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Multicaixa Express:</span>
                    <button
                      onClick={() => copyToClipboard("924555888", "Número Express")}
                      className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold"
                    >
                      <Copy className="w-3 h-3" /> 924 555 888
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Unitel Money:</span>
                    <button
                      onClick={() => copyToClipboard("924555888", "Unitel Money")}
                      className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold"
                    >
                      <Copy className="w-3 h-3" /> 924 555 888
                    </button>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-medium block mb-1">IBAN BAI / BFA:</span>
                    <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                      <span className="font-mono text-[10px] text-slate-800 break-all select-all font-semibold">
                        AO06 0040 0000 8976 5432 1014 9
                      </span>
                      <button
                        onClick={() => copyToClipboard("AO06004000008976543210149", "IBAN")}
                        className="text-slate-500 hover:text-slate-800 p-1"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Titular: <strong>ADX Money Digital Services Lda</strong>
                  </p>
                </div>

                <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 space-y-1.5 text-amber-800">
                  <div className="flex items-center gap-1.5 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span>Como funciona a ativação?</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-700">
                    Após confirmação do pagamento pelos administradores, o pedido é distribuído diretamente aos usuários da plataforma cadastrados como tarefas ativas.
                  </p>
                </div>

                <div className="border border-slate-100 rounded-2xl p-3 flex items-center gap-2 text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span className="text-[11px]">Garantia de entrega e visualizações 100% orgânicas.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* TAB 2: HISTÓRICO DE PEDIDOS */}
      {activeTab === "history" && (
        <Card className="rounded-3xl border-slate-200/80 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" />
                Histórico de Pedidos de Engajamento
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Acompanhe o status e a entrega dos seus pedidos solicitados
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOrders}
              disabled={loadingHistory}
              className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 h-9"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingHistory ? "animate-spin" : ""}`} />
              Atualizar
            </Button>
          </CardHeader>

          <CardContent>
            {loadingHistory ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
                <span className="text-xs font-semibold">Carregando pedidos...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400 gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-700">Nenhum pedido realizado</p>
                  <p className="text-xs text-slate-400">
                    Você ainda não comprou engajamento. Crie seu primeiro pedido na aba "Comprar".
                  </p>
                </div>
                <Button
                  onClick={() => setActiveTab("buy")}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold mt-2"
                >
                  Criar Pedido Agora
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:bg-slate-50/50 rounded-2xl px-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getStatusBadge(order.status)}
                        <Badge variant="outline" className="text-xs font-bold rounded-lg border-slate-200">
                          {order.platform}
                        </Badge>
                        <Badge variant="secondary" className="text-xs font-bold rounded-lg bg-slate-100">
                          {order.service_type}
                        </Badge>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {new Date(order.created_at).toLocaleDateString("pt-AO", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-medium">Destino:</span>
                        <a
                          href={order.target_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1 font-semibold max-w-[280px] md:max-w-md truncate"
                        >
                          {order.target_link}
                          <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        </a>
                      </div>

                      {order.rejection_reason && (
                        <p className="text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100 font-medium">
                          Motivo da rejeição: {order.rejection_reason}
                        </p>
                      )}
                    </div>

                    <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                      <span className="text-base font-black text-slate-900 font-mono">
                        {order.total_price.toLocaleString("pt-AO", { minimumFractionDigits: 2 })}{" "}
                        <span className="text-xs text-slate-400 font-normal">Kz</span>
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {order.quantity.toLocaleString()} interações • {order.method}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EngagementComponent;