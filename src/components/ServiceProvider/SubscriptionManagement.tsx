import { useState } from "react";
import { useProfileStore } from "../../store/profileStore";
import type { ServiceProviderProfile } from "../../types";
import { Loader2, Sparkles, CreditCard, ShieldX, Check } from "lucide-react";
import toast from "react-hot-toast";

// Importar o serviço de assinatura
import {
  createCheckoutSession,
  createCustomerPortalSession,
} from "../../firebase/subscriptionService";

// !! IMPORTANTE !!
// IDs atualizados para bater com o seu backend
const PLANOS = {
  MENSAL: "price_1SMeWT3zDQy3p6yeWl0LC4wi",
  TRIMESTRAL: "price_1SMeWT3zDQy3p6yezkMmrByP",
  ANUAL: "price_1SO7sB3zDQy3p6yevNXLXO8v",
};

// Componente auxiliar para o Card do Plano
const PlanCard = ({
  title,
  price,
  period,
  description,
  features,
  priceId,
  onCheckout,
  loadingPlan,
  isPopular = false,
}: any) => (
  <div
    className={`bg-gray-800 p-6 rounded-lg border-2 ${
      isPopular ? "border-amber-500" : "border-gray-700"
    } ${loadingPlan === priceId ? "opacity-70" : ""}`}
  >
    {isPopular && (
      <span className="inline-block bg-amber-500 text-black text-xs font-bold px-3 py-1 rounded-full -mt-2 mb-3">
        MAIS POPULAR
      </span>
    )}
    <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
    <div className="flex items-baseline mb-4">
      <span className="text-4xl font-bold text-white">{price}</span>
      <span className="text-gray-400 ml-1">/ {period}</span>
    </div>
    <p className="text-gray-400 mb-5">{description}</p>
    <ul className="space-y-2 mb-6">
      {features.map((feature: string) => (
        <li key={feature} className="flex items-center text-gray-300">
          <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          {feature}
        </li>
      ))}
    </ul>
    <button
      onClick={() => onCheckout(priceId)}
      disabled={loadingPlan}
      className={`w-full primary-button ${
        isPopular ? "" : "bg-gray-700 hover:bg-gray-600"
      } flex items-center justify-center`}
    >
      {loadingPlan === priceId ? (
        <Loader2 className="animate-spin" />
      ) : (
        "Assinar Agora"
      )}
    </button>
  </div>
);

export const SubscriptionManagement = () => {
  const { userProfile } = useProfileStore();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  if (!userProfile) {
    return <Loader2 className="animate-spin text-amber-500" size={32} />;
  }

  const profile = userProfile as ServiceProviderProfile;
  const status = profile.subscriptionStatus;

  // Função que chama o backend e redireciona (agora com priceId)
  const handleCheckout = async (priceId: string) => {
    setLoadingPlan(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Não foi possível obter a URL de checkout.");
      }
    } catch (error) {
      console.error("Erro ao criar sessão de checkout:", error);
      toast.error(
        `Erro ao iniciar assinatura: ${
          error instanceof Error ? error.message : "Tente novamente."
        }`
      );
      setLoadingPlan(null);
    }
  };

  // Função para o Portal do Cliente
  const handleCustomerPortal = async () => {
    setIsPortalLoading(true);
    try {
      const { url } = await createCustomerPortalSession();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error("Não foi possível obter a URL do portal.");
      }
    } catch (error) {
      console.error("Erro ao acessar portal do cliente:", error);
      toast.error(
        "Erro ao acessar seu portal. Tente novamente mais tarde."
      );
      setIsPortalLoading(false);
    }
  };

  const renderContent = () => {
    switch (status) {
      case "active":
        return (
          <div className="text-center">
            <h3 className="text-xl font-semibold text-green-400 mb-2">
              Plano Ativo
            </h3>
            <p className="text-gray-300 mb-6">
              Sua assinatura está em dia. Obrigado por fazer parte!
            </p>
            <button
              onClick={handleCustomerPortal}
              disabled={isPortalLoading}
              className="primary-button flex items-center justify-center mx-auto"
            >
              {isPortalLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>
                  <CreditCard className="mr-2" size={20} />
                  Gerenciar Assinatura
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 mt-2">
              (Cancelar, atualizar método de pagamento, etc.)
            </p>
          </div>
        );

      case "past_due":
      case "cancelled":
        return (
          <div className="text-center bg-red-900/50 border border-red-700 p-6 rounded-lg">
            <ShieldX className="mx-auto text-red-400 mb-4" size={48} />
            <h3 className="text-2xl font-bold text-red-300 mb-2">
              {status === "past_due"
                ? "Pagamento Pendente"
                : "Assinatura Cancelada"}
            </h3>
            <p className="text-gray-300 mb-6">
              Sua assinatura não está ativa. Para continuar usando a plataforma,
              por favor, escolha um plano.
            </p>
            <button
              onClick={() => handleCheckout(PLANOS.MENSAL)} // Regulariza com o mensal
              disabled={!!loadingPlan}
              className="primary-button bg-red-600 hover:bg-red-700 w-full flex items-center justify-center"
            >
              {loadingPlan === PLANOS.MENSAL ? (
                <Loader2 className="animate-spin" />
              ) : (
                "Regularizar com Plano Mensal"
              )}
            </button>
            <p className="text-sm text-gray-400 my-4">Ou escolha outro plano abaixo:</p>
            {renderPlanSelection()}
          </div>
        );

      case "trial":
      case "free":
      default:
        return (
          <div className="text-center">
            <Sparkles className="mx-auto text-amber-400 mb-4" size={48} />
            <h3 className="text-2xl font-bold text-amber-300 mb-2">
              {status === "trial"
                ? "Seu período de Teste está Ativo!"
                : "Mude para o Plano Pro!"}
            </h3>
            <p className="text-gray-300 mb-8 max-w-lg mx-auto">
              Libere todo o potencial da plataforma com o plano Pro.
              Agendamentos ilimitados, gestão financeira e muito mais.
            </p>
            {renderPlanSelection()}
          </div>
        );
    }
  };

  // Nova função para renderizar os 3 cards de plano
  const renderPlanSelection = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <PlanCard
        title="Plano Mensal"
        price="R$ 49" // Você pode ajustar esses valores
        period="mês"
        description="Ideal para começar com flexibilidade."
        features={["Agenda Online", "Gestão de Clientes", "Lembretes via App"]}
        priceId={PLANOS.MENSAL}
        onCheckout={handleCheckout}
        loadingPlan={loadingPlan}
      />
      <PlanCard
        title="Plano Trimestral"
        price="R$ 135"
        period="trimestre"
        description="Economize 10% com o plano trimestral."
        features={[
          "Tudo do Mensal",
          "Relatórios Financeiros",
          "Suporte Prioritário",
        ]}
        priceId={PLANOS.TRIMESTRAL}
        onCheckout={handleCheckout}
        loadingPlan={loadingPlan}
        isPopular={true}
      />
      <PlanCard
        title="Plano Anual"
        price="R$ 468"
        period="ano"
        description="O melhor custo-benefício, 2 meses grátis."
        features={[
          "Tudo do Trimestral",
          "Gestão de Profissionais",
          "Página Pública Otimizada",
        ]}
        priceId={PLANOS.ANUAL}
        onCheckout={handleCheckout}
        loadingPlan={loadingPlan}
      />
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-3xl font-bold text-white mb-8 text-center">
        Minha Assinatura
      </h2>
      <div className="bg-gray-800/60 p-8 rounded-xl shadow-lg">
        {renderContent()}
      </div>
    </div>
  );
};