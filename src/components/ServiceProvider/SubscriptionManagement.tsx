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

// Estrutura de dados atualizada para exibir valor mensal equivalente
const PLAN_DETAILS = {
  [PLANOS.MENSAL]: {
    name: "Mensal",
    monthlyPrice: "R$ 49,90",
    totalPrice: null, // Não tem cobrança total diferente
    billingText: "Cobrado todo mês",
    label: "Flexível",
  },
  [PLANOS.TRIMESTRAL]: {
    name: "Trimestral",
    monthlyPrice: "R$ 45,00", // 135 / 3
    totalPrice: "R$ 135,00",
    billingText: "Cobrado a cada 3 meses",
    label: "Popular",
  },
  [PLANOS.ANUAL]: {
    name: "Anual",
    monthlyPrice: "R$ 39,00", // 468 / 12
    totalPrice: "R$ 468,00",
    billingText: "Cobrado anualmente",
    label: "Econômico",
  },
};

const PlanCard = ({
  priceId,
  onCheckout,
  loadingPlan,
}: {
  priceId: string;
  onCheckout: (id: string) => void;
  loadingPlan: string | null;
}) => {
  const details = PLAN_DETAILS[priceId as keyof typeof PLANOS];
  const isPopular = priceId === PLANOS.TRIMESTRAL;

  return (
    <Card
      className={cn(
        // Adicionado h-full e flex flex-col para alinhar altura e empurrar o footer
        "relative transition-all duration-300 hover:-translate-y-1 flex flex-col h-full",
        isPopular
          ? "border-amber-500/50 bg-gray-900 shadow-xl shadow-amber-900/10"
          : "border-gray-800 bg-gray-900/50"
      )}
    >
      {isPopular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black hover:bg-amber-500">
          Mais Escolhido
        </Badge>
      )}
      <CardHeader>
        <h3 className="text-lg font-medium text-gray-300">{details.name}</h3>
        <div className="flex flex-col">
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold text-white">
              {details.monthlyPrice}
            </span>
            <span className="text-sm text-gray-500">/mês</span>
          </div>
          {/* Texto explicativo da cobrança real */}
          <span className="text-xs text-gray-500 mt-1">
            {details.totalPrice
              ? `${details.totalPrice} ${details.billingText.toLowerCase()}`
              : details.billingText}
          </span>
        </div>
      </CardHeader>

      {/* flex-1 aqui faz o conteúdo ocupar o espaço disponível, empurrando o footer para baixo */}
      <CardContent className="space-y-3 flex-1">
        {[
          "Agendamentos Ilimitados",
          "Gestão Financeira",
          priceId !== PLANOS.MENSAL && "Relatórios Avançados",
          priceId === PLANOS.ANUAL && "2 Meses Grátis", // Destaque extra pro anual
        ]
          .filter(Boolean)
          .map((f: any, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-sm text-gray-300"
            >
              <CheckCircle2 size={16} className="text-green-500 shrink-0" />{" "}
              {/* shrink-0 para o ícone não esmagar */}
              {f}
            </div>
          ))}
      </CardContent>
      <CardFooter>
        <Button
          onClick={() => onCheckout(priceId)}
          disabled={!!loadingPlan}
          className={cn(
            "w-full font-bold",
            isPopular ? "bg-amber-500 text-black hover:bg-amber-400" : ""
          )}
          variant={isPopular ? "default" : "secondary"}
        >
          {loadingPlan === priceId && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}{" "}
          Escolher Plano
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
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  const profile = userProfile as ServiceProviderProfile;
  const status = profile.subscriptionStatus || "free";
  const isActive = status === "active" || status === "trialing";

  const handleCheckout = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      if (url) window.location.href = url;
    } catch {
      toast.error("Erro no checkout.");
      setLoadingPlan(null);
    }
  };

  const handlePortal = async () => {
    setIsPortalLoading(true);
    try {
      const { url } = await createCustomerPortalSession();
      if (url) window.location.href = url;
    } catch {
      toast.error("Erro ao acessar portal.");
      setIsPortalLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex justify-between items-center border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white">Assinatura</h2>
          <p className="text-gray-400">Gerencie seu plano e pagamentos.</p>
        </div>
        {status !== "free" && (
          <Button
            variant="outline"
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
        <div className="lg:col-span-2 space-y-6">
          <Card
            className={cn(
              "border-l-4",
              isActive
                ? "border-l-green-500 bg-gray-900/60"
                : "border-l-red-500 bg-red-950/10"
            )}
          >
            <CardContent className="p-6 flex items-start gap-4">
              <div
                className={cn(
                  "p-3 rounded-lg",
                  isActive
                    ? "bg-green-500/10 text-green-500"
                    : "bg-red-500/10 text-red-500"
                )}
              >
                {isActive ? (
                  <ShieldCheck size={32} />
                ) : (
                  <AlertTriangle size={32} />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white mb-1">
                  Status: {isActive ? "ATIVA" : "INATIVA"}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {isActive
                    ? "Sua assinatura está em dia. Aproveite todos os recursos."
                    : "Renove sua assinatura para continuar usando a plataforma."}
                </p>
                {isActive && (
                  <div className="flex gap-3">
                    <Button size="sm" variant="outline" onClick={handlePortal}>
                      Alterar Cartão
                    </Button>
                    <Button size="sm" variant="outline" onClick={handlePortal}>
                      Ver Faturas
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-amber-500" size={20} />
              <h3 className="text-lg font-bold text-white">
                Planos Disponíveis
              </h3>
            </div>
            {/* grid auto-rows-fr garante que as linhas do grid tenham a mesma altura base */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(PLANOS).map((id) => (
                <PlanCard
                  key={id}
                  priceId={id}
                  onCheckout={handleCheckout}
                  loadingPlan={loadingPlan}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <Card className="bg-gray-900/40 border-gray-800">
            <CardHeader>
              <CardTitle className="text-sm uppercase text-gray-500">
                Recursos Premium
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                "Agenda Online 24/7",
                "Lembretes Automáticos",
                "Controle Financeiro",
                "Link Personalizado",
                "Suporte Prioritário",
              ].map((f, i) => (
                <div key={i} className="flex gap-2 text-sm text-gray-300">
                  <CheckCircle2
                    size={16}
                    className={isActive ? "text-green-500" : "text-gray-600"}
                  />{" "}
                  {f}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
