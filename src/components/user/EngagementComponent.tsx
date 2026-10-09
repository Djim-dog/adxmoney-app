import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  PlusCircle,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShoppingBag,
  Coins
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { CampaignRequestModal } from "./CampaignRequestModal";
import { Megaphone } from "lucide-react";

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

export const LoComponent: React.FC = () => {
  const { user } = useAuth();
  
  // Principal Mode: "menu" | "solicitar" | "consultar"
  const [mode, setMode] = useState<"menu" | "solicitar" | "consultar">("menu");

  // Wizard Steps (1: Moeda + Pedido + Cálculo, 2: Confirmação, 3: Pagamento, 4: Finalização)
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  const [currency, setCurrency] = useState<"USD" | "AOA" | "EUR" | "BRL">("USD");
  const [platform, setPlatform] = useState<"TikTok" | "Instagram" | "YouTube">("TikTok");
  const [serviceType, setServiceType] = useState<"Seguidores" | "Gostos" | "Comentários">("Seguidores");
  const [targetLink, setTargetLink] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  
  const [method, setMethod] = useState<"MULTICAIXA" | "UNITEL" | "IBAN">("MULTICAIXA");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [createdOrderCode, setCreatedOrderCode] = useState<string>("");

  // Consulta State
  const [searchCode, setSearchCode] = useState("");
  const [searchedOrder, setSearchedOrder] = useState<EngagementOrder | null>(null);
  const [searching, setSearching] = useState(false);
  const [userOrders, setUserOrders] = useState<EngagementOrder[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // Modal para Solicitar Campanha Coletiva (10 USD)
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);

  // Taxas de câmbio de referência (Base USD)
  // 1 USD = 920 AOA (exemplo padrão do app) | 1 USD = 0.92 EUR | 1 USD = 5.00 BRL
  const exchangeRates = {
    USD: 1.00,
    AOA: 920.00,
    EUR: 0.92,
    BRL: 5.00,
  };

  // Preço unitário base em USD (Ex: Seguidores TikTok = $0.03, Likes = $0.025, etc.)
  const getUnitUSD = (plat: string, srv: string): number => {
    if (plat === "TikTok" || plat === "Instagram") {
      if (srv === "Seguidores") return 0.0315; // ~29 AOA
      return 0.027; // ~25 AOA
    }
    if (plat === "YouTube") {
      if (srv === "Seguidores") return 0.038; // ~35 AOA
      return 0.032; // ~30 AOA
    }
    return 0.0315;
  };

  const unitUSD = getUnitUSD(platform, serviceType);
  const unitPriceInSelectedCurrency = unitUSD * exchangeRates[currency];
  const safeQuantity = Math.max(0, quantity || 0);
  const totalPrice = unitPriceInSelectedCurrency * safeQuantity;

  const fetchUserOrders = async () => {
    if (!user) return;
    setLoadingList(true);
    try {
      const { data } = await supabase
        .from("engagement_orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setUserOrders((data as EngagementOrder[]) || []);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (user) fetchUserOrders();
  }, [user]);

  const handleSearchOrder = async (codeToSearch?: string) => {
    const code = codeToSearch || searchCode;
    if (!code.trim()) {
      toast.error("Insira o código do pedido.");
      return;
    }
    setSearching(true);
    setSearchedOrder(null);
    try {
      const { data } = await supabase
        .from("engagement_orders")
        .select("*")
        .ilike("id", `%${code.trim()}%`)
        .limit(1);

      if (data && data.length > 0) {
        setSearchedOrder(data[0] as EngagementOrder);
        toast.success("Pedido localizado!");
      } else {
        toast.error("Pedido não encontrado.");
      }
    } finally {
      setSearching(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !file) return;
    if (safeQuantity <= 0) {
      toast.error("Informe uma quantidade válida.");
      return;
    }
    setSubmitting(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/eng_${Date.now()}.${fileExt}`;

      await supabase.storage.from("subscription-proofs").upload(fileName, file, { upsert: true });

      const { data, error } = await supabase
        .from("engagement_orders")
        .insert({
          user_id: user.id,
          platform,
          service_type: serviceType,
          target_link: targetLink.trim(),
          quantity: safeQuantity,
          total_price: totalPrice,
          currency,
          method,
          proof_url: fileName,
          status: "PENDING",
        })
        .select("id")
        .single();

      if (error) throw error;
      const shortCode = (data?.id || "").substring(0, 8).toUpperCase();
      setCreatedOrderCode(shortCode);
      toast.success("Pedido submetido com sucesso!");
      setStep(4);
      fetchUserOrders();
    } catch (err: any) {
      toast.error(err.message || "Erro ao submeter pedido.");
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "APPROVED":
        return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 text-[10px]">Aprovado</Badge>;
      case "REJECTED":
        return <Badge className="bg-rose-500/15 text-rose-700 border-rose-200 text-[10px]">Rejeitado</Badge>;
      default:
        return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-[10px]">Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-4 pb-24 max-w-lg mx-auto px-4">
      {/* Top Bar / Header minimalista mobile */}
      <div className="flex items-center justify-between pt-2">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-200">
            <ShoppingBag className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 tracking-tight">Loja</h2>
            <p className="text-[10px] text-slate-400">Impulsione suas redes e solicite campanhas</p>
          </div>
        </div>

        {mode !== "menu" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setMode("menu");
              setStep(1);
              setSearchedOrder(null);
            }}
            className="h-8 text-xs text-slate-600 font-bold"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Voltar
          </Button>
        )}
      </div>

      {/* TELA INICIAL: 2 BOTÕES AO LADO DO OUTRO */}
      {/* TELA INICIAL: 2 BOTÕES AO LADO DO OUTRO + CARD DE CAMPANHA COLETIVA */}
      {mode === "menu" && (
        <div className="space-y-4 pt-2">
          {/* Card em destaque para Solicitar Campanha Coletiva (10 USD) */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden flex items-center justify-between gap-4">
            <div className="space-y-1 z-10">
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-emerald-100">
                <Megaphone className="w-3 h-3 text-white" />
                Campanha Coletiva
              </div>
              <h3 className="text-sm font-black text-white">Solicitar Campanha (10 USD)</h3>
              <p className="text-[11px] text-emerald-100/90 leading-tight max-w-[240px]">
                Formulário em etapas com estimativas e validação prévia da administração.
              </p>
            </div>
            <Button
              type="button"
              onClick={() => setIsCampaignModalOpen(true)}
              className="z-10 bg-white hover:bg-slate-50 text-emerald-800 font-black text-xs h-10 px-4 rounded-xl shadow-md shrink-0 uppercase tracking-wider"
            >
              Criar
            </Button>
            <Megaphone className="absolute -right-4 -bottom-4 w-28 h-28 text-white/10 pointer-events-none rotate-12" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setMode("solicitar");
                setStep(1);
              }}
              className="bg-white border border-slate-200/80 p-5 rounded-2xl text-left shadow-sm hover:border-emerald-600 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-all">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Comprar Impulso</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Seguidores e Likes</p>
              </div>
            </button>

            <button
              onClick={() => setMode("consultar")}
              className="bg-white border border-slate-200/80 p-5 rounded-2xl text-left shadow-sm hover:border-indigo-600 hover:shadow-md transition-all flex flex-col justify-between gap-4 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all">
                <Search className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-slate-900">Consultar</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Rastrear por código</p>
              </div>
            </button>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Histórico Recente</span>
              <button onClick={fetchUserOrders} className="text-slate-400 hover:text-slate-700">
                <RefreshCw className={`w-3.5 h-3.5 ${loadingList ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {userOrders.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum pedido recente.</p>
              ) : (
                userOrders.slice(0, 3).map((o) => (
                  <div key={o.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-900">{o.platform} ({o.service_type})</span>
                      <span className="text-[10px] text-slate-400 block font-mono">#{o.id.substring(0, 6).toUpperCase()}</span>
                    </div>
                    {getStatusBadge(o.status)}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* WIZARD DE SOLICITAÇÃO */}
      {mode === "solicitar" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">
                Passo {step} de 4
              </span>
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={`w-6 h-1 rounded-full ${step >= s ? "bg-emerald-600" : "bg-slate-200"}`} />
                ))}
              </div>
            </div>

            {/* ETAPA 1: ESCOLHA DE MOEDA, REDE, SERVIÇO, QUANTIDADE E CÁLCULO PROFISSIONAL */}
            {step === 1 && (
              <div className="space-y-4">
                {/* Seleção de Moeda */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5 text-emerald-600" /> Moeda de Pagamento
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["USD", "AOA", "EUR", "BRL"] as const).map((curr) => (
                      <button
                        key={curr}
                        type="button"
                        onClick={() => setCurrency(curr)}
                        className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                          currency === curr ? "border-emerald-600 bg-emerald-50 text-emerald-900 shadow-sm" : "border-slate-200 text-slate-600 bg-white"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rede Social */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Rede Social</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["TikTok", "Instagram", "YouTube"] as const).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPlatform(p)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          platform === p ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Serviço */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Serviço</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "Seguidores", label: platform === "YouTube" ? "Inscritos" : "Seguidores" },
                      { id: "Gostos", label: "Curtidas" },
                      { id: "Comentários", label: "Comentários" },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setServiceType(s.id as any)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                          serviceType === s.id ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Link */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Link do Perfil ou Post</Label>
                  <Input
                    placeholder="https://..."
                    value={targetLink}
                    onChange={(e) => setTargetLink(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                {/* Quantidade (começa em 0) */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-bold uppercase text-slate-500">Quantidade</Label>
                  <Input
                    type="number"
                    min={0}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                    className="h-10 text-xs rounded-xl font-mono font-bold"
                  />
                </div>

                {/* CÁLCULO PROFISSIONAL EM TEMPO REAL */}
                <div className="bg-emerald-50/70 border border-emerald-200/80 p-3.5 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider block">Cálculo Automático ({currency})</span>
                    <span className="text-[11px] text-slate-500">
                      {safeQuantity} un × {unitPriceInSelectedCurrency.toFixed(2)} {currency}/un
                    </span>
                  </div>
                  <span className="text-lg font-black text-emerald-900 font-mono">
                    {totalPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                  </span>
                </div>

                <Button
                  onClick={() => {
                    if (!targetLink.trim()) {
                      toast.error("Insira o link.");
                      return;
                    }
                    if (safeQuantity < 10) {
                      toast.error("A quantidade mínima é 10.");
                      return;
                    }
                    setStep(2);
                  }}
                  className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs"
                >
                  Continuar <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            )}

            {/* ETAPA 2 */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Moeda:</span>
                    <span className="font-bold text-slate-900">{currency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Rede:</span>
                    <span className="font-bold text-slate-900">{platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Serviço:</span>
                    <span className="font-bold text-slate-900">{serviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Quantidade:</span>
                    <span className="font-bold font-mono">{safeQuantity}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-black">
                    <span>Total:</span>
                    <span className="font-mono text-emerald-600">
                      {totalPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-10 text-xs rounded-xl">
                    Voltar
                  </Button>
                  <Button onClick={() => setStep(3)} className="flex-1 h-10 bg-emerald-600 text-white font-bold rounded-xl text-xs">
                    Pagamento
                  </Button>
                </div>
              </div>
            )}

            {/* ETAPA 3 */}
            {step === 3 && (
              <form onSubmit={handleFinalSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "MULTICAIXA", label: "Express" },
                    { id: "IBAN", label: "IBAN" },
                    { id: "UNITEL", label: "Unitel" },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setMethod(m.id as any)}
                      className={`p-2.5 rounded-xl border text-xs font-bold ${
                        method === m.id ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200 text-slate-600"
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-600 space-y-1">
                  <p>Ref: <strong className="font-mono">924 555 888</strong> ({method})</p>
                  <p>Valor Exato: <strong className="font-mono">{totalPrice.toLocaleString("pt-AO", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {currency}</strong></p>
                </div>

                <div
                  onClick={() => document.getElementById("m-file")?.click()}
                  className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer text-xs text-slate-500"
                >
                  <input id="m-file" type="file" className="hidden" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                  {file ? <span className="text-emerald-600 font-bold">{file.name}</span> : <span>Anexar Comprovativo</span>}
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 h-10 text-xs rounded-xl">
                    Voltar
                  </Button>
                  <Button type="submit" disabled={submitting || !file} className="flex-1 h-10 bg-emerald-600 text-white font-bold rounded-xl text-xs">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Concluir"}
                  </Button>
                </div>
              </form>
            )}

            {/* ETAPA 4 */}
            {step === 4 && (
              <div className="text-center space-y-3 py-4">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-black text-slate-900">Pedido Enviado!</h3>
                <div className="bg-slate-50 p-3 rounded-xl inline-block font-mono font-bold text-base text-slate-800">
                  {createdOrderCode}
                </div>
                <Button onClick={() => setMode("menu")} className="w-full h-10 bg-slate-900 text-white rounded-xl text-xs font-bold">
                  Ir para Início
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* TELA DE CONSULTA */}
      {mode === "consultar" && (
        <Card className="rounded-2xl border-slate-200 shadow-sm bg-white">
          <CardContent className="p-5 space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Código (ex: A1B2C3D4)"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                className="h-10 text-xs rounded-xl font-mono uppercase"
              />
              <Button onClick={() => handleSearchOrder()} disabled={searching} className="h-10 px-4 bg-indigo-600 text-white rounded-xl text-xs font-bold">
                {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Buscar"}
              </Button>
            </div>

            {searchedOrder && (
              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-mono font-bold text-slate-800">#{searchedOrder.id.substring(0, 6).toUpperCase()}</span>
                  {getStatusBadge(searchedOrder.status)}
                </div>
                <p className="text-slate-600">{searchedOrder.platform} • {searchedOrder.service_type} ({searchedOrder.quantity} un)</p>
                {searchedOrder.rejection_reason && (
                  <p className="text-rose-600 text-[11px]">Motivo: {searchedOrder.rejection_reason}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Modal de Solicitação de Campanha Coletiva (10 USD) */}
      <CampaignRequestModal
        isOpen={isCampaignModalOpen}
        onClose={() => setIsCampaignModalOpen(false)}
        onSuccess={() => {
          toast.success("Solicitação enviada para a administração!");
        }}
        userId={user?.id || ""}
      />
    </div>
  );
};

export default LoComponent;
