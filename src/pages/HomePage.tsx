// src/pages/HomePage.tsx

import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { TrendingUp } from "lucide-react";
import { httpsCallable } from "@firebase/functions";
import { useAuthStore } from "../store/authStore";
import { useProfileStore } from "../store/profileStore";
import { toast } from "react-hot-toast";
import { functions } from "../firebase/config";
import type { ServiceProviderProfile } from "../types";

// --- Interfaces ---
interface AnimateOnScrollProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

// --- Componentes Auxiliares ---

const AnimateOnScroll = ({
  children,
  delay = 0,
  className = "",
}: AnimateOnScrollProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(element);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(element);

    return () => {
      if (element) observer.unobserve(element);
    };
  }, []);

  return (
    <div
      ref={ref}
      className={`${className} transition-all ease-out duration-1000`}
      style={{
        transitionDelay: `${delay}ms`,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
      }}
    >
      {children}
    </div>
  );
};

const CalendarIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 sm:h-12 sm:w-12 mb-4 text-[#daa520]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);
const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-10 w-10 sm:h-12 sm:w-12 mb-4 text-[#daa520]"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1.5}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h1a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.881 4.002l.023.023a1.5 1.5 0 002.121 2.121l.023.023M16.119 4.002l-.023.023a1.5 1.5 0 01-2.121 2.121l-.023.023M12 21a9 9 0 100-18 9 9 0 000 18z"
    />
  </svg>
);
const TrendingUpSvgIcon = () => (
  <TrendingUp className="h-10 w-10 sm:h-12 sm:w-12 mb-4 text-[#daa520]" />
);
const CheckIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 text-[#daa520] flex-shrink-0"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
      clipRule="evenodd"
    />
  </svg>
);

const FeatureCard = ({ icon, title, description }: FeatureCardProps) => (
  <div className="group [perspective:1000px] h-full">
    <div className="relative bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl shadow-lg h-full p-6 sm:p-8 transition-all duration-500 [transform-style:preserve-3d] group-hover:[transform:rotateY(15deg)_rotateX(5deg)]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#daa520]/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
      <div className="relative z-10 flex flex-col items-center text-center">
        {icon}
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// --- Componente Principal ---

const Home = () => {
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const { user } = useAuthStore();
  const { userProfile } = useProfileStore();
  const navigate = useNavigate();

  const isProvider = userProfile?.role === "serviceProvider";
  const subscriptionStatus = isProvider
    ? (userProfile as ServiceProviderProfile)?.subscriptionStatus
    : undefined;

  const isSubscribed = isProvider && subscriptionStatus === "active";

  const handleCheckout = async (priceId: string) => {
    if (!user || !userProfile) {
      toast.error("Você precisa estar logado para assinar.");
      navigate("/login?type=register", { state: { from: location } });
      return;
    }

    if (userProfile.role === "client") {
      toast.error("Nossos planos são exclusivos para Prestadores de Serviço.");
      return;
    }

    if (isSubscribed) {
      toast.success("Você já é um assinante!");
      navigate("/dashboard");
      return;
    }

    setIsLoading(true);
    toast.loading("Redirecionando para o pagamento...");

    try {
      const createStripeCheckout = httpsCallable(functions, "createStripeCheckout");
      const successUrl = `${window.location.origin}/dashboard?payment=success`;
      const cancelUrl = window.location.origin;

      const result = await createStripeCheckout({ priceId, successUrl, cancelUrl });
      const { sessionUrl } = result.data as { sessionUrl: string };
      window.location.href = sessionUrl;
    } catch (error) {
      console.error("Erro ao iniciar pagamento:", error);
      toast.dismiss();
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
      setIsLoading(false);
    }
  };

  const renderPlanButton = (priceId: string, text: string, popular: boolean = false) => {
    const baseClasses = "mt-auto w-full block text-center font-bold py-3 px-6 rounded-lg transition-colors duration-300";
    
    if (userProfile && userProfile.role === "client") {
      return (
        <button disabled className={`${baseClasses} bg-gray-800 text-white opacity-50 cursor-not-allowed`}>
          Exclusivo para Prestadores
        </button>
      );
    }

    if (isSubscribed) {
      return (
        <button
          onClick={() => navigate("/dashboard")}
          className={`${baseClasses} ${popular ? "bg-black text-white hover:bg-gray-800" : "bg-gray-800 text-white group-hover:bg-[#daa520] group-hover:text-black"}`}
        >
          Ver meu Dashboard
        </button>
      );
    }

    return (
      <button
        onClick={() => handleCheckout(priceId)}
        disabled={isLoading}
        className={`${baseClasses} disabled:opacity-50 ${popular ? "bg-black text-white hover:bg-gray-800" : "bg-gray-800 text-white group-hover:bg-[#daa520] group-hover:text-black"}`}
      >
        {isLoading ? "Aguarde..." : text}
      </button>
    );
  };

  return (
    <div className="bg-black text-white overflow-x-hidden">
      {/* SEÇÃO HERO */}
      {/* MUDANÇA: min-h-[100dvh] é melhor para mobile que min-h-screen */}
      <section className="relative min-h-[100dvh] flex items-center justify-center px-4 py-16 sm:py-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black to-gray-950"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-[#daa520]/10 rounded-full blur-3xl animate-pulse"></div>
        
        <div className="relative z-10 text-center w-full max-w-4xl mx-auto">
          <AnimateOnScroll>
            {/* MUDANÇA: Tamanhos de fonte responsivos (text-4xl no mobile) */}
            <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tighter mb-6 leading-tight">
              O seu negócio,{" "}
              <span className="text-[#daa520] block sm:inline">sempre agendado.</span>
            </h1>
          </AnimateOnScroll>
          
          <AnimateOnScroll delay={200}>
            <p className="max-w-xl mx-auto text-base sm:text-lg md:text-xl text-gray-300 mb-8 sm:mb-10 px-2">
              Simplifique a gestão do seu tempo, automatize seus agendamentos e
              ofereça a melhor experiência para seus clientes.
            </p>
          </AnimateOnScroll>
          
          <AnimateOnScroll delay={400}>
            {/* MUDANÇA: Flex-col no mobile para botões full-width */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto px-4 sm:px-0">
              <Link
                to="/dashboard"
                className="w-full sm:w-auto bg-[#daa520] text-black font-bold py-3.5 px-8 rounded-lg text-base sm:text-lg hover:bg-[#c8961e] transition-transform duration-300 hover:scale-105 active:scale-95 text-center"
              >
                Agendar Horário
              </Link>
              <Link
                to="/login?type=register"
                className="w-full sm:w-auto bg-transparent border-2 border-[#daa520] text-[#daa520] font-bold py-3.5 px-8 rounded-lg text-base sm:text-lg hover:bg-[#daa520] hover:text-black transition-all duration-300 active:scale-95 text-center"
              >
                Trabalhe Conosco
              </Link>
            </div>
          </AnimateOnScroll>
        </div>
      </section>

      {/* SEÇÃO FEATURES */}
      <section className="py-16 sm:py-24 md:py-32 bg-black/50">
        <div className="container mx-auto px-4">
          <AnimateOnScroll className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tudo que você precisa
            </h2>
            <p className="text-base sm:text-lg text-gray-400 mt-2">
              Ferramentas poderosas para alavancar seu negócio.
            </p>
          </AnimateOnScroll>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <AnimateOnScroll>
              <FeatureCard
                icon={<CalendarIcon />}
                title="Agenda Inteligente"
                description="Visualize e gerencie todos os seus compromissos com uma interface simples e intuitiva."
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay={200}>
              <FeatureCard
                icon={<GlobeIcon />}
                title="Página Pública"
                description="Seus clientes podem agendar horários diretamente pela sua página personalizada, disponível 24/7."
              />
            </AnimateOnScroll>
            <AnimateOnScroll delay={400}>
              <FeatureCard
                icon={<TrendingUpSvgIcon />}
                title="Gestão Financeira"
                description="Acompanhe seus ganhos, controle suas despesas e tenha uma visão clara da saúde financeira."
              />
            </AnimateOnScroll>
          </div>
        </div>
      </section>

      {/* SEÇÃO PLANOS */}
      <section className="py-16 sm:py-24 md:py-32 bg-black">
        <div className="container mx-auto px-4">
          <AnimateOnScroll className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Planos transparentes
            </h2>
            <p className="text-base sm:text-lg text-gray-400 mt-2">
              Escolha o plano perfeito para o tamanho do seu negócio.
            </p>
          </AnimateOnScroll>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {/* PLANO MENSAL */}
            <AnimateOnScroll>
              <div className="group relative bg-black border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col h-full transition-all duration-300 hover:border-[#daa520]/50">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-[#daa520] mb-2">Mensal</h3>
                  <p className="text-3xl sm:text-4xl font-extrabold mb-1">
                    R$49<span className="text-lg sm:text-xl font-medium text-gray-400">,99/mês</span>
                  </p>
                  <p className="text-sm text-gray-400 mb-6">Flexibilidade total.</p>
                  <ul className="space-y-4 mb-8 text-sm sm:text-base">
                    <li className="flex items-center gap-3"><CheckIcon /> Agendamentos ilimitados</li>
                    <li className="flex items-center gap-3"><CheckIcon /> Gestão de Clientes</li>
                    <li className="flex items-center gap-3"><CheckIcon /> Página Pública</li>
                  </ul>
                  {renderPlanButton("price_1SMeWT3zDQy3p6yeWl0LC4wi", "Começar", false)}
                </div>
              </div>
            </AnimateOnScroll>

            {/* PLANO ANUAL */}
            <AnimateOnScroll delay={200}>
              <div className="group relative bg-[#daa520] border-2 border-[#c8961e] rounded-2xl p-6 sm:p-8 flex flex-col h-full scale-100 lg:scale-105 shadow-2xl shadow-[#daa520]/20">
                <div className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 bg-black text-[#daa520] text-xs font-bold px-3 py-1 rounded-full transform rotate-12">
                  MAIS POPULAR
                </div>
                <div className="relative z-10 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-black mb-2">Anual</h3>
                  <p className="text-3xl sm:text-4xl font-extrabold text-black mb-1">
                    R$34<span className="text-lg sm:text-xl font-medium text-black/70">,99/mês</span>
                  </p>
                  <p className="text-sm text-black/70 mb-6">Melhor custo-benefício.</p>
                  <ul className="space-y-4 mb-8 text-black/80 text-sm sm:text-base">
                    <li className="flex items-center gap-3"><CheckIcon /> Tudo do plano Trimestral</li>
                    <li className="flex items-center gap-3"><CheckIcon /> Suporte Prioritário</li>
                    <li className="flex items-center gap-3"><CheckIcon /> Acesso a novas features</li>
                  </ul>
                  {renderPlanButton("price_1SO7sB3zDQy3p6yevNXLXO8v", "Economize 30%", true)}
                </div>
              </div>
            </AnimateOnScroll>

            {/* PLANO TRIMESTRAL */}
            <AnimateOnScroll delay={400}>
              <div className="group relative bg-black border border-white/10 rounded-2xl p-6 sm:p-8 flex flex-col h-full transition-all duration-300 hover:border-[#daa520]/50">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative z-10 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-[#daa520] mb-2">Trimestral</h3>
                  <p className="text-3xl sm:text-4xl font-extrabold mb-1">
                    R$44<span className="text-lg sm:text-xl font-medium text-gray-400">,99/mês</span>
                  </p>
                  <p className="text-sm text-gray-400 mb-6">Economia média.</p>
                  <ul className="space-y-4 mb-8 text-sm sm:text-base">
                    <li className="flex items-center gap-3"><CheckIcon /> Tudo do plano Mensal</li>
                    <li className="flex items-center gap-3"><CheckIcon /> Relatórios Simplificados</li>
                    <li className="flex items-center gap-3"><CheckIcon /> Gestão de Equipe (até 3)</li>
                  </ul>
                  {renderPlanButton("price_1SMeWT3zDQy3p6yezkMmrByP", "Começar", false)}
                </div>
              </div>
            </AnimateOnScroll>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;