import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { ServiceProviderProfile } from "../../types";
import {
  Loader2,
  CheckCircle2,
  Zap,
  Settings,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Crown,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../../firebase/subscriptionService";

// UI
import { Button } from "../ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardFooter,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils/cn";

const PLANOS = {
  MENSAL: "price_1SMeWT3zDQy3p6yeWl0LC4wi",
  TRIMESTRAL: "price_1SMeWT3zDQy3p6yezkMmrByP",
  ANUAL: "price_1SO7sB3zDQy3p6yevNXLXO8v",
};

// Detalhes dos Planos
const PLAN_DETAILS = {
  [PLANOS.MENSAL]: {
    name: "Mensal",
    monthlyPrice: "R$ 49,90",
    totalPrice: null,
    billingText: "Cobrado todo mês",
    label: "Flexível",
  },
  [PLANOS.TRIMESTRAL]: {
    name: "Trimestral",
    monthlyPrice: "R$ 45,00",
    totalPrice: "R$ 135,00",
    billingText: "Cobrado a cada 3 meses",
    label: "Popular",
  },
  [PLANOS.ANUAL]: {
    name: "Anual",
    monthlyPrice: "R$ 39,00",
    totalPrice: "R$ 468,00",
    billingText: "Cobrado anualmente",
    label: "Econômico",
  },
};

const PlanCard = ({
  priceId,
  onCheckout,
  loadingPlan,
  isCurrentPlan,
}: {
  priceId: string;
  onCheckout: (id: string) => void;
  loadingPlan: string | null;
  isCurrentPlan?: boolean;
}) => {
  const details = PLAN_DETAILS[priceId as keyof typeof PLANOS];
  const isPopular = priceId === PLANOS.TRIMESTRAL;

  return (
    <Card
      className={cn(
        "relative transition-all duration-300 flex flex-col h-full overflow-hidden border",
        isPopular
          ? "border-amber-500/50 bg-gray-900 shadow-xl shadow-amber-900/10 hover:shadow-amber-900/20 hover:-translate-y-1"
          : "border-white/10 bg-zinc-900/50 hover:bg-zinc-900 hover:border-white/20 hover:-translate-y-1",
        isCurrentPlan && "ring-2 ring-primary ring-offset-2 ring-offset-background"
      )}
    >
      {isPopular && (
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
      )}
      
      {isPopular && (
        <Badge className="absolute top-4 right-4 bg-amber-500 text-black hover:bg-amber-400 font-bold shadow-lg shadow-amber-500/20">
          Mais Escolhido
        </Badge>
      )}

      <CardHeader>
        <h3 className={cn("text-lg font-medium", isPopular ? "text-amber-400" : "text-gray-300")}>
          {details.name}
        </h3>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white tracking-tight">
              {details.monthlyPrice}
            </span>
            <span className="text-sm text-gray-500">/mês</span>
          </div>
          <span className="text-xs text-gray-500 mt-1 font-medium">
            {details.totalPrice
              ? `${details.totalPrice} ${details.billingText.toLowerCase()}`
              : details.billingText}
          </span>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 flex-1">
        <div className="space-y-3">
          {[
            "Agendamentos Ilimitados",
            "Gestão Financeira Completa",
            priceId !== PLANOS.MENSAL && "Relatórios Avançados de IA",
            priceId === PLANOS.ANUAL && "💎 2 Meses Grátis",
          ]
            .filter((f): f is string => !!f)
            .map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-3 text-sm text-gray-300"
              >
                <div className={cn(
                  "rounded-full p-1", 
                  isPopular ? "bg-amber-500/10 text-amber-500" : "bg-white/5 text-gray-400"
                )}>
                  <CheckCircle2 size={12} strokeWidth={3} />
                </div>
                {f}
              </div>
            ))}
        </div>
      </CardContent>

      <CardFooter className="pt-4 mt-auto border-t border-white/5 bg-black/20">
        <Button
          onClick={() => onCheckout(priceId)}
          disabled={!!loadingPlan || isCurrentPlan}
          className={cn(
            "w-full font-bold h-11 text-base transition-all",
            isPopular 
              ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-900/20" 
              : "bg-white/10 text-white hover:bg-white/20 hover:text-white border-0",
            isCurrentPlan && "bg-green-600/20 text-green-500 hover:bg-green-600/20 cursor-default"
          )}
        >
          {loadingPlan === priceId && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isCurrentPlan ? "Plano Atual" : "Escolher Plano"}
        </Button>
      </CardFooter>
    </Card>
  );
};

export const SubscriptionManagement = () => {
  const { userProfile } = useProfileStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  if (!userProfile)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );

  const profile = userProfile as ServiceProviderProfile;
  const status = profile.subscriptionStatus || "free";
  
  // Lógica de Status Inteligente
  const isTrial = status === "trial" || status === "trialing";
  const isLifetime = status === "lifetime";
  const isActive = status === "active" || isTrial || isLifetime;

  const handleCheckout = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      if (url) window.location.href = url;
    } catch {
      toast.error("Erro ao iniciar checkout.");
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setIsPortalLoading(true);
    try {
      const { url } = await createCustomerPortalSession();
      if (url) window.location.href = url;
    } catch {
      toast.error("Erro ao acessar portal de assinatura.");
      setIsPortalLoading(false);
    }
  };

  // Definição visual baseada no status
  const getStatusVisuals = () => {
    if (isLifetime) return {
      color: "amber",
      icon: Crown,
      bg: "bg-amber-500/10",
      border: "border-amber-500/30",
      text: "text-amber-500",
      label: "VITALÍCIO",
      desc: "Você possui acesso vitalício à plataforma."
    };
    if (isTrial) return {
      color: "indigo",
      icon: Sparkles,
      bg: "bg-indigo-500/10",
      border: "border-indigo-500/30",
      text: "text-indigo-400",
      label: "PERÍODO DE TESTES",
      desc: "Você está testando gratuitamente. Assine para manter o acesso."
    };
    if (isActive) return {
      color: "green",
      icon: ShieldCheck,
      bg: "bg-green-500/10",
      border: "border-green-500/30",
      text: "text-green-500",
      label: "ATIVA",
      desc: "Sua assinatura está em dia. Todos os recursos liberados."
    };
    return {
      color: "red",
      icon: AlertTriangle,
      bg: "bg-red-500/10",
      border: "border-red-500/30",
      text: "text-red-500",
      label: "INATIVA",
      desc: "Sua assinatura expirou. Renove para continuar usando."
    };
  };

  const visuals = getStatusVisuals();
  const StatusIcon = visuals.icon;

  return (
    <div className="space-y-8 pb-10 animate-fade-in">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-white/10 pb-6 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Assinatura</h2>
          <p className="text-zinc-400 mt-1">Gerencie seu plano, pagamentos e faturas.</p>
        </div>
        
        {/* Botão de Portal (Só aparece se NÃO for trial manual e NÃO for free) */}
        {!isTrial && status !== "free" && status !== "expired" && (
          <Button
            variant="outline"
            className="border-white/10 hover:bg-white/5 text-zinc-300"
            onClick={handlePortal}
            disabled={isPortalLoading}
          >
            {isPortalLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Settings className="mr-2 h-4 w-4" />
            )}{" "}
            Gerenciar Assinatura
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna Principal: Status e Planos */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* CARD DE STATUS */}
          <Card className={cn("border-l-4 bg-zinc-900/60 overflow-hidden", visuals.border, `border-l-${visuals.color}-500`)}>
            {/* Background Glow sutil baseado na cor do status */}
            <div className={cn("absolute inset-0 opacity-5 pointer-events-none", `bg-${visuals.color}-500`)} />
            
            <CardContent className="p-6 relative z-10 flex flex-col sm:flex-row items-start gap-5">
              <div className={cn("p-3 rounded-xl shrink-0 ring-1 ring-inset", visuals.bg, visuals.text, `ring-${visuals.color}-500/20`)}>
                <StatusIcon size={32} strokeWidth={1.5} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h3 className="text-lg font-bold text-white">Status da Conta</h3>
                  <Badge variant="outline" className={cn("font-bold border-0", visuals.bg, visuals.text)}>
                    {visuals.label}
                  </Badge>
                </div>
                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                  {visuals.desc}
                </p>

                {isActive && !isTrial && !isLifetime && (
                  <div className="flex flex-wrap gap-3">
                    <Button size="sm" variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10" onClick={handlePortal}>
                      Alterar Cartão
                    </Button>
                    <Button size="sm" variant="secondary" className="bg-white/5 hover:bg-white/10 text-zinc-300 border border-white/10" onClick={handlePortal}>
                      Histórico de Faturas
                    </Button>
                  </div>
                )}
                
                {isTrial && (
                   <p className="text-xs text-indigo-400/80 mt-2">
                     * Ao assinar um plano, a cobrança iniciará imediatamente e seu período de teste será convertido em assinatura.
                   </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* LISTA DE PLANOS */}
          <div>
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-amber-500/10 rounded-lg">
                <Zap className="text-amber-500" size={20} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Escolha seu Plano</h3>
                <p className="text-sm text-zinc-500">Desbloqueie todo o potencial do seu negócio.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 xl:gap-6">
              {Object.values(PLANOS).map((id) => (
                <PlanCard
                  key={id}
                  priceId={id}
                  onCheckout={handleCheckout}
                  loadingPlan={loadingPlan}
                  // isCurrentPlan logic can be added later if needed based on stripeSubscriptionId
                />
              ))}
            </div>
          </div>
        </div>

        {/* Coluna Lateral: Benefícios */}
        <div className="space-y-6">
          <Card className="bg-gradient-to-b from-zinc-900 to-black border-white/10 sticky top-6">
            <CardHeader className="pb-4 border-b border-white/5">
              <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-zinc-400">
                <Crown size={16} className="text-primary" />
                Benefícios Premium
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              {[
                { title: "Agenda Online 24/7", desc: "Seus clientes agendam enquanto você dorme." },
                { title: "Lembretes Automáticos", desc: "Reduza faltas com avisos via WhatsApp/Email." },
                { title: "Controle Financeiro", desc: "Saiba exatamente quanto você lucrou no mês." },
                { title: "Link Personalizado", desc: "Sua página exclusiva (ex: stylo.com/barber)." },
                { title: "Gestão de Equipe", desc: "Adicione profissionais e controle comissões." },
              ].map((item, i) => (
                <div key={i} className="flex gap-3 group">
                  <div className="mt-0.5">
                    <CheckCircle2
                      size={18}
                      className={cn(
                        "transition-colors duration-300",
                        isActive ? "text-green-500" : "text-zinc-600 group-hover:text-primary"
                      )}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{item.title}</p>
                    <p className="text-xs text-zinc-500 leading-snug mt-0.5">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
            {/* Footer motivacional */}
            {!isActive && (
               <CardFooter className="bg-amber-500/5 border-t border-amber-500/10 p-4">
                 <p className="text-xs text-amber-200/80 text-center w-full italic">
                   "Profissionais que usam agendamento online faturam em média 30% a mais."
                 </p>
               </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};