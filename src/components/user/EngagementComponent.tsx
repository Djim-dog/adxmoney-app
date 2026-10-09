import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  PlusCircle,
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
  ArrowRight,
  ArrowLeft,
  Check,
  Hash,
  HelpCircle
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
  
  // Principal Mode: "menu" | "solicitar" | "consultar"
  const [mode, setMode] = useState<"menu" | "solicitar" | "consultar">("menu");

  // --- FLUXO DE SOLICITAÇÃO (4 ETAPAS) ---
  // Etapa 1: Pedido (Plataforma, Serviço, Link, Quantidade)
  // Etapa 2: Confirmação (Resumo dos valores, regras)
  // Etapa 3: Pagamento (Método, Dados bancários, Upload de Comprovativo)
  // Etapa 4: Finalização (Código gerado, sucesso)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [platform, setPlatform] = useState<"TikTok" | "Instagram" | "YouTube">("TikTok");
  const [serviceType, setServiceType] = useState<"Seguidores" | "Gostos" | "Comentários">("Seguidores");
  const [targetLink, setTargetLink] = useState("");
  const [quantity, setQuantity] = useState<number>(100);
  
  const [method, setMethod] = useState<"MULTICAIXA" | "UNITEL" | "IBAN">("MULTICAIXA");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string>("");

  // --- FLUXO DE CONSULTA ---
  const [searchCode, setSearchCode] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<EngagementOrder | null>(null);
  const [searching, setSearching] = useState(false);
  const [userOrders, setUserOrders] = useState<EngagementOrder[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Tabela de preços interna oficial
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

  const fetchUserOrders = async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      const { data, error } = await supabase
        .from("engagement_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUserOrders((data as EngagementOrder[]) || []);
    } catch (err: any) {
      console.error("Erro ao carregar pedidos:", err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserOrders();
    }
  }, [user]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado com sucesso!`);
  };

  const handleSearchOrder = async (codeToSearch?: string) => {
    const code = codeToSearch || searchCode;
    if (!code.trim()) {
      toast.error("Informe o código do pedido (ou ID) para consultar.");
      return;
    }

    setSearching(true);
    setSearchedOrder(null);
    try {
      const cleanCode = code.trim();
      // Buscar por ID exato ou prefixo
      const { data, error } = await supabase
        .from("engagement_orders")
        .select("*")
        .ilike("id", `%${cleanCode}%`)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setSearchedOrder(data[0] as EngagementOrder);
        toast.success("Pedido encontrado com sucesso!");
      } else {
        toast.error("Nenhum pedido encontrado com este código.");
      }
    } catch (err: any) {
      console.error("Erro na consulta:", err);
      toast.error("Erro ao buscar pedido.");
    } finally {
      setSearching(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Usuário não autenticado.");
      return;
    }
    if (!file) {
      toast.error("Anexe o comprovativo de pagamento para finalizar.");
      return;
    }

    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/eng_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("subscription-proofs")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Falha no upload do comprovativo: ${uploadError.message}`);
      }

      // Inserir pedido diretamente
      const { data, error: insertError } = await supabase
        .from("engagement_orders")
        .insert({
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
        })
        .select("id")
        .single();

      if (insertError) throw insertError;

      const generatedId = data?.id || "";
      const shortCode = generatedId.substring(0, 8).toUpperCase();
      setCreatedOrderCode(shortCode);

      toast.success("Pedido de engajamento submetido com sucesso!");
      setStep(4); // Ir para etapa de finalização
      fetchUserOrders();
    } catch (err: any) {
      console.error("Erro ao submeter pedido:", err);
      toast.error(err.message || "Erro ao processar o pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Aprovado / Concluído
          </Badge>
        );
      case "REJECTED":
        return (
          <Badge className="bg-rose-500/15 text-rose-700 border-rose-200 flex items-center gap-1 font-bold">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            Rejeitado
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 flex items-center gap-1 font-bold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Pendente de Análise
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
              Central de Impulsionamento Social
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white mt-1">
              Engajamento & Crescimento
            </h1>
            <p className="text-sm text-slate-300">
              Gerencie seus pedidos de seguidores, curtidas e consulte o andamento por código em tempo real.
            </p>
          </div>

          {mode !== "menu" && (
            <Button
              onClick={() => {
                setMode("menu");
                setStep(1);
                setSearchedOrder(null);
                setSearchCode("");
              }}
              variant="outline"
              className="bg-slate-800/80 border-slate-700 text-white hover:bg-slate-700 text-xs font-bold rounded-xl"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" /> Voltar ao Menu
            </Button>
          )}
        </div>
      </div>

      {/* TELA INICIAL: MENU COM 2 BOTÕES PRINCIPAIS (SOLICITAR / CONSULTAR) */}
      {mode === "menu" && (
        <div className="grid md:grid-cols-2 gap-6">
          {/* Botão SOLICITAR */}
          <Card 
            onClick={() => {
              setMode("solicitar");
              setStep(1);
            }}
            className="rounded-[28px] border-slate-200/80 shadow-xl shadow-slate-100 hover:border-emerald-500 hover:shadow-2xl transition-all cursor-pointer group bg-white p-8 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-50 rounded-bl-full transition-all group-hover:scale-110 pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-200 group-hover:scale-105 transition-all">
                <PlusCircle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                  Solicitar Engajamento
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Inicie um novo pedido de seguidores, curtidas ou comentários para o TikTok, Instagram ou YouTube em 4 etapas guiadas.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-emerald-600">
                <span>Criar Novo Pedido</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Card>

          {/* Botão CONSULTAR */}
          <Card 
            onClick={() => setMode("consultar")}
            className="rounded-[28px] border-slate-200/80 shadow-xl shadow-slate-100 hover:border-indigo-500 hover:shadow-2xl transition-all cursor-pointer group bg-white p-8 relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-indigo-50 rounded-bl-full transition-all group-hover:scale-110 pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 group-hover:scale-105 transition-all">
                <Search className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                  Consultar por Código
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Digite o código único gerado na compra para verificar o status em tempo real da entrega e o histórico de execuções.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 text-xs font-bold text-indigo-600">
                <span>Consultar Pedido</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* FLUXO DE SOLICITAÇÃO (ETAPAS 1 A 4) */}
      {mode === "solicitar" && (
        <Card className="rounded-[28px] border-slate-200/80 shadow-xl bg-white">
          <CardHeader className="border-b border-slate-100 pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-black text-slate-900">
                  Nova Solicitação de Engajamento
                </CardTitle>
                <CardDescription className="text-xs text-slate-500 mt-0.5">
                  Etapa {step} de 4: {
                    step === 1 ? "Dados do Pedido" :
                    step === 2 ? "Confirmação e Valores" :
                    step === 3 ? "Pagamento e Comprovativo" : "Finalização"
                  }
                </CardDescription>
              </div>

              {/* Steps Progress Indicator */}
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`w-8 h-2 rounded-full transition-all ${
                      step >= s ? "bg-emerald-600" : "bg-slate-200"
                    }`}
                  />
                ))}
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* ETAPA 1: PEDIDO */}
            {step === 1 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                {/* Plataforma */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Selecione a Plataforma
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(["TikTok", "Instagram", "YouTube"] as const).map((plat) => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setPlatform(plat)}
                        className={`p-4 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          platform === plat
                            ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm font-bold"
                            : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                        }`}
                      >
                        <span className="text-sm">{plat}</span>
                        <span className="text-[10px] text-slate-400">
                          {plat === "YouTube" ? "A partir de 30 Kz" : "A partir de 25 Kz"}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Serviço */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Tipo de Serviço
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
                          className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                            isSelected
                              ? "border-emerald-600 bg-emerald-50/70 text-emerald-900 shadow-sm font-bold"
                              : "border-slate-200 hover:border-slate-300 text-slate-600 bg-white"
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${isSelected ? "text-emerald-600" : "text-slate-400"}`} />
                          <span className="text-xs">{srv.label}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {getUnitPrice(platform, srv.id)} Kz / un
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Link de Destino */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Link de Destino ({serviceType === "Seguidores" ? "Perfil" : "Publicação / Vídeo"})
                  </Label>
                  <Input
                    type="url"
                    placeholder={`https://www.${platform.toLowerCase()}.com/...`}
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    className="rounded-xl border-slate-200 h-11 text-sm"
                    required
                  />
                </div>

                {/* Quantidade */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                      Quantidade
                    </Label>
                    <span className="text-xs font-bold text-emerald-600 font-mono">
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
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {[100, 250, 500, 1000, 2000].map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setQuantity(p)}
                        className={`text-xs px-3 py-1.5 rounded-lg border font-bold transition-all ${
                          quantity === p
                            ? "bg-slate-900 text-white border-slate-900"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-transparent"
                        }`}
                      >
                        +{p.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <Button
                    onClick={() => {
                      if (!targetLink.trim()) {
                        toast.error("Informe o link de destino.");
                        return;
                      }
                      if (quantity < 10) {
                        toast.error("A quantidade mínima é 10.");
                        return;
                      }
                      setStep(2);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 text-xs gap-2"
                  >
                    Avançar para Confirmação <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 2: CONFIRMAÇÃO */}
            {step === 2 && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                  <h4 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                    Resumo do Pedido
                  </h4>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-medium">Plataforma</span>
                      <span className="font-bold text-slate-900 text-sm">{platform}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Serviço</span>
                      <span className="font-bold text-slate-900 text-sm">{serviceType}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block font-medium">Link de Destino</span>
                      <span className="font-bold text-emerald-600 break-all">{targetLink}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Quantidade</span>
                      <span className="font-bold text-slate-900 font-mono">{quantity.toLocaleString()} un</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-medium">Preço Unitário</span>
                      <span className="font-bold text-slate-900 font-mono">{unitPrice} Kz</span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-700">Total a Pagar:</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">
                      {totalPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2 })} <span className="text-sm font-normal text-slate-500">Kz</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="border-slate-200 text-slate-600 rounded-xl h-11 px-6 text-xs font-bold gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 text-xs gap-2"
                  >
                    Avançar para Pagamento <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 3: PAGAMENTO */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Método de Pagamento
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
                        className={`p-3.5 rounded-2xl border text-center transition-all ${
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

                {/* Dados de Transferência */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Multicaixa / Unitel Express:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("924555888", "Número")}
                      className="text-emerald-600 font-bold flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" /> 924 555 888
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">IBAN BAI / BFA:</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard("AO06004000008976543210149", "IBAN")}
                      className="text-emerald-600 font-bold flex items-center gap-1 font-mono text-[11px]"
                    >
                      <Copy className="w-3 h-3" /> AO06 0040 0000 8976 5432 1014 9
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 pt-1">
                    Titular: <strong>ADX Money Digital Services Lda</strong> • Valor Exato: <strong className="text-slate-800">{totalPrice.toLocaleString("pt-AO")} Kz</strong>
                  </p>
                </div>

                {/* Upload Comprovativo */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                    Anexar Comprovativo de Pagamento *
                  </Label>
                  <div
                    onClick={() => document.getElementById("wizard-file-upload")?.click()}
                    className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                      file ? "border-emerald-500 bg-emerald-50/40" : "border-slate-300 hover:border-slate-400 bg-slate-50/60"
                    }`}
                  >
                    <input
                      id="wizard-file-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => e.target.files && setFile(e.target.files[0])}
                    />
                    {file ? (
                      <div className="flex flex-col items-center gap-1 text-emerald-700">
                        <FileCheck className="w-7 h-7 text-emerald-600" />
                        <p className="text-xs font-bold">{file.name}</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-slate-500">
                        <Upload className="w-7 h-7 text-slate-400" />
                        <p className="text-xs font-bold text-slate-700">Clique para carregar o comprovativo</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="border-slate-200 text-slate-600 rounded-xl h-11 px-6 text-xs font-bold gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" /> Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting || !file}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl h-11 px-6 text-xs gap-2"
                  >
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Finalizar e Submeter Pedido
                  </Button>
                </div>
              </form>
            )}

            {/* ETAPA 4: FINALIZAÇÃO (CÓDIGO GERADO) */}
            {step === 4 && (
              <div className="space-y-6 text-center py-6 animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900">Pedido Submetido com Sucesso!</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Seu pedido de engajamento foi enviado para análise administrativa. Guarde o seu código de rastreio para consultas futuras.
                  </p>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 max-w-sm mx-auto space-y-2">
                  <span className="text-[11px] text-slate-400 uppercase tracking-widest font-bold">Código do Pedido</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-3xl font-black text-slate-900 font-mono tracking-wider">{createdOrderCode}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdOrderCode, "Código do Pedido")}
                      className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600 shadow-sm"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-4 flex justify-center gap-3">
                  <Button
                    onClick={() => {
                      setMode("consultar");
                      setSearchCode(createdOrderCode);
                      handleSearchOrder(createdOrderCode);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-11 px-6 text-xs gap-2"
                  >
                    <Search className="w-4 h-4" /> Consultar Este Pedido Agora
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setMode("menu");
                      setStep(1);
                      setTargetLink("");
                      setFile(null);
                    }}
                    className="border-slate-200 text-slate-700 rounded-xl h-11 px-6 text-xs font-bold"
                  >
                    Voltar ao Menu
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* FLUXO DE CONSULTA POR CÓDIGO */}
      {mode === "consultar" && (
        <div className="space-y-6">
          <Card className="rounded-[28px] border-slate-200/80 shadow-xl bg-white p-6">
            <CardHeader className="px-0 pt-0 pb-4">
              <CardTitle className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Search className="w-5 h-5 text-indigo-600" />
                Consulta de Pedido por Código
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Digite o código do pedido (ex: B4C291FA) para verificar o status e detalhes.
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 space-y-4">
              <div className="flex gap-3">
                <Input
                  placeholder="Digite o código (ex: A1B2C3D4)..."
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value)}
                  className="rounded-xl border-slate-200 h-12 text-sm font-mono uppercase"
                />
                <Button
                  onClick={() => handleSearchOrder()}
                  disabled={searching}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold h-12 px-6 rounded-xl text-xs gap-2 flex-shrink-0"
                >
                  {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Consultar
                </Button>
              </div>

              {searchedOrder && (
                <Card className="rounded-2xl border border-indigo-100 bg-indigo-50/40 p-6 mt-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Hash className="w-4 h-4 text-indigo-600" />
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ID: {searchedOrder.id.substring(0, 8).toUpperCase()}
                      </span>
                    </div>
                    {getStatusBadge(searchedOrder.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs bg-white p-4 rounded-xl border border-indigo-100/60">
                    <div>
                      <span className="text-slate-400 block font-semibold">Plataforma</span>
                      <span className="font-bold text-slate-900">{searchedOrder.platform}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Serviço</span>
                      <span className="font-bold text-slate-900">{searchedOrder.service_type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Quantidade</span>
                      <span className="font-mono font-bold text-slate-900">{searchedOrder.quantity?.toLocaleString()} un</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold">Valor Total</span>
                      <span className="font-mono font-bold text-slate-900">{searchedOrder.total_price?.toLocaleString("pt-AO")} Kz</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-500 font-semibold">Link de Destino:</span>
                    <a
                      href={searchedOrder.target_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-indigo-600 font-semibold truncate hover:underline flex items-center gap-1"
                    >
                      {searchedOrder.target_link}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {searchedOrder.rejection_reason && (
                    <p className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl border border-rose-100 font-medium">
                      Motivo da rejeição: {searchedOrder.rejection_reason}
                    </p>
                  )}
                </Card>
              )}
            </CardContent>
          </Card>

          {/* Histórico completo do usuário para consulta rápida */}
          <Card className="rounded-[28px] border-slate-200/80 shadow-xl bg-white p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Seus Pedidos Recentes</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUserOrders}
                disabled={loadingList}
                className="rounded-xl border-slate-200 text-xs font-bold gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
                Atualizar
              </Button>
            </div>

            <div className="divide-y divide-slate-100 pt-2">
              {userOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum pedido registrado.</p>
              ) : (
                userOrders.map((order) => (
                  <div key={order.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-lg">
                          #{order.id.substring(0, 8).toUpperCase()}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <p className="text-xs text-slate-500">
                        {order.platform} • {order.service_type} ({order.quantity} un)
                      </p>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSearchCode(order.id.substring(0, 8).toUpperCase());
                        setSearchedOrder(order);
                      }}
                      className="rounded-xl border-slate-200 text-xs font-bold"
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EngagementComponent;
