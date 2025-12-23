import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { ServiceProviderProfile } from "../../types";
import {
  Loader2,
  CreditCard,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Zap,
  ArrowRight,
  History,
  Settings,
} from "lucide-react";
import toast from "react-hot-toast";

// Importar o serviço de assinatura
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../../firebase/subscriptionService";

// IDs dos Planos (Certifique-se que batem com seu backend/Stripe)
const PLANOS = {
  MENSAL: "price_1SMeWT3zDQy3p6yeWl0LC4wi",
  TRIMESTRAL: "price_1SMeWT3zDQy3p6yezkMmrByP",
  ANUAL: "price_1SO7sB3zDQy3p6yevNXLXO8v",
};

// Mapeamento de informações dos planos para UI
const PLAN_DETAILS = {
  [PLANOS.MENSAL]: {
    name: "Mensal",
    price: "R$ 49,90",
    period: "/mês",
    label: "Flexibilidade",
  },
  [PLANOS.TRIMESTRAL]: {
    name: "Trimestral",
    price: "R$ 135,00",
    period: "/trimestre",
    label: "Popular",
  },
  [PLANOS.ANUAL]: {
    name: "Anual",
    price: "R$ 468,00",
    period: "/ano",
    label: "Melhor Valor",
  },
};

const FeatureItem = ({ text }: { text: string }) => (
  <li className="flex items-center text-sm text-gray-300">
    <CheckCircle2 className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
    {text}
  </li>
);

const PlanCard = ({
  priceId,
  onCheckout,
  loadingPlan,
}: {
  priceId: string;
  currentPlanId?: string; // Se soubermos qual é o atual (opcional)
  onCheckout: (id: string) => void;
  loadingPlan: string | null;
}) => {
  const details = PLAN_DETAILS[priceId as keyof typeof PLANOS];
  const isPopular = priceId === PLANOS.TRIMESTRAL;

  return (
    <div
      className={`relative flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl ${
        isPopular
          ? "bg-gray-800/80 border-amber-500/50 shadow-amber-900/20"
          : "bg-gray-800/40 border-gray-700 hover:border-gray-600"
      }`}
    >
      {isPopular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-gray-900 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          Mais Escolhido
        </span>
      )}

      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-200">{details.name}</h3>
        <div className="flex items-baseline mt-1">
          <span className="text-3xl font-bold text-white">{details.price}</span>
          <span className="text-gray-500 text-sm ml-1">{details.period}</span>
        </div>
      </div>

      <ul className="space-y-3 mb-6 flex-grow">
        <FeatureItem text="Agendamentos Ilimitados" />
        <FeatureItem text="Gestão Financeira Completa" />
        {priceId !== PLANOS.MENSAL && (
          <FeatureItem text="Relatórios Avançados" />
        )}
        {priceId === PLANOS.ANUAL && <FeatureItem text="2 Meses Grátis" />}
      </ul>

      <button
        onClick={() => onCheckout(priceId)}
        disabled={!!loadingPlan}
        className={`w-full py-2.5 rounded-lg font-medium text-sm transition-colors flex items-center justify-center ${
          isPopular
            ? "bg-amber-500 hover:bg-amber-400 text-gray-900"
            : "bg-gray-700 hover:bg-gray-600 text-white"
        }`}
      >
        {loadingPlan === priceId ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Escolher Plano"
        )}
      </button>
    </div>
  );
};

export const SubscriptionManagement = () => {
  const { userProfile } = useProfileStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  if (!userProfile) {
    return (
      <div className="flex justify-center p-12">
        <Loader2 className="animate-spin text-amber-500" size={32} />
      </div>
    );
  }

  const profile = userProfile as ServiceProviderProfile;
  const status = profile.subscriptionStatus || "free"; // Fallback para free

  const handleCheckout = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      if (url) window.location.href = url;
      else throw new Error("URL de checkout inválida");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      setLoadingPlan(null);
    }
  };

  const handleCustomerPortal = async () => {
    setIsPortalLoading(true);
    try {
      const { url } = await createCustomerPortalSession();
      if (url) window.location.href = url;
      else throw new Error("URL do portal inválida");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao acessar portal. Tente novamente.");
      setIsPortalLoading(false);
    }
  };

  const isSubscriptionActive = status === "active" || status === "trialing";

  return (
    <div className="max-w-6xl mx-auto space-y-8 p-4">
      {/* Cabeçalho */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            Assinatura e Cobrança
          </h2>
          <p className="text-gray-400 mt-1">
            Gerencie seu plano, métodos de pagamento e faturas.
          </p>
        </div>

        {/* Botão de Portal (Só aparece se já for assinante ou já teve assinatura) */}
        {status !== "free" && (
          <button
            onClick={handleCustomerPortal}
            disabled={isPortalLoading}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-lg transition-colors border border-gray-700 text-sm font-medium"
          >
            {isPortalLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Settings className="h-4 w-4" />
            )}
            Gerenciar no Stripe
          </button>
        )}
      </div>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Coluna da Esquerda: Status Atual */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card de Status */}
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
            <div className="p-6 md:p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      isSubscriptionActive
                        ? "bg-green-500/10 text-green-400"
                        : "bg-red-500/10 text-red-400"
                    }`}
                  >
                    {isSubscriptionActive ? (
                      <ShieldCheck size={32} />
                    ) : (
                      <AlertTriangle size={32} />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      Status da Assinatura
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                          isSubscriptionActive
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSubscriptionActive ? "bg-green-400" : "bg-red-400"
                          }`}
                        />
                        {status === "active"
                          ? "ATIVA"
                          : status === "past_due"
                          ? "PAGAMENTO PENDENTE"
                          : "INATIVA"}
                      </span>
                      {status === "active" && (
                        <span className="text-gray-500 text-sm">
                          • Renovação Automática
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {isSubscriptionActive ? (
                <div className="space-y-4">
                  <p className="text-gray-300">
                    Você tem acesso total aos recursos <strong>Premium</strong>.
                    Sua próxima fatura será processada automaticamente.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                    <button
                      onClick={handleCustomerPortal}
                      className="flex items-center justify-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-all group"
                    >
                      <CreditCard className="text-amber-500 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-200">
                        Alterar Cartão
                      </span>
                    </button>
                    <button
                      onClick={handleCustomerPortal}
                      className="flex items-center justify-center gap-2 p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 rounded-lg transition-all group"
                    >
                      <History className="text-blue-500 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-medium text-gray-200">
                        Ver Faturas
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-4">
                  <p className="text-red-200 text-sm">
                    Sua assinatura não está ativa. Para reativar seu acesso e
                    evitar bloqueio da agenda, selecione um plano abaixo.
                  </p>
                </div>
              )}
            </div>

            {/* Barra de progresso visual (Decorativa para dar sensação de dashboard) */}
            {isSubscriptionActive && (
              <div className="h-1.5 w-full bg-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 w-[75%]"
                  title="Ciclo de cobrança atual"
                />
              </div>
            )}
          </div>

          {/* Seção de Planos Disponíveis */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-amber-500" size={20} />
              <h3 className="text-lg font-semibold text-white">
                {isSubscriptionActive
                  ? "Alterar seu Plano"
                  : "Escolha seu Plano Ideal"}
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.values(PLANOS).map((planId) => (
                <PlanCard
                  key={planId}
                  priceId={planId}
                  onCheckout={handleCheckout}
                  loadingPlan={loadingPlan}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Coluna da Direita: Benefícios e Ajuda */}
        <div className="space-y-6">
          {/* Card de Benefícios Ativos */}
          <div className="bg-gray-800/40 rounded-xl border border-gray-700 p-6">
            <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="text-amber-400 h-5 w-5" />
              Recursos Inclusos
            </h3>
            <ul className="space-y-4">
              {[
                "Agenda Online 24/7",
                "Lembretes Automáticos",
                "Gestão de Profissionais",
                "Controle Financeiro",
                "Link Personalizado",
                "Suporte Prioritário",
              ].map((item, idx) => (
                <li
                  key={idx}
                  className={`flex items-start gap-3 text-sm ${
                    isSubscriptionActive ? "text-gray-300" : "text-gray-500"
                  }`}
                >
                  <CheckCircle2
                    className={`h-5 w-5 flex-shrink-0 ${
                      isSubscriptionActive ? "text-green-500" : "text-gray-600"
                    }`}
                  />
                  {item}
                </li>
              ))}
            </ul>
            {!isSubscriptionActive && (
              <div className="mt-6 p-3 bg-gray-800 rounded text-xs text-center text-gray-400">
                Assine agora para desbloquear todos os recursos.
              </div>
            )}
          </div>

          {/* Dúvidas Frequentes / Ajuda Rápida */}
          <div className="bg-gray-800/20 rounded-xl border border-gray-800 p-6">
            <h3 className="text-gray-200 font-medium mb-4 flex items-center gap-2">
              <Calendar className="text-blue-400 h-4 w-4" />
              Ciclo de Cobrança
            </h3>
            <p className="text-sm text-gray-400 mb-4">
              A cobrança é feita automaticamente no cartão cadastrado. Você pode
              cancelar a qualquer momento sem multa.
            </p>
            <button
              onClick={handleCustomerPortal}
              className="text-amber-500 hover:text-amber-400 text-sm font-medium flex items-center gap-1 transition-colors"
            >
              Precisa de nota fiscal? <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Componente auxiliar simples para ícone
function Sparkles({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
  );
}
